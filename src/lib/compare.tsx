import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "kalaneri.compare";
const MAX = 4;

type Ctx = {
  slugs: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};
const CompareContext = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch {}
  }, []);
  const persist = (next: string[]) => {
    setSlugs(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };
  const add = (slug: string) => {
    if (!slug) return;
    persist([slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX));
  };
  const remove = (slug: string) => persist(slugs.filter((s) => s !== slug));
  const clear = () => persist([]);
  const has = (slug: string) => slugs.includes(slug);
  return (
    <CompareContext.Provider value={{ slugs, add, remove, clear, has }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx)
    return { slugs: [], add: () => {}, remove: () => {}, clear: () => {}, has: () => false };
  return ctx;
}

export const COMPARE_MAX = MAX;
