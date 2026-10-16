// ============================================================================
// A peça da Moneta: um anel de "resina escura" com seção elíptica que torce ao
// longo do percurso, linhas de fluxo correndo pela superfície e partículas em
// órbita. É a ideia do produto em forma -- dinheiro solto virando um sistema --
// e é UMA peça só para a página inteira: vive num canvas fixo atrás do
// conteúdo e "atraca" no ponto focal de cada capítulo (ver OrbitStage.tsx).
//
// Quem dirige a peça entrega uma Pose em coordenadas de tela (px); a cena
// amortece o caminho até ela, então a troca de capítulo vira um voo, e dentro
// do capítulo a peça acompanha o conteúdo rolando.
//
//   dissolve  0..1  o anel se desfaz em fragmentos com borda luminosa
//   scatter   0..1  as partículas saem da órbita e se espalham
//   energy    0..1  os sinais correm mais rápido e mais claros ("processando")
//   opacity   0..1  presença na tela; em 0 o laço de render para de vez
//
// Imperativo de propósito (three puro, sem React Three Fiber): é uma cena com
// três objetos, e assim o chunk fica menor e o ciclo de vida (pausar, descartar)
// fica explícito. Carregado sob demanda -- three nunca entra no bundle inicial.
// ============================================================================

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
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

export type SculptureQuality = 'high' | 'low';

export interface Pose {
  /** Centro da peça, em px da viewport. */
  x: number;
  y: number;
  /** Raio externo do anel, em px. */
  radius: number;
  rx: number;
  ry: number;
  rz: number;
  dissolve: number;
  scatter: number;
  energy: number;
  opacity: number;
}

export interface SculptureHandle {
  /** Novo alvo. `flight` = troca de capítulo (caminho mais lento e curvo). */
  setTarget(pose: Pose, opts?: { flight?: boolean; snap?: boolean }): void;
  /** Ponteiro normalizado, -1..1. */
  setPointer(x: number, y: number): void;
  /** Liga/desliga o laço (aba oculta = desligado). */
  setActive(on: boolean): void;
  dispose(): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  quality: SculptureQuality;
  /** Movimento reduzido: sem animação contínua, sem voo; desenha sob demanda. */
  still: boolean;
  onFirstFrame: () => void;
  onContextLost: () => void;
}

// Cores em espaço de exibição (sRGB cru): ShaderMaterial não passa pela
// conversão de cor do three, então o hex vai direto pro shader.
const MINT = new Vector3(0x74 / 255, 0xe8 / 255, 0xae / 255);
const GLOW = new Vector3(0xb8 / 255, 0xff / 255, 0xd5 / 255);

/** Raio externo do anel em unidades de mundo (centro 1,34 + tubo ~0,46). */
const RING_OUTER = 1.8;
const FOV = 30;
const CAM_Z = 7.2;

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
  uniform float uFlow;
  uniform float uReveal;
  uniform float uDissolve;
  uniform float uEnergy;
  uniform vec3 uMint;
  uniform vec3 uGlow;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  // Ruído de valor periódico em x (fecha a volta do anel sem costura).
  float vnoise(vec2 p, float period) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 w = f * f * (3.0 - 2.0 * f);
    float x0 = mod(i.x, period);
    float x1 = mod(i.x + 1.0, period);
    float a = hash2(vec2(x0, i.y));
    float b = hash2(vec2(x1, i.y));
    float c = hash2(vec2(x0, i.y + 1.0));
    float d = hash2(vec2(x1, i.y + 1.0));
    return mix(mix(a, b, w.x), mix(c, d, w.x), w.y);
  }

  void main() {
    // Dissolução em blocos: a superfície é uma grade de placas (como
    // lançamentos), e cada placa cai quando o limiar passa por ela. O limiar
    // mistura acaso por placa com um ruído largo, para a peça se desfazer
    // em regiões e não como estática.
    vec2 grid = vec2(96.0, 12.0);
    vec2 cell = floor(vUv * grid);
    cell.x = mod(cell.x, grid.x);
    float t = hash2(cell) * 0.55 + vnoise(vUv * vec2(10.0, 2.0), 10.0) * 0.45;
    if (t < uDissolve) discard;
    vec2 f = fract(vUv * grid);
    float border = 1.0 - smoothstep(0.0, 0.12, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    float near = 1.0 - smoothstep(0.0, 0.14, t - uDissolve);
    float edge = step(0.002, uDissolve) * (near * 0.9 + border * near * 0.6);

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
    col += mix(vec3(0.015, 0.07, 0.045), uMint, 0.5) * fres * (0.85 + uEnergy * 0.35);

    // Linhas de fluxo: 14 fios correndo ao longo do anel, desenhados da
    // esquerda pra direita durante a entrada (uReveal).
    float lanes = vUv.y * 14.0;
    float id = floor(lanes);
    float d = abs(fract(lanes) - 0.5);
    float w = fwidth(lanes);
    float line = 1.0 - smoothstep(w * 0.6, w * 1.8, d);
    float drawn = 1.0 - smoothstep(uReveal - 0.12, uReveal, vUv.x);
    float facing = 0.35 + 0.65 * smoothstep(0.0, 0.6, ndv);
    col += uMint * line * (0.10 + uEnergy * 0.08) * drawn * facing;

    // Sinais: um por fio, cada um no seu ritmo. uFlow é um relógio próprio,
    // que acelera com uEnergy sem dar saltos.
    float speed = 0.035 + hash(id) * 0.05;
    float x = fract(vUv.x * 2.0 - uFlow * speed - hash(id + 7.0));
    float head = smoothstep(0.0, 0.025, x) * (1.0 - smoothstep(0.025, 0.16, x));
    float halo = (1.0 - smoothstep(w * 0.6, w * 6.0, d)) * head;
    float alive = smoothstep(0.6, 1.0, uReveal);
    col += uGlow * (line * head * (1.25 + uEnergy * 1.2) + halo * (0.18 + uEnergy * 0.25)) * alive * facing;

    col += uGlow * edge * 0.85;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const particleVertex = /* glsl */ `
  ${RING_GLSL}
  uniform float uReveal;
  uniform float uScatter;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  attribute vec4 aOrbit;   // u inicial, raio relativo, fase angular, velocidade
  attribute vec3 aScatter; // posição dispersa
  attribute float aSize;
  varying float vAlpha;

  void main() {
    float u = fract(aOrbit.x + uTime * aOrbit.w);
    vec3 c; vec3 n; vec3 b;
    ringFrame(u, c, n, b);
    float ang = aOrbit.z + uTime * 3.0 * aOrbit.w;
    float rad = tubeRadius(u) * aOrbit.y;
    vec3 orbit = c + n * cos(ang) * rad + b * sin(ang) * rad * 0.7;

    // Organização: entra em órbita com a revelação, sai dela com o scatter.
    float k = smoothstep(0.0, 1.0, clamp(uReveal * 1.15 - aSize * 0.05, 0.0, 1.0));
    float s = smoothstep(0.0, 1.0, clamp(uScatter * 1.3 - aSize * 0.08, 0.0, 1.0));
    k *= 1.0 - s;
    vec3 drift = aScatter + vec3(sin(uTime * 0.3 + aOrbit.z), cos(uTime * 0.25 + aOrbit.z), 0.0) * 0.12;
    vec3 p = mix(drift, orbit, k);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * uSizeScale * (5.5 / -mv.z);
    vAlpha = (0.35 + 0.65 * max(k, s * 0.8)) * (0.55 + 0.45 * sin(uTime * 1.3 + aOrbit.z * 3.0));
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
  uniform float uFlow;
  uniform float uReveal;
  uniform float uDissolve;
  uniform float uOffset;
  uniform vec3 uMint;
  varying float vT;
  void main() {
    float x = fract(vT - uFlow * 0.02 + uOffset);
    float pulse = smoothstep(0.0, 0.02, x) * (1.0 - smoothstep(0.02, 0.3, x));
    float a = (0.10 + pulse * 0.55) * smoothstep(0.2, 1.0, uReveal) * (1.0 - uDissolve);
    gl_FragColor = vec4(uMint * a, a);
  }
`;

type Uniforms = Record<string, { value: unknown }>;

function makeOrbit(radius: number, segments: number, offset: number, uniforms: Uniforms) {
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

const POSE_KEYS: Array<keyof Pose> = ['x', 'y', 'radius', 'rx', 'ry', 'rz', 'dissolve', 'scatter', 'energy', 'opacity'];

export function createSculpture(opts: Options): SculptureHandle {
  const { canvas, quality, still, onFirstFrame, onContextLost } = opts;
  const high = quality === 'high';

  const renderer = new WebGLRenderer({
    canvas,
    antialias: high,
    alpha: true,
    powerPreference: high ? 'high-performance' : 'low-power',
  });
  // Canvas de tela cheia: densidade mais contida que numa peça recortada.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, high ? 1.5 : 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  const shared = {
    uTime: { value: 0 },
    uFlow: { value: 0 },
    uReveal: { value: still ? 1.15 : 0 },
    uDissolve: { value: 0 },
    uScatter: { value: 0 },
    uEnergy: { value: 0 },
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
  const count = high ? 720 : 280;
  const orbitAttr = new Float32Array(count * 4);
  const scatterAttr = new Float32Array(count * 3);
  const sizeAttr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    orbitAttr[i * 4] = Math.random();
    orbitAttr[i * 4 + 1] = 1.25 + Math.pow(Math.random(), 1.6) * 1.9;
    orbitAttr[i * 4 + 2] = Math.random() * Math.PI * 2;
    orbitAttr[i * 4 + 3] = 0.004 + Math.random() * 0.012;
    // Disperso: uma nuvem achatada e larga, como papéis espalhados na mesa.
    const r = 1.6 + Math.random() * 4.2;
    const th = Math.random() * Math.PI * 2;
    scatterAttr[i * 3] = Math.cos(th) * r * 1.35;
    scatterAttr[i * 3 + 1] = Math.sin(th) * r * 0.85;
    scatterAttr[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    sizeAttr[i] = 0.6 + Math.random() * 2.2;
  }
  const pGeo = new BufferGeometry();
  // three exige um atributo `position` para calcular a contagem de vértices;
  // a posição de verdade sai do shader.
  pGeo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  pGeo.setAttribute('aOrbit', new BufferAttribute(orbitAttr, 4));
  pGeo.setAttribute('aScatter', new BufferAttribute(scatterAttr, 3));
  pGeo.setAttribute('aSize', new BufferAttribute(sizeAttr, 1));
  const sizeScale = { value: 1 };
  const pMat = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: { ...shared, uPixelRatio: { value: pixelRatio }, uSizeScale: sizeScale },
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

  // --- estado ----------------------------------------------------------------
  let current: Pose | null = null;
  let target: Pose | null = null;
  let flightUntil = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let active = false;
  let raf = 0;
  let last = performance.now();
  let time = still ? 12 : 0;
  let flow = still ? 12 : 0;
  let revealStart = -1;
  let firstFrame = false;
  let disposed = false;
  let vw = 1;
  let vh = 1;

  function resize() {
    vw = canvas.clientWidth || window.innerWidth;
    vh = canvas.clientHeight || window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
  }

  /** Unidades de mundo por px no plano z = 0. */
  function worldPerPx() {
    return (2 * Math.tan(((FOV / 2) * Math.PI) / 180) * CAM_Z) / vh;
  }

  function settled() {
    if (!current || !target) return true;
    return POSE_KEYS.every((k) => Math.abs((current as Pose)[k] - (target as Pose)[k]) < (k === 'x' || k === 'y' || k === 'radius' ? 0.3 : 0.002));
  }

  function draw(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!current || !target) return;

    // Amortecimento exponencial: rápido dentro do capítulo (a peça acompanha
    // o conteúdo), mais lento na troca de capítulo (voo).
    const flying = now < flightUntil;
    const aPos = still ? 1 : 1 - Math.exp(-(flying ? 3.2 : 14) * dt);
    const aShape = still ? 1 : 1 - Math.exp(-(flying ? 2.6 : 6) * dt);
    for (const k of POSE_KEYS) {
      const a = k === 'x' || k === 'y' ? aPos : aShape;
      current[k] += (target[k] - current[k]) * a;
    }

    if (!still) {
      time += dt;
      flow += dt * (1 + current.energy * 2.6);
      if (current.opacity > 0.05) {
        if (revealStart < 0) revealStart = now;
        const r = Math.min((now - revealStart) / 2400, 1);
        shared.uReveal.value = 1.15 * (1 - Math.pow(1 - r, 3));
      }
    }
    shared.uTime.value = time;
    shared.uFlow.value = flow;
    shared.uDissolve.value = current.dissolve;
    shared.uScatter.value = current.scatter;
    shared.uEnergy.value = current.energy;

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    const wpp = worldPerPx();
    const scale = (current.radius * wpp) / RING_OUTER;
    rig.position.set((current.x - vw / 2) * wpp, -(current.y - vh / 2) * wpp, 0);
    rig.scale.setScalar(Math.max(scale, 0.0001));
    rig.rotation.set(current.rx + pointer.y * 0.14, current.ry + pointer.x * 0.2, current.rz);
    sculpture.rotation.z = still ? 0.4 : time * 0.045;
    halo.rotation.z = still ? 0 : -time * 0.02;
    sizeScale.value = Math.min(Math.max(scale, 0.55), 1.5);

    canvas.style.opacity = current.opacity.toFixed(3);
    if (current.opacity > 0.003) renderer.render(scene, camera);

    if (!firstFrame && current.opacity > 0.003) {
      firstFrame = true;
      onFirstFrame();
    }
  }

  function loop(now: number) {
    raf = 0;
    if (!active || disposed) return;
    draw(now);
    // Invisível e parado: o laço dorme até o próximo alvo visível.
    const idle = current !== null && target !== null && target.opacity === 0 && current.opacity < 0.004 && settled();
    if (!idle) raf = requestAnimationFrame(loop);
  }

  function wake() {
    if (disposed) return;
    if (still) {
      draw(performance.now());
      return;
    }
    if (active && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  const onResize = () => {
    resize();
    wake();
  };
  window.addEventListener('resize', onResize);

  const lost = (e: Event) => {
    e.preventDefault();
    active = false;
    cancelAnimationFrame(raf);
    onContextLost();
  };
  canvas.addEventListener('webglcontextlost', lost);

  resize();

  return {
    setTarget(pose, o = {}) {
      if (!current || o.snap || still) current = { ...pose };
      if (o.flight && !still) flightUntil = performance.now() + 1100;
      target = { ...pose };
      wake();
    },
    setPointer(x, y) {
      pointer.tx = x;
      pointer.ty = y;
      if (current && current.opacity > 0.01) wake();
    },
    setActive(on) {
      if (disposed || on === active) return;
      active = on;
      if (on) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      disposed = true;
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
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
