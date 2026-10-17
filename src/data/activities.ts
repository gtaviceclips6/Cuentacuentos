// Actividades que aparecen al terminar de leer algunas páginas: el dibujo pasa al frente
// y el niño sopla, toca o frota. Elegidas a mano, 2-4 por cuento, donde tienen sentido.
export type ActivityKind = "tap" | "hold" | "rub" | "blow";
export type Fx = "spark" | "flower" | "snow" | "bubble" | "heart" | "zzz" | "wind";
export type Activity = { kind: ActivityKind; fx: Fx; text: string; help: string; label?: string; n?: number; find?: boolean };

const A: Record<string, Activity> = {
  magia: { kind: "rub", fx: "spark", text: "¡Haz magia!", help: "Frota la pantalla con el dedo" },
  reloj: { kind: "tap", fx: "spark", text: "¡Suenan las doce!", help: "Toca tres veces", label: "Tolón", n: 3 },
  abrazo: { kind: "hold", fx: "heart", text: "Un abrazo muy grande", help: "Deja el dedo apretado", label: "Abrazo" },
  dormir: { kind: "hold", fx: "zzz", text: "Shhh… a dormir", help: "Deja el dedo apretado", label: "Shhh" },
  sopla: { kind: "blow", fx: "wind", text: "¡Sopla fuerte!", help: "Sopla al móvil", label: "Sopla" },
  despierta: { kind: "tap", fx: "spark", text: "¡Despierta!", help: "Toca tres veces", label: "¡Arriba!", n: 3 },
  moneda: { kind: "tap", fx: "spark", text: "¿Encuentras la moneda?", help: "Tócala", label: "¡Aquí!", n: 1, find: true },
  kikiriki: { kind: "tap", fx: "spark", text: "Canta como el gallo", help: "Toca tres veces: ¡kikirikí!", label: "Kikirikí", n: 3 },
  toc: { kind: "tap", fx: "spark", text: "Llama a la puerta", help: "Toca tres veces", label: "Toc, toc", n: 3 },
  espejo: { kind: "rub", fx: "spark", text: "Limpia el espejo mágico", help: "Frota con el dedo" },
  tornado: { kind: "blow", fx: "wind", text: "¡Sopla como el tornado!", help: "Sopla al móvil", label: "Sopla" },
  aceite: { kind: "rub", fx: "bubble", text: "Engrasa al hombre de hojalata", help: "Frota con el dedo" },
  tacones: { kind: "tap", fx: "spark", text: "Choca los zapatos", help: "Toca tres veces: ¡clac, clac, clac!", label: "Clac", n: 3 },
  conejo: { kind: "tap", fx: "spark", text: "¡Atrapa al conejo!", help: "Tócalo", label: "¡Aquí!", n: 1, find: true },
  abanico: { kind: "rub", fx: "spark", text: "Abanícate", help: "Mueve el dedo de un lado a otro" },
  naipes: { kind: "blow", fx: "wind", text: "¡Que vuelen los naipes!", help: "Sopla al móvil", label: "Sopla" },
  diente: { kind: "tap", fx: "spark", text: "¿Encuentras el diente?", help: "Tócalo", label: "¡Aquí!", n: 1, find: true },
  capa: { kind: "hold", fx: "heart", text: "Tápalo con la capa", help: "Deja el dedo apretado", label: "Capa" },
  oro: { kind: "tap", fx: "spark", text: "¿Dónde está la moneda de oro?", help: "Tócala", label: "¡Aquí!", n: 1, find: true },
  nieve: { kind: "rub", fx: "snow", text: "¡Que nieve!", help: "Frota la pantalla" },
  calor: { kind: "hold", fx: "heart", text: "Derrite el hielo", help: "Deja el dedo apretado", label: "Calor" },
  flores: { kind: "tap", fx: "flower", text: "¡Que salgan flores!", help: "Toca cinco veces", label: "Flores", n: 5 },
  zapatos: { kind: "tap", fx: "spark", text: "¿Dónde están los zapatos?", help: "Tócalos", label: "¡Aquí!", n: 1, find: true },
  coser: { kind: "tap", fx: "spark", text: "Ayuda a coser", help: "Toca cuatro veces: tic, tac", label: "Tic, tac", n: 4 },
  bailar: { kind: "rub", fx: "spark", text: "¡A bailar!", help: "Mueve el dedo por la pantalla" },
  remueve: { kind: "rub", fx: "bubble", text: "Remueve la papilla", help: "Mueve el dedo en círculos" },
  para: { kind: "tap", fx: "bubble", text: "Di: ¡Ollita, para!", help: "Toca tres veces", label: "¡Para!", n: 3 },
  pachin: { kind: "tap", fx: "spark", text: "Canta: pachín, pachín", help: "Toca tres veces", label: "Pachín", n: 3 },
  cosquillas: { kind: "rub", fx: "spark", text: "¡Hazle cosquillas al buey!", help: "Frota con el dedo" },
  cuerdas: { kind: "rub", fx: "spark", text: "Suelta las cuerdas", help: "Frota con el dedo" },
  barcos: { kind: "hold", fx: "wind", text: "Tira de los barcos", help: "Deja el dedo apretado", label: "Tira" },
  fuegos: { kind: "tap", fx: "spark", text: "¡Fuegos artificiales!", help: "Toca cinco veces", label: "¡Pum!", n: 5 },
};

// Página (empezando en 1) → actividad.
const BY_TALE: Record<string, Record<number, string>> = {
  "cenicienta": { 5: "magia", 9: "reloj", 11: "abrazo" },
  "la-bella-durmiente": { 7: "dormir", 9: "sopla", 10: "despierta" },
  "la-ratita-presumida": { 1: "moneda", 4: "kikiriki", 10: "toc" },
  "blancanieves": { 1: "espejo", 9: "dormir", 12: "abrazo" },
  "el-mago-de-oz": { 2: "tornado", 6: "aceite", 12: "tacones" },
  "alicia": { 2: "conejo", 4: "abanico", 11: "naipes" },
  "el-raton-perez": { 1: "diente", 4: "magia", 9: "capa", 11: "oro" },
  "la-reina-de-las-nieves": { 3: "nieve", 5: "sopla", 10: "calor" },
  "el-gigante-egoista": { 4: "nieve", 6: "flores", 9: "flores" },
  "el-zapatero-y-los-duendes": { 3: "zapatos", 7: "coser", 10: "bailar" },
  "la-olla-magica": { 4: "remueve", 10: "para" },
  "garbancito": { 2: "pachin", 6: "dormir", 9: "cosquillas" },
  "gulliver-en-liliput": { 2: "cuerdas", 9: "barcos", 11: "fuegos" },
};

/** Actividad de una página (índice desde 0), si la tiene. */
export function activityFor(slug: string, pageIndex: number): Activity | undefined {
  const key = BY_TALE[slug]?.[pageIndex + 1];
  return key ? A[key] : undefined;
}
