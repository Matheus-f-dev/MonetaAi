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
 * Também corrige o caso de a cor escolhida ser clara demais pro texto no
 * tema claro (ou escura demais pro tema escuro) -- não é uma garantia de
 * contraste AA pra qualquer cor, mas evita os casos mais óbvios de
 * ilegibilidade sem exigir nada do usuário.
 */
export function deriveBrandShades(hex: string, isDark: boolean): BrandShades {
  const [r, g, b] = hexToRgb(hex);
  const [, , l] = rgbToHsl(r, g, b);

  if (isDark) {
    const brand = l < 55 ? withLightness(hex, 68) : hex;
    return {
      brand,
      brandStrong: withLightness(hex, 82, 0.9),
      brandSoft: withLightness(hex, 20, 0.55)
    };
  }

  const brand = l > 55 ? withLightness(hex, 32) : hex;
  return {
    brand,
    brandStrong: withLightness(hex, 20, 1.05),
    brandSoft: withLightness(hex, 92, 0.35)
  };
}
