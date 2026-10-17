#!/usr/bin/env node
// Genera las ilustraciones de las páginas con FLUX en fal.ai y las guarda en assets/tales/<cuento>/<página>.jpg.
//
// Uso:
//   npm run ilustrar -- cenicienta                 → enseña los prompts y lo que costaría, sin gastar
//   npm run ilustrar -- cenicienta --confirmar     → genera las páginas que aún no tienen dibujo
//   npm run ilustrar -- cenicienta --paginas 1,2 --confirmar
//   npm run ilustrar -- cenicienta --rehacer 3 --confirmar   → vuelve a dibujar la página 3
//   npm run ilustrar -- --todos --confirmar
//
// Necesita FAL_KEY en el archivo .env (copia .env.example). La clave nunca sale de tu ordenador.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TALES = JSON.parse(readFileSync(join(ROOT, "src/data/tales.json"), "utf8"));
const MODEL = "fal-ai/flux/dev";
const PRICE_EUR = 0.03; // aproximado por imagen; revisa el precio actual en fal.ai

// Estilo de la casa (skill cuentos-ilustracion). En inglés porque FLUX lo entiende mejor; la escena va tal cual.
const STYLE =
  "Children's picture book illustration, soft digital watercolor, clean outlines, light paper texture, " +
  "warm luminous palette, gentle storybook lighting, simple backgrounds, friendly characters with slightly large heads " +
  "and clear expressions, faces seen from the front or three-quarter view, large and well lit, nothing covering the faces, " +
  "all characters fully and modestly dressed, cozy and safe mood for children aged 2 to 10, " +
  "leave the top third of the image calm and uncluttered for large text, vertical composition, no text, no letters, no logos.";
const AVOID = "Original designs only; do not resemble any film or animation studio characters.";

function loadEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function args() {
  const a = process.argv.slice(2);
  const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
  return {
    slugs: a.includes("--todos") ? TALES.map((t) => t.slug) : a.filter((x) => !x.startsWith("--") && !/^[\d,]+$/.test(x)),
    pages: get("--paginas")?.split(",").map(Number),
    redo: get("--rehacer")?.split(",").map(Number) ?? [],
    confirm: a.includes("--confirmar"),
  };
}

const out = (slug, n) => join(ROOT, "assets/tales", slug, `${String(n).padStart(2, "0")}.jpg`);

function promptFor(tale, n) {
  const page = tale.pages[n - 1];
  return `${STYLE} Story: "${tale.title}". Scene (Spanish description): ${page.e} ${AVOID}`;
}

async function generate(prompt, file) {
  const res = await fetch(`https://fal.run/${MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, image_size: { width: 832, height: 1216 }, num_images: 1, enable_safety_checker: true, output_format: "jpeg" }),
  });
  if (!res.ok) throw new Error(`fal.ai respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const url = data?.images?.[0]?.url;
  if (!url) throw new Error("fal.ai no devolvió ninguna imagen");
  const img = await fetch(url);
  if (!img.ok) throw new Error(`No se pudo descargar la imagen (${img.status})`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await img.arrayBuffer()));
}

async function main() {
  loadEnv();
  const { slugs, pages, redo, confirm } = args();
  if (!slugs.length) {
    console.log("Dime qué cuento: npm run ilustrar -- cenicienta   (o --todos)");
    console.log("Cuentos:", TALES.map((t) => t.slug).join(", "));
    process.exit(1);
  }
  const jobs = [];
  for (const slug of slugs) {
    const tale = TALES.find((t) => t.slug === slug);
    if (!tale) { console.error(`No existe el cuento «${slug}».`); process.exit(1); }
    const wanted = redo.length ? redo : pages ?? tale.pages.map((_, i) => i + 1);
    for (const n of wanted) {
      if (n < 1 || n > tale.pages.length) continue;
      if (!redo.includes(n) && existsSync(out(slug, n))) continue;
      jobs.push({ tale, n });
    }
  }
  if (!jobs.length) { console.log("No hay páginas pendientes de dibujar."); return; }

  console.log(`${jobs.length} ilustraciones · unos ${(jobs.length * PRICE_EUR).toFixed(2)} € con ${MODEL}\n`);
  if (!confirm) {
    for (const { tale, n } of jobs.slice(0, 3)) console.log(`— ${tale.slug} pág. ${n}\n${promptFor(tale, n)}\n`);
    console.log("No se ha generado nada. Añade --confirmar para generar y gastar.");
    return;
  }
  if (!process.env.FAL_KEY) { console.error("Falta FAL_KEY en el archivo .env (mira .env.example)."); process.exit(1); }

  let ok = 0;
  for (const { tale, n } of jobs) {
    const file = out(tale.slug, n);
    process.stdout.write(`${tale.slug} pág. ${n}… `);
    try {
      await generate(promptFor(tale, n), file);
      ok++;
      console.log("hecha");
    } catch (e) {
      console.log(`fallo: ${e.message}`);
    }
  }
  console.log(`\n${ok} de ${jobs.length} ilustraciones generadas.`);
  execFileSync(process.execPath, [join(ROOT, "tools/indice-imagenes.mjs")], { stdio: "inherit" });
  console.log("Revisa cada imagen con la skill cuentos-ilustracion antes de darla por buena.");
}

main().catch((e) => { console.error(e); process.exit(1); });
