// Divide palabras en sílabas como se enseña en el cole (ca-sa, ma-ri-po-sa, puer-ta, a-ho-ra).
// Reglas del español: diptongos y hiatos, grupos que no se separan (pl, br, tr…) y dígrafos (ch, ll, rr, qu, gu).

const STRONG = "aeoáéíóú"; // í/ú con tilde rompen el diptongo (hiatos: rí-o, ba-úl)
const WEAK = "iuü";
const isVowel = (c: string) => STRONG.includes(c) || WEAK.includes(c);
const ONSETS = new Set(["pl", "pr", "bl", "br", "fl", "fr", "cl", "cr", "gl", "gr", "dr", "tr", "kr", "kl"]);

type Unit = { s: string; v: boolean }; // trozo de la palabra; v = vocal

/** Letras de la palabra en unidades: ch, ll, rr y la «u» muda de que/qui/gue/gui van con su consonante. */
function units(w: string): Unit[] {
  const low = w.toLowerCase();
  const out: Unit[] = [];
  let i = 0;
  while (i < w.length) {
    const two = low.slice(i, i + 2);
    const next = low[i + 2] ?? "";
    if (two === "ch" || two === "ll" || two === "rr") {
      out.push({ s: w.slice(i, i + 2), v: false });
      i += 2;
    } else if ((two === "qu" || two === "gu") && "eiéí".includes(next) && next) {
      out.push({ s: w.slice(i, i + 2), v: false });
      i += 2;
    } else {
      const c = low[i];
      // «y» es vocal al final (rey, muy) o sola (y); si no, consonante (yo, playa).
      const yVowel = c === "y" && (i === w.length - 1 || !isVowel(low[i + 1] ?? "")) && i > 0;
      out.push({ s: w[i], v: isVowel(c) || (c === "y" && (yVowel || w.length === 1)) });
      i += 1;
    }
  }
  return out;
}

/** ¿Estas dos vocales seguidas van en la misma sílaba (diptongo)? */
function together(a: string, b: string) {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  const weak = (c: string) => WEAK.includes(c) || c === "y";
  return weak(x) || weak(y) ? !(("íú".includes(x) && !weak(y)) || ("íú".includes(y) && !weak(x))) : false;
}

/** Sílabas de una palabra sin signos. */
function splitWord(w: string): string[] {
  const u = units(w);
  if (!u.some((x) => x.v)) return [w];
  // Núcleos: vocales seguidas que forman diptongo o triptongo.
  const nuclei: [number, number][] = [];
  for (let i = 0; i < u.length; i++) {
    if (!u[i].v) continue;
    if (nuclei.length && nuclei[nuclei.length - 1][1] === i - 1 && together(u[i - 1].s, u[i].s)) nuclei[nuclei.length - 1][1] = i;
    else nuclei.push([i, i]);
  }
  // Dónde empieza cada sílaba: según las consonantes que hay entre dos núcleos.
  const starts = [0];
  for (let k = 1; k < nuclei.length; k++) {
    const a = nuclei[k - 1][1] + 1;
    const b = nuclei[k][0];
    const n = b - a; // consonantes en medio
    let cut: number;
    if (n <= 1) cut = a;
    else {
      const lastTwo = (u[b - 2].s + u[b - 1].s).toLowerCase();
      cut = ONSETS.has(lastTwo) ? b - 2 : b - 1;
      if (n >= 4 && !ONSETS.has(lastTwo)) cut = b - 2; // ins-tru-men-to ya lo cubre ONSETS; obs-tác-u-lo raro
    }
    starts.push(Math.max(cut, a));
  }
  const out: string[] = [];
  starts.forEach((s, k) => out.push(u.slice(s, starts[k + 1] ?? u.length).map((x) => x.s).join("")));
  return out;
}

/** Sílabas de una palabra tal como sale en el texto (con comas, puntos o comillas pegados). */
export function silabas(word: string): string[] {
  const m = word.match(/^([^\p{L}]*)([\p{L}]+(?:-[\p{L}]+)*)([^\p{L}]*)$/u);
  if (!m) return [word];
  const [, pre, core, post] = m;
  const parts = core.split("-").flatMap((p, i, all) => {
    const s = splitWord(p);
    if (i < all.length - 1) s[s.length - 1] += "-";
    return s;
  });
  parts[0] = pre + parts[0];
  parts[parts.length - 1] += post;
  return parts;
}
