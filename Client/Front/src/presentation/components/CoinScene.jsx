import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Cena 3D leve: moeda de Bitcoin (peça-âncora), cédula de R$200 e medalha
// de $ — tudo com textura desenhada na hora em canvas, sem asset externo —
// flutuam no hero, giram devagar e reagem ao mouse. Posições calculadas à
// mão pra nunca deixar duas peças se cruzarem — ver comentário abaixo.
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

      // moldura dupla
      ctx.strokeStyle = ink; ctx.lineWidth = 6;
      ctx.strokeRect(18, 18, c.width - 36, c.height - 36);
      ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5;
      ctx.strokeRect(28, 28, c.width - 56, c.height - 56);
      ctx.globalAlpha = 1;

      // elemento de segurança: fileira de pontos finos
      ctx.fillStyle = ink; ctx.globalAlpha = 0.35;
      for (let x = 40; x < c.width - 40; x += 10) {
        ctx.beginPath(); ctx.arc(x, c.height - 44, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // valor repetido nos cantos, como cédula de verdade
      ctx.fillStyle = ink; ctx.font = '700 34px "Zilla Slab", Georgia, serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(value, 34, 30);
      ctx.textAlign = 'right';
      ctx.fillText(value, c.width - 34, 30);
      ctx.textBaseline = 'bottom';
      ctx.fillText(value, c.width - 34, c.height - 30);

      // medalhão com o valor
      ctx.beginPath();
      ctx.arc(170, c.height / 2, 108, 0, Math.PI * 2);
      ctx.fillStyle = ink; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(170, c.height / 2, 92, 0, Math.PI * 2);
      ctx.strokeStyle = base; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = base;
      ctx.font = `700 ${value.length > 2 ? 68 : 92}px "Zilla Slab", Georgia, serif`;
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

    // ─────────────────── medalha de símbolo ($ / ₿) ───────────────────
    // Reaproveita a mesma geometria da moeda — só troca a textura da face.
    function makeSymbolTexture(ink, glyph) {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);

      // cunhagem: pequenas marcas radiais junto à borda
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 3;
      for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 90) {
        const x1 = 256 + Math.cos(a) * 226, y1 = 256 + Math.sin(a) * 226;
        const x2 = 256 + Math.cos(a) * 244, y2 = 256 + Math.sin(a) * 244;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // dois anéis de acabamento
      ctx.beginPath(); ctx.arc(256, 256, 210, 0, Math.PI * 2);
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.85; ctx.lineWidth = 8; ctx.stroke();
      ctx.beginPath(); ctx.arc(256, 256, 190, 0, Math.PI * 2);
      ctx.globalAlpha = 0.4; ctx.lineWidth = 2; ctx.stroke();
      ctx.globalAlpha = 1;

      // símbolo em alto-relevo: sombra leve deslocada + traço mais claro por cima
      ctx.font = '700 300px "Hanken Grotesk", Arial, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillText(glyph, 260, 266);
      ctx.fillStyle = ink;
      ctx.fillText(glyph, 256, 260);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    }

    const makeSymbolCoin = (metalColor, ink, glyph, roughness) => {
      const tex = makeSymbolTexture(ink, glyph);
      disposables.push(tex);
      const capMat = new THREE.MeshPhysicalMaterial({ color: metalColor, map: tex, metalness: 0.82, roughness, clearcoat: 0.3, clearcoatRoughness: 0.25 });
      const sideMat = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 0.88, roughness: 0.35 });
      return new THREE.Mesh(coinGeo, [sideMat, capMat]);
    };

    const group = new THREE.Group();

    // ── posições: distância entre centros sempre > soma dos raios + 0.4
    // (coinBTC r≈1.7, nota r≈1.52, $ r≈1.05 — cálculo no PR) ──
    const coinBTC = makeSymbolCoin(0xd9a441, '#3a1f08', '₿', 0.3); // moeda-âncora = Bitcoin
    coinBTC.scale.setScalar(1.7);
    coinBTC.position.set(0.5, 0.1, 2.6);
    coinBTC.rotation.set(0.15, 0.4, 0.08);
    group.add(coinBTC);

    const nota = makeBill('#4B2E83', '#F6F1E4', '200'); // a "nota", virada quase de frente
    nota.scale.setScalar(1.15);
    nota.position.set(-2.1, 1.5, -1.2);
    nota.rotation.set(0.18, 0.35, 0.06);
    group.add(nota);

    const dollarCoin = makeSymbolCoin(0xd9a441, '#2e1b54', '$', 0.3); // medalha $
    dollarCoin.scale.setScalar(1.05);
    dollarCoin.position.set(-1.8, -1.6, -2.8);
    dollarCoin.rotation.set(0.25, 0.7, -0.1);
    group.add(dollarCoin);

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
    const pieces = [coinBTC, nota, dollarCoin];
    const spins = [0.006, -0.0045, 0.0035];
    const bobPhase = [0, 1.5, 3];
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
      [coinBTC, nota, dollarCoin].forEach((mesh) => {
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="coin-scene" ref={mountRef} aria-hidden="true" />;
}
