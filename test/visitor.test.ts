import { describe, expect, it } from "vitest";
import { cleanText, visitorSchema } from "@/lib/visitor";
const ok = { room: "7f1c1f8e-2a4e-4c55-9f53-1b2a3c4d5e6f", visit_type: "Visitor", full_name: "Jo Bloggs", phone: "07700 900123", agreed: true };
describe("public visitor check-in", () => {
  it("accepts a complete sign-in", () => expect(visitorSchema.safeParse(ok).success).toBe(true));
  it("requires agreeing to safety rules", () => expect(visitorSchema.safeParse({ ...ok, agreed: false }).success).toBe(false));
  it("requires a mobile number", () => expect(visitorSchema.safeParse({ ...ok, phone: "abc" }).success).toBe(false));
  it("rejects bots filling the hidden field", () => expect(visitorSchema.safeParse({ ...ok, website: "x" }).success).toBe(false));
  it("allows staff and agency but not other types", () => { expect(visitorSchema.safeParse({ ...ok, visit_type: "Staff" }).success).toBe(true); expect(visitorSchema.safeParse({ ...ok, visit_type: "Agency" }).success).toBe(true); expect(visitorSchema.safeParse({ ...ok, visit_type: "Patrol" }).success).toBe(false); });
  it("strips spreadsheet formulas", () => expect(cleanText("=HYPERLINK(1)")).toBe("HYPERLINK(1)"));
});
