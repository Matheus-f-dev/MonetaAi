import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Cena 3D leve: moedas de latão e cédulas (com textura desenhada na hora,
// sem asset externo) flutuam no hero, giram devagar e reagem ao mouse.
// Posições calculadas à mão pra nunca deixar duas peças se cruzarem —
// ver comentário de distância mínima logo abaixo.
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

    const disposables = [];

    // ───────────────────── moeda ─────────────────────
    const coinShape = new THREE.Shape();
    coinShape.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const coinGeo = new THREE.ExtrudeGeometry(coinShape, {
      depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045,
      bevelSegments: 8, curveSegments: 72,
    });
    coinGeo.center();
    disposables.push(coinGeo);

    const makeCoin = (color, roughness) => new THREE.Mesh(
      coinGeo,
      new THREE.MeshPhysicalMaterial({ color, metalness: 0.88, roughness, clearcoat: 0.35, clearcoatRoughness: 0.25 })
    );

    // ───────────────────── cédula ─────────────────────
    function roundedRectShape(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2, y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    }

    const billShape = roundedRectShape(2.4, 1.1, 0.12);
    const billGeo = new THREE.ExtrudeGeometry(billShape, {
      depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012,
      bevelSegments: 3, curveSegments: 24,
    });
    billGeo.center();
    disposables.push(billGeo);

    // Textura da cédula desenhada em canvas — sem imagem externa.
    function makeBillTexture(base, ink, value) {
      const c = document.createElement('canvas');
      c.width = 768; c.height = 352;
      const ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, c.width, c.height);

      // guilhoché leve: linhas onduladas repetidas
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
      for (let i = -c.height; i < c.width; i += 14) {
        ctx.beginPath();
        for (let x = 0; x <= c.width; x += 8) {
          const yy = i + x * 0.35 + Math.sin(x * 0.04) * 10;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // moldura
      ctx.strokeStyle = ink; ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, c.width - 36, c.height - 36);

      // medalhão com o valor
      ctx.beginPath();
      ctx.arc(170, c.height / 2, 108, 0, Math.PI * 2);
      ctx.fillStyle = ink; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(170, c.height / 2, 92, 0, Math.PI * 2);
      ctx.strokeStyle = base; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = base;
      ctx.font = '700 92px "Zilla Slab", Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(value, 170, c.height / 2 + 6);

      // tipografia de marca
      ctx.fillStyle = ink; ctx.textAlign = 'left';
      ctx.font = '700 40px "Zilla Slab", Georgia, serif';
      ctx.fillText('MONETA', 330, 130);
      ctx.font = '400 22px "JetBrains Mono", monospace';
      ctx.globalAlpha = 0.75;
      ctx.fillText('REPÚBLICA DIGITAL DO SEU DINHEIRO', 330, 168);
      ctx.font = '400 18px "JetBrains Mono", monospace';
      ctx.fillText('SEM PLANILHA · SEM FÓRMULA · SEM ENROLAÇÃO', 330, 240);
      ctx.globalAlpha = 1;

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    }

    const makeBill = (base, ink, value) => {
      const tex = makeBillTexture(base, ink, value);
      disposables.push(tex);
      const capMat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.6, metalness: 0.04, clearcoat: 0.18, clearcoatRoughness: 0.4 });
      const sideMat = new THREE.MeshPhysicalMaterial({ color: base, roughness: 0.7, metalness: 0.04 });
      return new THREE.Mesh(billGeo, [sideMat, capMat]);
    };

    const group = new THREE.Group();

    // ── posições: distância entre centros sempre > soma dos raios + 0.4
    // (coinA r≈1.7, coinB r≈1.15, billA/B r≈1.32×escala — ver cálculo no PR) ──
    const coinA = makeCoin(0xd9a441, 0.32);
    coinA.scale.setScalar(1.7);
    coinA.position.set(0.6, 0.2, 2.6);
    coinA.rotation.set(0.15, 0.4, 0.08);
    group.add(coinA);

    const coinB = makeCoin(0xb9862f, 0.4);
    coinB.scale.setScalar(1.15);
    coinB.position.set(-2.0, -1.3, -3.2);
    coinB.rotation.set(0.3, 1.1, -0.2);
    group.add(coinB);

    const billA = makeBill('#4B2E83', '#F6F1E4', '50');
    billA.scale.setScalar(1.3);
    billA.position.set(-2.0, 1.6, -1.5);
    billA.rotation.set(0.5, 0.9, 0.15);
    group.add(billA);

    const billB = makeBill('#C68A2E', '#1B1730', '10');
    billB.scale.setScalar(1.0);
    billB.position.set(1.6, -1.7, -1.0);
    billB.rotation.set(-0.3, -0.6, -0.1);
    group.add(billB);

    scene.add(group);

    // ── luz: quente, com contraponto violeta (identidade da marca) ──
    scene.add(new THREE.AmbientLight(0xfff1d8, 0.55));

    const key = new THREE.DirectionalLight(0xfff4dd, 2.2);
    key.position.set(4, 5, 6);
    scene.add(key);

    const rim = new THREE.PointLight(0x6b3fb0, 3.2, 20, 2);
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
    const pieces = [coinA, coinB, billA, billB];
    const spins = [0.006, -0.0045, 0.0035, -0.005];
    const bobPhase = [0, 1.5, 3, 4.5];
    const bobBase = pieces.map((p) => p.position.y);

    const tick = () => {
      const t = clock.getElapsedTime();
      const speed = prefersReducedMotion ? 0 : 1;

      group.rotation.y += 0.0032 * speed;
      pieces.forEach((p, i) => {
        p.rotation.y += spins[i] * speed;
        p.position.y = bobBase[i] + Math.sin(t * 0.55 + bobPhase[i]) * 0.09 * speed;
      });

      group.rotation.x += (targetY * 0.28 - group.rotation.x) * 0.04;
      group.rotation.z += (-targetX * 0.14 - group.rotation.z) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      disposables.forEach((d) => d.dispose());
      [coinA, coinB, billA, billB].forEach((mesh) => {
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="coin-scene" ref={mountRef} aria-hidden="true" />;
}
