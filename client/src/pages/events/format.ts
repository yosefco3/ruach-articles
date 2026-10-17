/** עיצוב תאריכים/מקום לאירוע — היגיון טהור (נבדק). */
export function formatEventWhen(startsAt: Date | string, endsAt?: Date | string | null): string {
  const s = new Date(startsAt);
  const e = endsAt ? new Date(endsAt) : null;
  const date = s.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = s.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (!e) return `${date} · ${time}`;
  const sameDay = s.toDateString() === e.toDateString();
  const endTime = e.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `${date} · ${time}–${endTime}`;
  const endDate = e.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  return `${date} ${time} — ${endDate} ${endTime}`;
}

export function formatEventWhere(e: { isOnline: boolean; location: string }): string {
  if (e.isOnline) return e.location ? `אונליין · ${e.location}` : "אונליין";
  return e.location || "המקום יפורסם";
}

/** datetime-local ⇄ Date (אזור הזמן של הדפדפן). */
export function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
export function fromLocalInput(s: string): Date | null {
  if (!s.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
