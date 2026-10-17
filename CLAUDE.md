# Cuentacuentos

App (Expo / React Native) de cuentos clásicos de dominio público **para aprender a leer**, para niños de 2 a 10 años, solos o con sus padres. La familia hace de personajes: el padre elige para cada papel solo cara, cara y nombre, o solo nombre. Español de España.

Este repositorio es la fuente de verdad del código. Las decisiones de producto están en el cuaderno de Google Drive (carpeta **Cuentacuentos**, documento «Cuaderno Cuentacuentos vN» con la N más alta) y las skills del proyecto en su subcarpeta `skills`.

## Estructura

- `app/` — pantallas (expo-router): `index` estantería, `reparto/[slug]` reparto de papeles, `leer/[slug]` lector.
- `src/components/` — `Page` (hoja: dibujo a página completa + letra grande arriba), `Scene` (ilustración o fondo provisional), `ActivityLayer` (actividades), `Face`.
- `src/state/cast.tsx` — reparto en memoria y `fillText`, que monta el texto con los nombres.
- `src/data/tales.json` — los cuentos; se genera desde `catalog/tales/*.md` (las fichas completas: origen, dominio público, reparto, escenas, cambios, rasgos a evitar).
- `src/data/activities.ts` — actividades elegidas a mano por página.
- `src/data/images.ts` — GENERADO por `npm run indice-imagenes`; no editar a mano.
- `assets/tales/<cuento>/<NN>.jpg` — ilustraciones.
- `tools/ilustrar.mjs` — genera ilustraciones con FLUX en fal.ai (necesita `FAL_KEY` en `.env`; sin `--confirmar` no gasta nada).

## Reglas del contenido (no negociables)

- Textos: 10–12 páginas; 10–20 palabras por página contadas con las marcas vacías; ninguna frase de más de 10 palabras; palabras de un niño de 5–6 años.
- Marcas de personaje: tipo "as" → `el rey {rey}`; tipo "nombre" (solo protagonistas cuyo nombre es el personaje) → `{cenicienta}`. Ninguna frase puede quedar vacía o rara sin nombres.
- Sin romance ni escenas íntimas entre personajes con cara (ni besos, bodas, enamorarse, baños, desvestirse, compartir cama): los papeles los hace la familia y puede haber niños en cualquiera.
- Sin violencia explícita ni sustos fuertes. Nada de Disney ni otras adaptaciones modernas (nombres, diseños, canciones).
- Ilustraciones: caras de frente o en 3/4, grandes y sin nada que las tape (ni gafas), máximo 3 caras por página, personajes siempre vestidos, tercio superior despejado para el texto.

## Desarrollo

- `npm install` y luego `npx expo install --fix` para alinear versiones con el SDK.
- `npx expo start` y escanear el QR con Expo Go.
- `npm run typecheck` antes de subir cambios.
- La voz usa `expo-speech` (voz del sistema). El soplido usa el micrófono con `expo-audio` solo para medir el volumen; no se graba nada.
