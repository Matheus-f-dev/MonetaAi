// Matemática de cor pro seletor de cor personalizada (Perfil > Aparência).
// Puro -- sem DOM, fácil de testar/ler isolado do hook que de fato aplica.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = (gn - bn) / d + (gn < bn ? 6 : 0);
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  return [h * 60, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  if (sn === 0) {
    const v = ln * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hn = h / 360;
  return [hue2rgb(p, q, hn + 1 / 3) * 255, hue2rgb(p, q, hn) * 255, hue2rgb(p, q, hn - 1 / 3) * 255];
}

function withLightness(hex: string, targetL: number, satMul = 1): string {
  const [r, g, b] = hexToRgb(hex);
  const [h, s] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h, Math.max(0, Math.min(100, s * satMul)), targetL);
  return rgbToHex(nr, ng, nb);
}

// WCAG 2.x -- luminância relativa (soma ponderada por canal, G pesa quase
// 6x mais que B) e a razão de contraste que vem dela. É o que expõe o bug
// real que a checagem antiga (só o "L" do HSL) não pegava: um verde/
// amarelo bem saturado tem HSL-lightness "médio" (~50%, não dispara o
// corte ingênuo de >55) mas luminância PERCEBIDA altíssima -- pra quem
// olha, é quase tão "claro" quanto um cinza de L~80%. #00FF9D é o caso
// que expôs isso: passava direto pelo corte antigo e ficava com o texto
// do item ativo da sidebar quase invisível sobre o próprio fundo suave
// (os dois claros demais, contraste real abaixo de 2:1).
function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Reescurece/clareia (sempre a partir do HUE/SAT originais, nunca do
// resultado do passo anterior -- evita acumular deriva de matiz a cada
// iteração) até bater o contraste mínimo contra TODOS os fundos onde essa
// cor aparece como texto/ícone. `darken=true` cobre o tema claro (o único
// jeito de description de contraste insuficiente contra um fundo claro é
// a cor estar clara demais); `darken=false` cobre o escuro (só falha por
// estar escura demais). Um teto de 24 passos de 3% cobre 0-100% de sobra.
function ensureContrast(originalHex: string, startHex: string, backgrounds: string[], minRatio: number, darken: boolean): string {
  let candidate = startHex;
  let l = rgbToHsl(...hexToRgb(startHex))[2];
  let iterations = 0;
  while (iterations < 24 && backgrounds.some((bg) => contrastRatio(candidate, bg) < minRatio)) {
    l = darken ? Math.max(0, l - 3) : Math.min(100, l + 3);
    candidate = withLightness(originalHex, l);
    iterations++;
    if (l <= 0 || l >= 100) break;
  }
  return candidate;
}

// Os dois extremos fixos da direção "Ledger" (styles/tokens.css) -- server
// como pano de fundo de referência pra texto solto na cor de marca (nome
// da marca na sidebar, links), separado do par brand/brandSoft (que tem
// seu próprio contraste garantido abaixo).
const PAPER_LIGHT = '#fbfaf7';
const PAPER_DARK = '#0a0e0d';

export interface BrandShades {
  brand: string;
  brandStrong: string;
  brandSoft: string;
}

/**
 * A partir de UMA cor escolhida pelo usuário, deriva as 3 variações que o
 * app precisa (base/forte/suave), na direção certa pro tema atual --
 * "forte" é mais escura no tema claro mas mais CLARA no tema escuro (é
 * assim que os tokens fixos originais também funcionam: tinta mais forte
 * no claro precisa escurecer pra destacar, no escuro precisa clarear).
 * `brand` sai com contraste de verdade garantido (WCAG, não só HSL-L)
 * contra os dois fundos onde ele aparece como texto/ícone: o papel do
 * tema e o próprio `brandSoft` (par usado em item ativo de nav, avatar
 * de PessoasPage etc.) -- não é uma prova formal de AA pra qualquer
 * conteúdo, mas fecha o buraco real que cores saturadas tipo verde/
 * amarelo abriam no corte antigo.
 */
export function deriveBrandShades(hex: string, isDark: boolean): BrandShades {
  const [r, g, b] = hexToRgb(hex);
  const [, , l] = rgbToHsl(r, g, b);

  if (isDark) {
    const brandSoft = withLightness(hex, 20, 0.55);
    let brand = l < 55 ? withLightness(hex, 68) : hex;
    brand = ensureContrast(hex, brand, [brandSoft, PAPER_DARK], 4.5, false);
    return { brand, brandStrong: withLightness(hex, 82, 0.9), brandSoft };
  }

  const brandSoft = withLightness(hex, 92, 0.35);
  let brand = l > 55 ? withLightness(hex, 32) : hex;
  brand = ensureContrast(hex, brand, [brandSoft, PAPER_LIGHT], 4.5, true);
  return { brand, brandStrong: withLightness(hex, 20, 1.05), brandSoft };
}
