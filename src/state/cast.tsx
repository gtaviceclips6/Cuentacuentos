// Reparto de cada cuento: quién hace de quién. Se guarda en el móvil y se recupera al abrir la app.
// Las fotos se quedan en el móvil (solo se guarda la ruta local).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CastMember, Tale } from "../data/tales";
import { loadCast, saveCast } from "./storage";

export type Mode = "cara" | "ambos" | "nombre"; // solo cara (por defecto) · cara y nombre · solo nombre
export type Role = { mode: Mode; name: string; photo: string | null };
export type CastConfig = Record<string, Role>;

type Ctx = {
  get: (tale: Tale) => CastConfig;
  set: (slug: string, id: string, patch: Partial<Role>) => void;
};
const CastContext = createContext<Ctx | null>(null);

const blank = (tale: Tale): CastConfig =>
  Object.fromEntries(tale.cast.map((c) => [c.id, { mode: "cara", name: "", photo: null } as Role]));

export function CastProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<Record<string, CastConfig>>(() => loadCast<Record<string, CastConfig>>());
  useEffect(() => {
    const t = setTimeout(() => saveCast(all), 400); // espera a que termine de escribir el nombre
    return () => clearTimeout(t);
  }, [all]);
  const get = useCallback((tale: Tale) => ({ ...blank(tale), ...all[tale.slug] }), [all]);
  const set = useCallback((slug: string, id: string, patch: Partial<Role>) => {
    setAll((prev) => {
      const cur = prev[slug] ?? {};
      return { ...prev, [slug]: { ...cur, [id]: { ...{ mode: "cara", name: "", photo: null }, ...cur[id], ...patch } } };
    });
  }, []);
  const value = useMemo(() => ({ get, set }), [get, set]);
  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast() {
  const ctx = useContext(CastContext);
  if (!ctx) throw new Error("useCast fuera de CastProvider");
  return ctx;
}

/** Nombre que el padre ha puesto a un papel, si ha elegido mostrarlo. */
export const nameOf = (cfg: CastConfig, id: string) => {
  const r = cfg[id];
  return r && r.mode !== "cara" ? r.name.trim() : "";
};

/**
 * Monta el texto de una página con los nombres elegidos.
 * Tipo "as": «el rey {rey}» → «el rey» sin nombre, «el rey Pepe» con nombre.
 * Tipo "nombre": «{cenicienta}» → «Cenicienta» sin nombre, «Lucía» con nombre.
 */
export function fillText(text: string, cast: CastMember[], cfg: CastConfig) {
  let open = false;
  return text
    .replace(/( ?)\{(\w+)\}/g, (_m, sp: string, id: string) => {
      const c = cast.find((x) => x.id === id);
      const n = nameOf(cfg, id);
      if (c && c.tipo === "nombre") return sp + (n || c.label);
      return n ? " " + n : "";
    })
    .replace(/"/g, () => ((open = !open) ? "“" : "”"));
}

/** Inicial para el círculo de un personaje sin foto. */
export function initialOf(c: CastMember, cfg: CastConfig) {
  const n = nameOf(cfg, c.id);
  return (n || c.label.replace(/^(el|la|los|las|su)\s+/i, "")).charAt(0).toUpperCase();
}
