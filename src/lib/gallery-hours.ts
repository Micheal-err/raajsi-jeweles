export const SHOWROOM_HOURS = [
  { day: "Tuesday – Saturday", open: "11:00", close: "19:00" },
  { day: "Sunday", open: "12:00", close: "18:00" },
  { day: "Monday", open: null, close: null },
] as const;

export const SHOWROOM_HOURS_SHORT = "Tue–Sat · 11–19 · Sun · 12–18";

// Legacy alias for compatibility
export const GALLERY_HOURS = SHOWROOM_HOURS;
export const GALLERY_HOURS_SHORT = SHOWROOM_HOURS_SHORT;

export function slotsForDate(date: Date): string[] {
  const day = date.getDay();
  if (day === 1) return [];
  const [openH, closeH] = day === 0 ? [12, 18] : [11, 19];
  const out: string[] = [];
  for (let h = openH; h < closeH; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h + 0.5 < closeH) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}
