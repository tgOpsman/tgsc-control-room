export function sortTenants<T extends Record<string, unknown>>(rows: T[], field: string, descending = false): T[] {
  const collator = new Intl.Collator("en-GB", { numeric: true, sensitivity: "base" });
  return [...rows].sort((a, b) => {
    const av = a[field], bv = b[field];
    const aEmpty = av == null || av === "", bEmpty = bv == null || bv === "";
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
    const comparison = collator.compare(String(av), String(bv));
    return (descending ? -comparison : comparison) || collator.compare(String(a["name"] ?? ""), String(b["name"] ?? ""));
  });
}