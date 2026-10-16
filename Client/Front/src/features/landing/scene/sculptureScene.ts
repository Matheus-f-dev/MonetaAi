// ============================================================================
// A escultura da Moneta: um anel de "resina escura" com seção elíptica que
// torce ao longo do percurso, linhas de fluxo que correm pela superfície e
// partículas que saem dispersas e se organizam em órbita. É a ideia do
// produto em forma: dinheiro solto virando um sistema. Os dois aros finos ao
// redor repetem os anéis concêntricos do logo.
//
// Imperativo de propósito (three puro, sem React Three Fiber): é uma cena
// só, com três objetos, e assim o chunk fica menor e o ciclo de vida
// (pausar fora da tela, descartar no unmount) fica explícito.
//
// Este módulo é carregado sob demanda por BrandSculpture.tsx, depois do
// primeiro paint -- three nunca entra no bundle inicial.
// ============================================================================

import {
  AdditiveBlending,
  DoubleSide,
  BufferAttribute,
  BufferGeometry,
  Group,
  LineLoop,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

export type SculptureVariant = 'hero' | 'closing';
export type SculptureQuality = 'high' | 'low';

export interface SculptureHandle {
  /** Ponteiro normalizado, -1..1 em cada eixo, relativo ao centro do palco. */
  setPointer(x: number, y: number): void;
  /** Quanto o palco já saiu da tela por rolagem, 0..1. */
  setScroll(p: number): void;
  /** Liga/desliga o laço de render (fora da tela ou aba oculta = desligado). */
  setActive(on: boolean): void;
  dispose(): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  variant: SculptureVariant;
  quality: SculptureQuality;
  /** Sem animação contínua: desenha um quadro final e para. */
  still: boolean;
  onFirstFrame: () => void;
  onContextLost: () => void;
}

// Cores em espaço de exibição (sRGB cru): ShaderMaterial não passa pela
// conversão de cor do three, então o hex vai direto pro shader.
const MINT = new Vector3(0x74 / 255, 0xe8 / 255, 0xae / 255);
const GLOW = new Vector3(0xb8 / 255, 0xff / 255, 0xd5 / 255);

// Percurso do anel, compartilhado pelo anel e pelas partículas. Um laço
// levemente selado (sela em z) para não ser um toro plano de catálogo.
const RING_GLSL = /* glsl */ `
  const float TAU = 6.28318530718;
  uniform float uTime;

  vec3 ringCenter(float u) {
    float a = u * TAU;
    return vec3(cos(a) * 1.34, sin(a) * 1.22, sin(2.0 * a) * 0.26);
  }

  float tubeRadius(float u) {
    float a = u * TAU;
    return 0.34 + 0.09 * sin(2.0 * a + uTime * 0.22) + 0.03 * sin(5.0 * a - uTime * 0.35);
  }

  // Referencial ao longo do percurso: n aponta pra fora do laço, b ~ z.
  void ringFrame(float u, out vec3 c, out vec3 n, out vec3 b) {
    c = ringCenter(u);
    vec3 t = normalize(ringCenter(u + 0.0015) - ringCenter(u - 0.0015));
    n = normalize(cross(t, vec3(0.0, 0.0, 1.0)));
    b = normalize(cross(n, t));
  }
`;

const ringVertex = /* glsl */ `
  ${RING_GLSL}
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;

  // Meia torção por volta: a seção elíptica gira 180 graus no percurso, e
  // por ser simétrica a malha fecha sem emenda visível.
  vec3 surface(float u, float v) {
    vec3 c; vec3 n; vec3 b;
    ringFrame(u, c, n, b);
    float phase = v * TAU + u * TAU * 0.5 + uTime * 0.04;
    float r = tubeRadius(u);
    return c + n * cos(phase) * r + b * sin(phase) * r * 0.58;
  }

  void main() {
    vUv = uv;
    float u = uv.x;
    float v = uv.y;
    vec3 p = surface(u, v);
    // Normal analítica por diferença finita: a superfície é calculada aqui,
    // não vem da geometria, então a normal também precisa vir daqui.
    vec3 pu = surface(u + 0.0009, v);
    vec3 pv = surface(u, v + 0.0009);
    vec3 nrm = normalize(cross(pu - p, pv - p));
    vec3 c = ringCenter(u);
    if (dot(nrm, p - c) < 0.0) nrm = -nrm;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    vNormal = normalize(normalMatrix * nrm);
    gl_Position = projectionMatrix * mv;
  }
`;

const ringFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uMint;
  uniform vec3 uGlow;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 3.0);

    // Luz de estúdio: key suave no alto à esquerda, recorte menta atrás à direita.
    vec3 L1 = normalize(vec3(-0.55, 0.75, 0.65));
    vec3 L2 = normalize(vec3(0.85, -0.35, -0.25));
    float wrap = max(dot(N, L1) * 0.5 + 0.5, 0.0);
    float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 110.0);
    float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 36.0);

    // Reflexo de softbox: uma faixa clara no alto, como luz de estúdio
    // refletida numa peça laqueada.
    vec3 R = reflect(-V, N);
    float box = smoothstep(0.48, 0.70, R.y) * (1.0 - smoothstep(0.86, 0.98, R.y))
              * smoothstep(-0.95, -0.25, R.x) * (1.0 - smoothstep(0.25, 0.85, R.x));
    float floorBounce = smoothstep(-0.15, -0.85, R.y);

    vec3 col = vec3(0.022, 0.026, 0.024) * (0.55 + wrap * wrap * 0.9);
    col += vec3(0.80, 0.92, 0.86) * box * 0.42;
    col += uMint * floorBounce * 0.05;
    col += vec3(1.0) * spec1 * 0.75;
    col += uMint * spec2 * 0.55;
    col += mix(vec3(0.015, 0.07, 0.045), uMint, 0.5) * fres * 0.85;

    // Linhas de fluxo: 14 fios correndo ao longo do anel, desenhados da
    // esquerda pra direita durante a entrada (uReveal).
    float lanes = vUv.y * 14.0;
    float id = floor(lanes);
    float d = abs(fract(lanes) - 0.5);
    float w = fwidth(lanes);
    float line = 1.0 - smoothstep(w * 0.6, w * 1.8, d);
    float drawn = 1.0 - smoothstep(uReveal - 0.12, uReveal, vUv.x);
    float facing = 0.35 + 0.65 * smoothstep(0.0, 0.6, ndv);
    col += uMint * line * 0.10 * drawn * facing;

    // Pulsos: um sinal por fio, cada um no seu ritmo.
    float speed = 0.035 + hash(id) * 0.05;
    float x = fract(vUv.x * 2.0 - uTime * speed - hash(id + 7.0));
    float head = smoothstep(0.0, 0.025, x) * (1.0 - smoothstep(0.025, 0.16, x));
    float halo = (1.0 - smoothstep(w * 0.6, w * 6.0, d)) * head;
    float alive = smoothstep(0.6, 1.0, uReveal);
    col += uGlow * (line * head * 1.25 + halo * 0.18) * alive * facing;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const particleVertex = /* glsl */ `
  ${RING_GLSL}
  uniform float uReveal;
  uniform float uPixelRatio;
  attribute vec4 aOrbit;   // u inicial, raio relativo, fase angular, velocidade
  attribute vec3 aScatter; // posição dispersa antes de se organizar
  attribute float aSize;
  varying float vAlpha;

  void main() {
    float u = fract(aOrbit.x + uTime * aOrbit.w);
    vec3 c; vec3 n; vec3 b;
    ringFrame(u, c, n, b);
    float ang = aOrbit.z + uTime * 0.3 * aOrbit.w * 10.0;
    float rad = tubeRadius(u) * aOrbit.y;
    vec3 orbit = c + n * cos(ang) * rad + b * sin(ang) * rad * 0.7;

    float k = smoothstep(0.0, 1.0, clamp(uReveal * 1.15 - aSize * 0.05, 0.0, 1.0));
    vec3 p = mix(aScatter, orbit, k);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (5.5 / -mv.z);
    vAlpha = (0.35 + 0.65 * k) * (0.55 + 0.45 * sin(uTime * 1.3 + aOrbit.z * 3.0));
  }
`;

const particleFragment = /* glsl */ `
  uniform vec3 uGlow;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uGlow * a, a * vAlpha * 0.7);
  }
`;

const orbitVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const orbitFragment = /* glsl */ `
  uniform float uTime;
  uniform float uReveal;
  uniform float uOffset;
  uniform vec3 uMint;
  varying float vT;
  void main() {
    float x = fract(vT - uTime * 0.02 + uOffset);
    float pulse = smoothstep(0.0, 0.02, x) * (1.0 - smoothstep(0.02, 0.3, x));
    float a = (0.10 + pulse * 0.55) * smoothstep(0.2, 1.0, uReveal);
    gl_FragColor = vec4(uMint * a, a);
  }
`;

function makeOrbit(radius: number, segments: number, offset: number, uniforms: Record<string, { value: unknown }>) {
  const positions = new Float32Array(segments * 3);
  const t = new Float32Array(segments);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = 0;
    t[i] = i / segments;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aT', new BufferAttribute(t, 1));
  const mat = new ShaderMaterial({
    vertexShader: orbitVertex,
    fragmentShader: orbitFragment,
    uniforms: { ...uniforms, uOffset: { value: offset } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return new LineLoop(geo, mat);
}

export function createSculpture(opts: Options): SculptureHandle {
  const { canvas, variant, quality, still, onFirstFrame, onContextLost } = opts;
  const high = quality === 'high';

  const renderer = new WebGLRenderer({
    canvas,
    antialias: high,
    alpha: true,
    powerPreference: high ? 'high-performance' : 'low-power',
  });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, high ? 1.75 : 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0, 7.2);

  const shared = {
    uTime: { value: 0 },
    uReveal: { value: still ? 1.15 : 0 },
    uMint: { value: MINT },
    uGlow: { value: GLOW },
  };

  // Anel: um plano subdividido cujo uv vira (u, v) do percurso no shader.
  const ringGeo = new PlaneGeometry(1, 1, high ? 360 : 200, high ? 72 : 40);
  const ringMat = new ShaderMaterial({
    vertexShader: ringVertex,
    fragmentShader: ringFragment,
    uniforms: shared,
    // A superfície é recalculada no shader, então o sentido dos triângulos
    // não é garantido; as duas faces evitam o anel "sumir" por culling.
    side: DoubleSide,
  });
  const ring = new Mesh(ringGeo, ringMat);
  ring.frustumCulled = false;

  // Partículas.
  const count = high ? 720 : 260;
  const orbitAttr = new Float32Array(count * 4);
  const scatterAttr = new Float32Array(count * 3);
  const sizeAttr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    orbitAttr[i * 4] = Math.random();
    orbitAttr[i * 4 + 1] = 1.25 + Math.pow(Math.random(), 1.6) * 1.9;
    orbitAttr[i * 4 + 2] = Math.random() * Math.PI * 2;
    orbitAttr[i * 4 + 3] = 0.004 + Math.random() * 0.012;
    const r = 2.6 + Math.random() * 3.2;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    scatterAttr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    scatterAttr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    scatterAttr[i * 3 + 2] = r * Math.cos(ph) * 0.6;
    sizeAttr[i] = 0.6 + Math.random() * 2.2;
  }
  const pGeo = new BufferGeometry();
  // three exige um atributo `position` para calcular a contagem de vértices;
  // a posição de verdade sai do shader.
  pGeo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  pGeo.setAttribute('aOrbit', new BufferAttribute(orbitAttr, 4));
  pGeo.setAttribute('aScatter', new BufferAttribute(scatterAttr, 3));
  pGeo.setAttribute('aSize', new BufferAttribute(sizeAttr, 1));
  const pMat = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: { ...shared, uPixelRatio: { value: pixelRatio } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const particles = new Points(pGeo, pMat);
  particles.frustumCulled = false;

  // Aros concêntricos do logo.
  const orbitA = makeOrbit(2.2, 256, 0, shared);
  const orbitB = makeOrbit(2.55, 256, 0.5, shared);
  orbitA.rotation.set(0.18, -0.12, 0);
  orbitB.rotation.set(-0.1, 0.16, 0);

  const sculpture = new Group();
  sculpture.add(ring, particles);
  const halo = new Group();
  halo.add(orbitA, orbitB);

  const rig = new Group();
  rig.add(sculpture, halo);
  scene.add(rig);

  // Pose base de cada variante: no hero, três quartos; no fechamento, de
  // frente, como um portal.
  const base =
    variant === 'hero'
      ? { rx: -0.52, ry: 0.42, rz: 0.2, scale: 1 }
      : { rx: -0.18, ry: 0.0, rz: 0.0, scale: 0.92 };

  // --- estado ----------------------------------------------------------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0;
  let active = false;
  let raf = 0;
  let last = performance.now();
  let time = still ? 12 : 0;
  let revealStart = -1;
  let firstFrame = false;
  let disposed = false;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    // Em tela retrato, afasta a câmera pra peça inteira caber.
    camera.position.z = aspect < 1 ? 7.2 / Math.pow(aspect, 0.55) : 7.2;
    camera.updateProjectionMatrix();
  }

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!still) {
      time += dt;
      if (revealStart < 0) revealStart = now;
      const r = Math.min((now - revealStart) / 2400, 1);
      shared.uReveal.value = 1.15 * (1 - Math.pow(1 - r, 3));
    }
    shared.uTime.value = time;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    const s = scroll;
    rig.rotation.x = base.rx + pointer.y * 0.16 + s * 0.45;
    rig.rotation.y = base.ry + pointer.x * 0.22;
    rig.rotation.z = base.rz - s * 0.25;
    sculpture.rotation.z = still ? 0.4 : time * 0.045;
    halo.rotation.z = still ? 0 : -time * 0.02;
    const scale = base.scale * (1 - s * 0.1);
    rig.scale.setScalar(scale);
    rig.position.y = s * 0.55;

    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      onFirstFrame();
    }
  }

  function loop(now: number) {
    if (!active || disposed) return;
    frame(now);
    raf = requestAnimationFrame(loop);
  }

  function renderStill() {
    resize();
    frame(performance.now());
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (!active) frame(performance.now());
  });
  ro.observe(canvas);

  const lost = (e: Event) => {
    e.preventDefault();
    active = false;
    cancelAnimationFrame(raf);
    onContextLost();
  };
  canvas.addEventListener('webglcontextlost', lost);

  resize();
  if (still) renderStill();

  return {
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
    },
    setScroll(p) {
      scroll = p;
      if (still && !disposed) frame(performance.now());
    },
    setActive(on) {
      if (still || disposed || on === active) return;
      active = on;
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    },
    dispose() {
      disposed = true;
      active = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      [orbitA, orbitB].forEach((o) => {
        o.geometry.dispose();
        (o.material as ShaderMaterial).dispose();
      });
      renderer.dispose();
    },
  };
}
