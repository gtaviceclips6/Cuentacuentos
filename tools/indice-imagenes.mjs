#!/usr/bin/env node
// Recorre assets/tales/<cuento>/<página>.(jpg|png|webp) y regenera src/data/images.ts,
// que le dice a la app qué páginas ya tienen ilustración.
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "assets/tales");
const lines = [];
let count = 0;

if (existsSync(DIR)) {
  for (const slug of readdirSync(DIR).sort()) {
    let files;
    try { files = readdirSync(join(DIR, slug)); } catch { continue; }
    const pages = files
      .map((f) => f.match(/^(\d+)\.(jpg|jpeg|png|webp)$/i))
      .filter(Boolean)
      .sort((a, b) => Number(a[1]) - Number(b[1]));
    if (!pages.length) continue;
    lines.push(`  "${slug}": {`);
    for (const m of pages) {
      lines.push(`    ${Number(m[1])}: require("../../assets/tales/${slug}/${m[0]}"),`);
      count++;
    }
    lines.push("  },");
  }
}

const src = `// ARCHIVO GENERADO por \`npm run indice-imagenes\`: no lo edites a mano.
// Relaciona cada página con su ilustración en assets/tales/<cuento>/<página>.jpg.
// Mientras una página no tenga ilustración, la app muestra un fondo provisional.
import type { ImageSourcePropType } from "react-native";

export const IMAGES: Record<string, Record<number, ImageSourcePropType>> = {
${lines.join("\n")}
};
`;
writeFileSync(join(ROOT, "src/data/images.ts"), src);
console.log(`Índice de ilustraciones actualizado: ${count} páginas con dibujo.`);
