// Reference numbers, matching the Base44 formats.
const p = (n: number) => String(n).padStart(2, "0");
export const ddMMyy = (d: Date) => `${p(d.getDate())}${p(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}`;
/** e.g. HD-121126-003 — `count` = records already made that day. */
export const dailyRef = (prefix: string, d: Date, count: number) => `${prefix ? prefix + "-" : ""}${ddMMyy(d)}-${String(count + 1).padStart(3, "0")}`;
/** SP-20261112-1338 */
export const stampRef = (prefix: string, d: Date) => `${prefix ? prefix + "-" : ""}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
/** CO-2026-007 */
export const yearRef = (prefix: string, d: Date, count: number) => `${prefix}-${d.getFullYear()}-${String(count + 1).padStart(3, "0")}`;

export type Answer = "yes" | "no" | "na" | "";
export type ChecklistValue = { answer: Answer; comments?: string };
/** Keys of checklist answers that are "No" without a comment (comment is mandatory on No). */
export const missingComments = (v: Record<string, ChecklistValue>) =>
  Object.entries(v).filter(([, x]) => x.answer === "no" && !x.comments?.trim()).map(([k]) => k);
