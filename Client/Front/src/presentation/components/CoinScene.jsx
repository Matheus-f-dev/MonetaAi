import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Cena 3D leve: três moedas de latão giram devagar no hero, com leve
// parallax de mouse. Nenhum asset externo — geometria e material só.
export default function CoinScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0.3, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ── geometria: moeda com borda chanfrada ──
    const coinShape = new THREE.Shape();
    coinShape.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const coinGeo = new THREE.ExtrudeGeometry(coinShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.045,
      bevelSegments: 8,
      curveSegments: 72,
    });
    coinGeo.center();

    const makeCoin = (color, roughness) => new THREE.Mesh(
      coinGeo,
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.88,
        roughness,
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
      })
    );

    const group = new THREE.Group();

    const coinA = makeCoin(0xd9a441, 0.32); // moeda principal, latão claro
    coinA.scale.setScalar(1.9);
    coinA.position.set(0.4, 0.2, 0);
    coinA.rotation.set(0.15, 0.4, 0.08);
    group.add(coinA);

    const coinB = makeCoin(0xb9862f, 0.4); // latão mais escuro, atrás
    coinB.scale.setScalar(1.3);
    coinB.position.set(-1.6, -0.9, -1.4);
    coinB.rotation.set(0.3, 1.1, -0.2);
    group.add(coinB);

    const coinC = makeCoin(0xe6bb6a, 0.28); // menor, mais clara, à frente
    coinC.scale.setScalar(0.95);
    coinC.position.set(-0.5, 1.5, 1.1);
    coinC.rotation.set(-0.2, 2.1, 0.3);
    group.add(coinC);

    scene.add(group);

    // ── luz: quente, com um leve contraponto verde-esmeralda ──
    scene.add(new THREE.AmbientLight(0xfff1d8, 0.55));

    const key = new THREE.DirectionalLight(0xfff4dd, 2.2);
    key.position.set(4, 5, 6);
    scene.add(key);

    const rim = new THREE.PointLight(0x2f9e6c, 3.5, 20, 2);
    rim.position.set(-4, -2, 3);
    scene.add(rim);

    const fill = new THREE.DirectionalLight(0xffffff, 0.4);
    fill.position.set(-3, 2, -4);
    scene.add(fill);

    // ── responsividade ──
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ── parallax sutil de mouse ──
    let targetX = 0, targetY = 0;
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    };
    window.addEventListener('pointermove', onMove);

    // ── loop ──
    const clock = new THREE.Clock();
    let raf;
    const tick = () => {
      const t = clock.getElapsedTime();
      const speed = prefersReducedMotion ? 0 : 1;

      group.rotation.y += 0.0035 * speed;
      coinA.rotation.y += 0.006 * speed;
      coinB.rotation.y -= 0.0045 * speed;
      coinC.rotation.y += 0.008 * speed;

      coinA.position.y = 0.2 + Math.sin(t * 0.6) * 0.08 * speed;
      coinB.position.y = -0.9 + Math.sin(t * 0.5 + 1.5) * 0.08 * speed;
      coinC.position.y = 1.5 + Math.sin(t * 0.7 + 3) * 0.08 * speed;

      group.rotation.x += (targetY * 0.3 - group.rotation.x) * 0.04;
      group.rotation.z += (-targetX * 0.15 - group.rotation.z) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      coinGeo.dispose();
      [coinA, coinB, coinC].forEach((c) => c.material.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="coin-scene" ref={mountRef} aria-hidden="true" />;
}
