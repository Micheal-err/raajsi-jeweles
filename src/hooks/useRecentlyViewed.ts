import { useEffect, useState } from "react";

const KEY = "kalaneri.recentlyViewed";
const MAX = 6;

export function useRecentlyViewed() {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch {}
  }, []);
  return slugs;
}

export function recordView(slug: string) {
  if (typeof window === "undefined" || !slug) return;
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [slug, ...list.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
}
