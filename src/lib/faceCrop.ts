import FaceDetection from "@react-native-ml-kit/face-detection";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { FACE_OVAL } from "./faceOval";

export { FACE_OVAL };

/** Lado máximo con el que se trabaja: suficiente para encontrar la cara y rápido en cualquier móvil. */
const WORK = 1400;
/** Tamaño final del recorte (cuadrado). */
const OUT = 512;

/** El recuadro de cara de ML Kit ocupa este trozo del lado del recorte. */
const FACE_BOX = 0.59;

type Pt = { x: number; y: number };
export type Prepared = { uri: string; width: number; height: number; square: Square; found: boolean; eyes: { l: Pt; r: Pt } | null };
export type Square = { x: number; y: number; side: number };
/**
 * Dónde está la cara dentro del recorte (en fracciones de su lado): punto entre los ojos (ex, ey),
 * distancia entre los ojos (d) e inclinación (a, radianes). Con esto se encaja en el dibujo.
 */
export type Fit = { ex: number; ey: number; d: number; a: number };
/** Si no se encontraron los ojos: lo normal cuando la cara está dentro del óvalo guía. */
export const DEFAULT_FIT: Fit = { ex: 0.5, ey: 0.48, d: 0.27, a: 0 };

/**
 * Prepara cualquier foto de la galería: la endereza, la reduce y busca la cara (ML Kit, en el móvil).
 * Devuelve un cuadrado propuesto con la cara dentro del óvalo; el padre puede moverlo después.
 */
export async function prepareFace(uri: string): Promise<Prepared> {
  const probe = await ImageManipulator.manipulate(uri).renderAsync();
  const scale = Math.min(1, WORK / Math.max(probe.width, probe.height));
  const ctx = ImageManipulator.manipulate(uri);
  if (scale < 1) ctx.resize(probe.width >= probe.height ? { width: Math.round(probe.width * scale) } : { height: Math.round(probe.height * scale) });
  const work = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
  const W = work.width;
  const H = work.height;

  let face: { left: number; top: number; width: number; height: number } | null = null;
  let eyes: { l: Pt; r: Pt } | null = null;
  try {
    const faces = await FaceDetection.detect(work.uri, { performanceMode: "accurate", landmarkMode: "all", minFaceSize: 0.05 } as never);
    let best: (typeof faces)[number] | null = null;
    for (const f of faces) {
      if (!best || f.frame.width * f.frame.height > best.frame.width * best.frame.height) best = f;
    }
    if (best) {
      face = best.frame;
      const lm = (best as unknown as { landmarks?: Record<string, { position?: Pt } | undefined> }).landmarks;
      const a = lm?.leftEye?.position;
      const b = lm?.rightEye?.position;
      if (a && b && Math.abs(a.x - b.x) > 4) eyes = a.x < b.x ? { l: a, r: b } : { l: b, r: a };
    }
  } catch {
    face = null;
  }

  let sq: Square;
  if (face) {
    const side = Math.max(face.width, face.height) / FACE_BOX;
    const cx = face.left + face.width / 2;
    const cy = face.top + face.height / 2;
    sq = { side, x: cx - side * FACE_OVAL.cx, y: cy - side * (FACE_OVAL.cy + 0.03) };
  } else {
    const side = Math.min(W, H) * 0.7;
    sq = { side, x: (W - side) / 2, y: (H - side) * 0.3 };
  }
  return { uri: work.uri, width: W, height: H, square: clampSquare(sq, W, H), found: !!face, eyes };
}

/** Mantiene el cuadrado dentro de la foto. */
export function clampSquare(s: Square, W: number, H: number): Square {
  const side = Math.max(32, Math.min(s.side, W, H));
  return { side, x: Math.max(0, Math.min(W - side, s.x)), y: Math.max(0, Math.min(H - side, s.y)) };
}

/** Dónde quedan los ojos dentro del cuadrado elegido. */
export function fitFor(p: Prepared, s: Square): Fit {
  const c = clampSquare(s, p.width, p.height);
  if (!p.eyes) return DEFAULT_FIT;
  const { l, r } = p.eyes;
  const fit = {
    ex: ((l.x + r.x) / 2 - c.x) / c.side,
    ey: ((l.y + r.y) / 2 - c.y) / c.side,
    d: Math.hypot(r.x - l.x, r.y - l.y) / c.side,
    a: Math.atan2(r.y - l.y, r.x - l.x),
  };
  // Si los ojos se han quedado fuera del recorte, mejor lo normal.
  if (fit.ex < 0.1 || fit.ex > 0.9 || fit.ey < 0.1 || fit.ey > 0.9 || fit.d < 0.05) return DEFAULT_FIT;
  return fit;
}

/** Recorta el cuadrado elegido y lo guarda como imagen de 512×512. */
export async function renderFace(p: Prepared, s: Square): Promise<string> {
  const c = clampSquare(s, p.width, p.height);
  const side = Math.floor(c.side);
  const ref = await ImageManipulator.manipulate(p.uri)
    .crop({ originX: Math.round(c.x), originY: Math.round(c.y), width: side, height: side })
    .resize({ width: OUT, height: OUT })
    .renderAsync();
  const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.88 });
  return out.uri;
}
