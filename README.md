# Cuentacuentos

Cuentos clásicos para aprender a leer, con la familia de protagonista.

## Probarla en tu móvil

Necesitas un ordenador con [Node.js](https://nodejs.org) (versión 20 o más) y la app **Expo Go** en el móvil (App Store o Google Play).

```bash
git clone https://github.com/gtaviceclips6/cuentacuentos.git
cd cuentacuentos
npm install
npx expo install --fix
npx expo start
```

Sale un código QR en la terminal. Escanéalo con la cámara (iPhone) o con Expo Go (Android), con el móvil en la misma wifi que el ordenador.

## Qué hay

- Estantería con los 13 cuentos.
- Reparto: para cada personaje, solo cara, cara y nombre, o solo nombre; con foto de la galería.
- Lector a pantalla completa: letra grande arriba, dibujo de fondo, hoja que gira en 3D al deslizar el dedo.
- «Escuchar»: lee la página con la voz del móvil y marca cada palabra.
- «¡Ya lo he leído!»: en algunas páginas el dibujo pasa al frente y hay que soplar al micrófono, tocar, mantener el dedo o frotar.

## Ilustraciones

Las páginas sin ilustración muestran un fondo provisional con las caras del reparto. Para generarlas con FLUX:

1. Copia `.env.example` como `.env` y pon tu clave de fal.ai en `FAL_KEY`.
2. `npm run ilustrar -- cenicienta` enseña los prompts y el coste, sin gastar.
3. `npm run ilustrar -- cenicienta --confirmar` las genera y la app las usa al momento.
