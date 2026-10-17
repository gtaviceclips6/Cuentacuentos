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

export type Prepared = { uri: string; width: number; height: number; square: Square; found: boolean };
export type Square = { x: number; y: number; side: number };

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
  try {
    const faces = await FaceDetection.detect(work.uri, { performanceMode: "accurate", minFaceSize: 0.05 });
    for (const f of faces) {
      if (!face || f.frame.width * f.frame.height > face.width * face.height) face = f.frame;
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
  return { uri: work.uri, width: W, height: H, square: clampSquare(sq, W, H), found: !!face };
}

/** Mantiene el cuadrado dentro de la foto. */
export function clampSquare(s: Square, W: number, H: number): Square {
  const side = Math.max(32, Math.min(s.side, W, H));
  return { side, x: Math.max(0, Math.min(W - side, s.x)), y: Math.max(0, Math.min(H - side, s.y)) };
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
