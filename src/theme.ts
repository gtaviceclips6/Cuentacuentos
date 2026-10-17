// Colores y tipografías de la app. Andika es una letra pensada para aprender a leer
// (la «a» y la «g» se escriben como en el cole); Grandstander es la de los títulos.
export const color = {
  bg: "#E9EEF7",
  card: "#FFFFFF",
  ink: "#1D2440",
  muted: "#5A6483",
  line: "#D3DBEB",
  accent: "#E46F33",
  accentInk: "#FFFFFF",
  soft: "#DCE4F2",
  paper: "#FFFDF8",
  paperEdge: "#E8E1D2",
  highlight: "#FFE08A",
  spine: "#B9A98C",
};

export const font = {
  read: "Andika_400Regular",
  readBold: "Andika_700Bold",
  display: "Grandstander_800ExtraBold",
};

// Tono de color de cada cuento, para portadas y fondos provisionales.
const HUES: Record<string, number> = {
  "cenicienta": 150, "la-bella-durmiente": 280, "la-ratita-presumida": 190, "blancanieves": 345,
  "el-mago-de-oz": 45, "alicia": 20, "el-raton-perez": 210, "la-reina-de-las-nieves": 200,
  "el-gigante-egoista": 110, "el-zapatero-y-los-duendes": 30, "la-olla-magica": 55,
  "garbancito": 95, "gulliver-en-liliput": 230,
};
export const hueOf = (slug: string) => HUES[slug] ?? 200;
export const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h) % 360}, ${s}%, ${l}%)`;
