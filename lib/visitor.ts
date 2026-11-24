import { z } from "zod";

// Shared rules for the public QR visitor check-in (used by the form and the server).
export const VISITOR_TYPES = ["Visitor", "Contractor", "Agency", "Staff"] as const;
export const visitorSchema = z.object({
  room: z.string().uuid(),
  visit_type: z.enum(VISITOR_TYPES),
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  company: z.string().trim().max(100).optional().default(""),
  destination: z.string().trim().max(120).optional().default(""),
  phone: z.string().trim().regex(/^[0-9+()\s-]{7,20}$/, "Enter a valid mobile number"),
  access_reason: z.string().trim().max(300).optional().default(""),
  agreed: z.literal(true, { message: "Please agree to the site safety rules" }),
  website: z.string().max(0).optional().default(""), // honeypot: bots fill this in
});
export type VisitorInput = z.input<typeof visitorSchema>;
/** Strip characters that would turn a cell into a spreadsheet formula. */
export const cleanText = (s: string) => s.replace(/^[=+\-@\t\r]+/, "").trim();
export const QR_RATE_LIMIT = 60; // max self check-ins per site per 10 minutes
