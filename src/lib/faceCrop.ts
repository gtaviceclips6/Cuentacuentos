import FaceDetection from "@react-native-ml-kit/face-detection";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** Lado máximo con el que se trabaja: suficiente para encontrar la cara y rápido en cualquier móvil. */
const WORK = 1400;
/** Tamaño final del recorte (cuadrado). */
const OUT = 512;

export type FaceCrop = { uri: string; found: boolean };

/**
 * Recibe cualquier foto de la galería y devuelve un cuadrado con la cara centrada.
 * 1) Endereza la foto (orientación de la cámara) y la reduce.
 * 2) Busca caras con ML Kit, dentro del móvil, y se queda con la más grande.
 * 3) Recorta un cuadrado con margen para el pelo y la barbilla.
 * Si no hay cara (o el detector falla), recorta el centro de la parte de arriba y found = false.
 */
export async function cropFace(uri: string): Promise<FaceCrop> {
  const probe = await ImageManipulator.manipulate(uri).renderAsync();
  const scale = Math.min(1, WORK / Math.max(probe.width, probe.height));
  const ctx = ImageManipulator.manipulate(uri);
  if (scale < 1) ctx.resize(probe.width >= probe.height ? { width: Math.round(probe.width * scale) } : { height: Math.round(probe.height * scale) });
  const workRef = await ctx.renderAsync();
  const work = await workRef.saveAsync({ format: SaveFormat.JPEG, compress: 0.92 });
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

  let side: number, x: number, y: number;
  if (face) {
    side = Math.min(W, H, Math.max(face.width, face.height) * 1.7);
    const cx = face.left + face.width / 2;
    const cy = face.top + face.height / 2 - face.height * 0.08; // un poco hacia arriba, para que entre el pelo
    x = cx - side / 2;
    y = cy - side / 2;
  } else {
    side = Math.min(W, H);
    x = (W - side) / 2;
    y = (H - side) * 0.3; // en fotos verticales la cara suele estar arriba
  }
  x = Math.round(Math.max(0, Math.min(W - side, x)));
  y = Math.round(Math.max(0, Math.min(H - side, y)));
  side = Math.floor(side);

  const outRef = await ImageManipulator.manipulate(work.uri)
    .crop({ originX: x, originY: y, width: side, height: side })
    .resize({ width: OUT, height: OUT })
    .renderAsync();
  const out = await outRef.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return { uri: out.uri, found: !!face };
}
