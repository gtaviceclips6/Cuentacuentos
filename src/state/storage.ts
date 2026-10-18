// Guarda el reparto en el móvil para que no se pierda al cerrar la app.
// Las fotos recortadas se copian a una carpeta propia de la app («caras»); nada sale del móvil.
import { Directory, File, Paths } from "expo-file-system";

const STORE = "reparto.json";
const FACES = "caras";

function facesDir() {
  const dir = new Directory(Paths.document, FACES);
  if (!dir.exists) dir.create();
  return dir;
}

const isOurs = (uri: string | null | undefined) => !!uri && uri.includes(`/${FACES}/`);

/** Lee el reparto guardado. Quita las fotos que ya no existan. */
export function loadCast<T extends Record<string, Record<string, { photo: string | null }>>>(): T {
  try {
    const f = new File(Paths.document, STORE);
    if (!f.exists) return {} as T;
    const data = JSON.parse(f.textSync()) as T;
    for (const roles of Object.values(data)) {
      for (const r of Object.values(roles)) {
        if (r.photo && !new File(r.photo).exists) r.photo = null;
      }
    }
    return data;
  } catch {
    return {} as T;
  }
}

export function saveCast(data: unknown) {
  try {
    new File(Paths.document, STORE).write(JSON.stringify(data));
  } catch {
    // Si no se puede guardar, la app sigue funcionando en memoria.
  }
}

/** Copia una foto ya recortada a la carpeta de la app y borra la anterior de ese papel. */
export function keepPhoto(uri: string, slug: string, id: string, previous?: string | null): string {
  try {
    const dest = new File(facesDir(), `${slug}-${id}-${Date.now()}.jpg`);
    new File(uri).copySync(dest);
    if (isOurs(previous)) {
      try { new File(previous!).delete(); } catch { /* ya no estaba */ }
    }
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Lee un JSON pequeño guardado en el móvil (ajustes, estrellas). */
export function loadJson<T>(name: string, fallback: T): T {
  try {
    const f = new File(Paths.document, name);
    return f.exists ? { ...fallback, ...(JSON.parse(f.textSync()) as T) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(name: string, data: unknown) {
  try {
    new File(Paths.document, name).write(JSON.stringify(data));
  } catch {
    // sin guardar: la app sigue funcionando
  }
}
