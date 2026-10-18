// Lo que se recuerda de cada lector: si lee por sílabas y las estrellas de cada cuento (una por vez que lo acaba).
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadJson, saveJson } from "./storage";

type Data = { silabas: boolean; estrellas: Record<string, number> };
const FILE = "progreso.json";
const EMPTY: Data = { silabas: false, estrellas: {} };

type Ctx = Data & {
  setSilabas: (on: boolean) => void;
  /** Suma una estrella al cuento y devuelve cuántas tiene ya. */
  addStar: (slug: string) => number;
};
const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(() => loadJson(FILE, EMPTY));
  const update = useCallback((fn: (d: Data) => Data) => {
    setData((prev) => {
      const next = fn(prev);
      saveJson(FILE, next);
      return next;
    });
  }, []);
  const setSilabas = useCallback((on: boolean) => update((d) => ({ ...d, silabas: on })), [update]);
  const addStar = useCallback(
    (slug: string) => {
      const n = (data.estrellas[slug] ?? 0) + 1;
      update((d) => ({ ...d, estrellas: { ...d.estrellas, [slug]: (d.estrellas[slug] ?? 0) + 1 } }));
      return n;
    },
    [data.estrellas, update],
  );
  const value = useMemo(() => ({ ...data, setSilabas, addStar }), [data, setSilabas, addStar]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress fuera de ProgressProvider");
  return ctx;
}
