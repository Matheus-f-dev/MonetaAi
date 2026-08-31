// Controlador do scrub: o scroll do visitante é o cursor do filme.
//
// Invariantes que não devem ser afrouxadas ao mexer aqui:
// - o clipe é buscado pra Blob antes de ser scrubado, senão currentTime deixa
//   de ser confiável quando o servidor responde range de forma diferente;
// - o poster do capítulo fica visível até um frame REAL ter sido pintado;
// - seek é coalescido enquanto video.seeking estiver true, senão um flick
//   rápido monta uma fila de seek e a imagem congela;
// - vídeo mudo inline é "primado" no primeiro gesto por causa do iOS;
// - com prefers-reduced-motion nenhum byte de vídeo é buscado;
// - no unmount tudo é desfeito: fetch abortado, rAF cancelado, listener
//   removido, nó de vídeo removido e Blob revogado.

import { useEffect, useMemo, useRef, useState } from 'react';
import './scroll-scrub.css';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const smoothstep = (value) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

// Segura o meio do clipe sem mexer em nenhum dos dois frames de costura.
const lingerEase = (value, amount) => {
  const x = clamp(value);
  const linger = clamp(amount, 0, 0.6);
  const centered = x - 0.5;
  return (1 - linger) * x + linger * (4 * centered ** 3 + 0.5);
};

function buildSegments(scenes) {
  return scenes.map((scene, index) => {
    if (scene.mobileClip && !scene.mobilePoster) {
      throw new Error(`Capítulo ${scene.id} precisa de mobilePoster junto do mobileClip`);
    }
    return {
      clip: scene.clip,
      key: `chapter:${scene.id}`,
      linger: scene.linger ?? 0,
      mobileClip: scene.mobileClip,
      mobilePoster: scene.mobilePoster,
      mobileObjectPosition: scene.mobileObjectPosition ?? scene.objectPosition ?? '50% 50%',
      objectPosition: scene.objectPosition ?? '50% 50%',
      poster: scene.poster,
      scene,
      sectionIndex: index,
      weight: scene.scroll ?? 1.4,
    };
  });
}

export default function ScrollScrub({ scenes, renderActions, onActiveChange }) {
  const rootRef = useRef(null);
  const controllerRef = useRef(null);
  const onActiveRef = useRef(onActiveChange);
  const [activeSection, setActiveSection] = useState(0);
  const segments = useMemo(() => buildSegments(scenes), [scenes]);

  onActiveRef.current = onActiveChange;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || segments.length === 0) return undefined;

    const layerNodes = [...root.querySelectorAll('[data-scrub-layer]')];
    const bandNodes = [...root.querySelectorAll('[data-scrub-band]')];
    if (layerNodes.length !== segments.length || bandNodes.length !== segments.length) {
      throw new Error('Markup do ScrollScrub está fora de sincronia com os segmentos');
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const smallViewport = window.matchMedia('(max-width: 860px)');
    const isMobile = () => coarsePointer || smallViewport.matches;
    const sourceFor = (segment) => (isMobile() && segment.mobileClip ? segment.mobileClip : segment.clip);

    const runtime = segments.map((segment, index) => ({
      ...segment,
      band: bandNodes[index],
      current: 0,
      end: 0,
      failed: false,
      layer: layerNodes[index],
      loading: false,
      ready: false,
      start: 0,
      target: 0,
      visible: index === 0,
    }));

    let active = -1;
    let destroyed = false;
    let dirty = true;
    let frame = 0;
    let rootTop = 0;
    let total = 1;
    let viewportHeight = window.innerHeight;
    let layoutWidth = window.innerWidth;
    let userReady = false;

    const unloadClip = (segment) => {
      segment.abort?.abort();
      segment.video?.remove();
      if (segment.objectUrl) URL.revokeObjectURL(segment.objectUrl);
      delete segment.abort;
      delete segment.video;
      delete segment.objectUrl;
      delete segment.loadedSource;
      segment.loading = false;
      segment.ready = false;
      segment.failed = false;
      segment.current = segment.target;
      delete segment.layer.dataset.videoPainted;
      delete segment.layer.dataset.videoFailed;
    };

    const layout = () => {
      const pageY = window.scrollY || window.pageYOffset;
      rootTop = root.getBoundingClientRect().top + pageY;
      viewportHeight = window.innerHeight;
      layoutWidth = window.innerWidth;

      for (const segment of runtime) {
        // Trocou desktop por mobile (ou o contrário): o Blob carregado não
        // serve mais, derruba pra buscar a fonte certa.
        if (segment.loadedSource && segment.loadedSource !== sourceFor(segment)) {
          unloadClip(segment);
        }
        const rect = segment.band.getBoundingClientRect();
        segment.start = rect.top + pageY - rootTop;
        segment.end = segment.start + rect.height;
      }
      total = Math.max(runtime.at(-1)?.end ?? viewportHeight, viewportHeight);
      dirty = true;
    };

    const primeVideo = async (video) => {
      if (!video || !isMobile()) return;
      try {
        await video.play();
        video.pause();
      } catch {
        // Mantém o poster. Um gesto ou seek posterior tenta de novo.
      }
    };

    const loadClip = async (segment) => {
      const source = sourceFor(segment);
      if (reduceMotion || destroyed || segment.loading || segment.ready || segment.failed || !source) {
        return;
      }

      segment.loading = true;
      segment.loadedSource = source;
      segment.abort = new AbortController();
      const request = segment.abort;

      try {
        const response = await fetch(source, { signal: request.signal });
        if (!response.ok) throw new Error(`Clipe falhou: ${response.status}`);
        const blob = await response.blob();
        if (destroyed || request.signal.aborted || segment.loadedSource !== source) return;

        const objectUrl = URL.createObjectURL(blob);
        const video = document.createElement('video');
        video.className = 'scrub__video';
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.src = objectUrl;

        video.addEventListener(
          'loadedmetadata',
          () => {
            if (segment.video !== video || segment.loadedSource !== source) return;
            segment.ready = true;
            segment.loading = false;
            dirty = true;
          },
          { once: true },
        );
        video.addEventListener(
          'loadeddata',
          () => {
            if (userReady && segment.video === video && segment.loadedSource === source) {
              void primeVideo(video);
            }
          },
          { once: true },
        );
        video.addEventListener(
          'error',
          () => {
            if (segment.video !== video) return;
            video.remove();
            URL.revokeObjectURL(objectUrl);
            delete segment.video;
            delete segment.objectUrl;
            segment.failed = true;
            segment.loading = false;
            segment.ready = false;
            delete segment.layer.dataset.videoPainted;
            segment.layer.dataset.videoFailed = 'true';
          },
          { once: true },
        );
        // Só esconde o poster depois que um frame real foi pintado.
        video.addEventListener(
          'seeked',
          () => {
            if (segment.video === video && segment.loadedSource === source) {
              segment.layer.dataset.videoPainted = 'true';
            }
          },
          { once: true },
        );

        segment.layer.append(video);
        segment.objectUrl = objectUrl;
        segment.video = video;
      } catch (error) {
        if (
          request.signal.aborted ||
          (error instanceof Error && error.name === 'AbortError') ||
          segment.loadedSource !== source
        ) {
          return;
        }
        segment.layer.dataset.videoFailed = 'true';
        segment.failed = true;
        segment.loading = false;
      }
    };

    const readScroll = () => {
      const pageY = window.scrollY || window.pageYOffset;
      const y = clamp(pageY - rootTop, 0, total);
      const crossfade = 0.1 * viewportHeight;
      let currentIndex = 0;

      for (const [index, segment] of runtime.entries()) {
        if (y >= segment.start) currentIndex = index;

        const length = Math.max(segment.end - segment.start, 1);
        const local = clamp((y - segment.start) / length);
        segment.target = segment.linger ? lingerEase(local, segment.linger) : local;

        let outside = 0;
        if (y < segment.start) outside = segment.start - y;
        if (y > segment.end) outside = y - segment.end;
        let opacity = smoothstep(1 - outside / Math.max(crossfade, 1));
        if (reduceMotion) opacity = outside === 0 ? 1 : 0;

        segment.visible = opacity > 0.001;
        segment.layer.style.opacity = String(opacity);
        segment.layer.style.zIndex = index === currentIndex ? '2' : '1';

        // Carrega só o segmento ativo e os vizinhos.
        if (y > segment.start - 1.5 * viewportHeight && y < segment.end + 1.5 * viewportHeight) {
          void loadClip(segment);
        }
      }

      const nextActive = runtime[currentIndex].sectionIndex;
      if (nextActive !== active) {
        active = nextActive;
        root.dataset.activeSection = String(active);
        setActiveSection(active);
        onActiveRef.current?.(active);
      }

      root.style.setProperty('--scrub-progress', String(clamp(y / total)));
    };

    const updateVideos = () => {
      for (const segment of runtime) {
        const { video } = segment;
        // Coalesce: enquanto o browser está buscando, não empilha outro seek.
        if (!video || !segment.ready || video.seeking) continue;
        if (!segment.visible && Math.abs(segment.current - segment.target) < 0.002) continue;

        segment.current += (segment.target - segment.current) * 0.2;
        const targetTime = clamp(segment.current, 0, 0.999) * (video.duration || 1);
        const epsilon = isMobile() ? 0.02 : 0.008;
        if (Math.abs(video.currentTime - targetTime) > epsilon) {
          try {
            video.currentTime = targetTime;
          } catch {
            // Mantém o último frame pintado enquanto o browser se recupera.
          }
        }
      }
    };

    const tick = () => {
      if (destroyed) return;
      if (dirty) {
        dirty = false;
        readScroll();
      }
      updateVideos();
      frame = window.requestAnimationFrame(tick);
    };

    const onScroll = () => {
      dirty = true;
    };
    // Barra de endereço do browser mobile muda só a altura. Ignorar, senão
    // o layout é recalculado a cada scroll no celular.
    const onResize = () => {
      if (coarsePointer && window.innerWidth === layoutWidth) return;
      layout();
    };
    const onFirstGesture = () => {
      if (userReady) return;
      userReady = true;
      for (const segment of runtime) void primeVideo(segment.video);
    };

    controllerRef.current = {
      jumpToSection(index) {
        const segment = runtime.find((candidate) => candidate.sectionIndex === index);
        if (!segment) return;
        window.scrollTo({
          behavior: reduceMotion ? 'auto' : 'smooth',
          top: rootTop + segment.start + 0.15 * (segment.end - segment.start),
        });
      },
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', layout);
    window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
    window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

    layout();
    frame = window.requestAnimationFrame(tick);

    return () => {
      destroyed = true;
      controllerRef.current = null;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', layout);
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('touchstart', onFirstGesture);
      root.style.removeProperty('--scrub-progress');
      delete root.dataset.activeSection;

      for (const segment of runtime) {
        unloadClip(segment);
        segment.layer.style.removeProperty('opacity');
        segment.layer.style.removeProperty('z-index');
      }
    };
  }, [segments]);

  if (scenes.length === 0) return null;

  return (
    <section className="scrub" ref={rootRef}>
      <div className="scrub__stage">
        <div aria-hidden="true" className="scrub__media">
          {segments.map((segment, index) => (
            <figure
              className="scrub__layer"
              data-scrub-layer=""
              key={segment.key}
              style={{
                '--scrub-mobile-position': segment.mobileObjectPosition,
                '--scrub-object-position': segment.objectPosition,
              }}
            >
              <picture className="scrub__picture">
                {segment.mobilePoster ? (
                  <source
                    media="(hover: none) and (pointer: coarse), (max-width: 860px)"
                    srcSet={segment.mobilePoster}
                  />
                ) : null}
                <img
                  alt=""
                  className="scrub__poster"
                  decoding="async"
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  src={segment.poster}
                />
              </picture>
            </figure>
          ))}
        </div>

        <div aria-hidden="true" className="scrub__progress">
          <span />
        </div>

        <nav aria-label="Capítulos" className="scrub__route">
          {scenes.map((scene, index) => (
            <button
              aria-current={activeSection === index ? 'step' : undefined}
              className="scrub__route-button"
              key={scene.id}
              onClick={() => controllerRef.current?.jumpToSection(index)}
              type="button"
            >
              <span>{scene.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="scrub__story">
        {segments.map((segment) => {
          const { scene } = segment;
          const Heading = segment.sectionIndex === 0 ? 'h1' : 'h2';

          return (
            <article
              className="scrub__chapter"
              data-align={scene.align ?? 'left'}
              data-scrub-band=""
              id={scene.id}
              key={segment.key}
              style={{ minHeight: `${Math.max(segment.weight, 0.2) * 100}dvh` }}
            >
              <div className="scrub__pin">
                <div className="scrub__copy">
                  <Heading className="scrub__title">{scene.title}</Heading>
                  <p className="scrub__body">{scene.body}</p>
                  {renderActions ? (
                    <div className="scrub__actions">{renderActions(segment.sectionIndex)}</div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
