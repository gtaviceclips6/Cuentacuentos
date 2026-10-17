// Los cuentos del catálogo. La fuente de verdad son las fichas de catalog/tales/*.md;
// tales.json se genera a partir de ellas.
import data from "./tales.json";

export type CastMember = {
  id: string;
  tipo: "as" | "nombre"; // "as": «el rey {rey}»; "nombre": «{cenicienta}» (el nombre es el personaje)
  label: string; // cómo aparece sin nombre: «el rey», «Cenicienta»
  animal: boolean;
};
export type TalePage = { t: string; e: string; c: string[] }; // texto, escena para ilustrar, caras que salen
export type Tale = { slug: string; title: string; moral: string; cast: CastMember[]; pages: TalePage[] };

export const TALES = data as Tale[];
export const taleBySlug = (slug: string) => TALES.find((t) => t.slug === slug);
