import { describe, expect, it } from "vitest";
import { dailyRef, missingComments, stampRef, yearRef } from "@/lib/refs";
import { radonStatus } from "@/lib/modules";

const d = new Date(2026, 10, 12, 13, 8);
describe("reference numbers", () => {
  it("handover ref is HD-ddMMyy-XXX", () => expect(dailyRef("HD", d, 2)).toBe("HD-121126-003"));
  it("booking ref is ddMMyy-XXX", () => expect(dailyRef("", d, 0)).toBe("121126-001"));
  it("spillage ref is SP-yyyyMMdd-HHmm", () => expect(stampRef("SP", d)).toBe("SP-20261112-1308"));
  it("callout ref is CO-yyyy-XXX", () => expect(yearRef("CO", d, 6)).toBe("CO-2026-007"));
});
describe("checklists", () => {
  it("a No answer needs a comment", () => {
    expect(missingComments({ a: { answer: "no" }, b: { answer: "no", comments: "lift 3 down" }, c: { answer: "yes" } })).toEqual(["a"]);
  });
});
describe("radon", () => {
  it("uses 200 target and 400 action levels", () => {
    expect(radonStatus(150)).toBe("safe");
    expect(radonStatus(250)).toBe("target_exceeded");
    expect(radonStatus(450)).toBe("action_level_exceeded");
  });
});
import { parseCsv } from "@/lib/csv";
import { musterSummary } from "@/lib/muster";
describe("occupier import", () => {
  it("reads quoted CSV with headers", () => {
    expect(parseCsv('Name,Unit,Expected People\n"Boots, Ltd",U12,4\n')).toEqual([{ name: "Boots, Ltd", unit: "U12", expected_people: "4" }]);
  });
});
describe("muster report", () => {
  it("counts accounted people and flags partial teams", () => {
    const s = musterSummary([
      { status: "accounted", people: 3, extra: { expected: 4 } },
      { status: "missing", people: 1 },
      { status: "pending", people: 2 },
    ]);
    expect(s).toEqual({ accounted: 3, missing: 1, pending: 2, partial: 1, cards: 3 });
  });
});
import { keyMismatch, returnProblem } from "@/lib/loans";
describe("loans", () => {
  it("flags a key count mismatch", () => { expect(keyMismatch(5, 4)).toBe(true); expect(keyMismatch(5, 5)).toBe(false); });
  it("faulty equipment needs fault notes", () => { expect(returnProblem(false, "")).toBe("Describe the fault"); expect(returnProblem(true, "")).toBeNull(); });
});

import { hoursSummary, shiftHours, trainingProgress, deptOf } from "@/lib/roster";
describe("phase 6 rules", () => {
  it("shift hours by code", () => { expect(shiftHours("D")).toBe(12); expect(shiftHours("M")).toBe(8); expect(shiftHours("OFF")).toBe(0); });
  it("hours summary totals by department", () => {
    const s = hoursSummary([{ dept: "Security", hours: 12 }, { dept: "Cleaning", hours: 8 }, { dept: "Security", hours: 10 }]);
    expect(s["Total"]).toBe(30); expect(s["Security"]).toBe(22);
  });
  it("cleaners map to Cleaning", () => { expect(deptOf("Controllers", "Dual Service")).toBe("Security"); expect(deptOf(null, "Cleaning")).toBe("Cleaning"); });
  it("training progress out of 12 / 4 sections", () => {
    expect(trainingProgress("Controller/Dual Service", ["1", "2", "3"])).toBe(25);
    expect(trainingProgress("Cleaning", ["1", "2", "2"])).toBe(50);
  });
});

import { canSee } from "@/lib/auth";
describe("page permissions", () => {
  it("empty list keeps role defaults", () => expect(canSee("security", ["security"], [], "/keys")).toBe(true));
  it("list narrows access", () => expect(canSee("security", ["security"], ["/handover"], "/keys")).toBe(false));
  it("cannot grant beyond role", () => expect(canSee("cleaner", ["manager"], ["/dashboard"], "/dashboard")).toBe(false));
  it("admin sees everything", () => expect(canSee("admin", [], ["/x"], "/keys")).toBe(true));
});

import { loginEmail, staffRowProblem } from "@/lib/usernames";
describe("staff usernames", () => {
  it("maps a username to the internal sign-in address", () => { expect(loginEmail(" JSmith ")).toBe("jsmith@staff.tgsc.local"); });
  it("keeps real emails as typed", () => { expect(loginEmail("Paul@x.com")).toBe("paul@x.com"); });
  it("rejects short temporary passwords and unknown roles", () => {
    const ok = { username: "jsmith", temporary_password: "ChangeMe1", first_name: "J", last_name: "S", role: "security" };
    expect(staffRowProblem(ok)).toBeNull();
    expect(staffRowProblem({ ...ok, temporary_password: "short" })).not.toBeNull();
    expect(staffRowProblem({ ...ok, role: "boss" })).not.toBeNull();
  });
});

import { tempPassword } from "@/lib/slips";
import { IDLE_MS, WARN_MS } from "@/hooks/use-idle-logout";
describe("pre-publish rules", () => {
  it("generated temporary passwords meet the 8-character minimum", () => {
    expect(tempPassword().length).toBe(12);
  });
  it("idle sign-out after 30 minutes with a 60 second warning", () => {
    expect(IDLE_MS).toBe(30 * 60 * 1000);
    expect(WARN_MS).toBe(60 * 1000);
  });
});

import { parseThreatLevel, threatSyncAction } from "@/lib/threat";
describe("UK threat level sync", () => {
  it("only records a level that changed", () => {
    expect(threatSyncAction("Severe", "Substantial")).toBe("insert");
    expect(threatSyncAction("Severe", "Severe")).toBe("unchanged");
    expect(threatSyncAction(null, "Severe")).toBe("unavailable");
    expect(threatSyncAction("Severe", null)).toBe("insert");
  });
  it("reads the level from GOV.UK wording", () => {
    expect(parseThreatLevel("The threat to the UK (England, Wales, Scotland and Northern Ireland) from terrorism is severe.")).toBe("Severe");
  });
  it("returns null when the wording is missing", () => {
    expect(parseThreatLevel("nothing here")).toBeNull();
  });
});

import { isLoanOverdue, isPatrolStale, quarterRange, frequentVisitors } from "@/lib/overdue";
describe("overdue alerts & archive", () => {
  const now = Date.parse("2026-11-12T12:00:00Z");
  it("loan overdue at 24h", () => { expect(isLoanOverdue("2026-11-11T12:00:00Z", now)).toBe(true); expect(isLoanOverdue("2026-11-11T12:01:00Z", now)).toBe(false); });
  it("patrol stale at 12h", () => { expect(isPatrolStale("2026-11-12T00:00:00Z", now)).toBe(true); expect(isPatrolStale("2026-11-12T00:01:00Z", now)).toBe(false); });
  it("Q4 range", () => { const r = quarterRange(2026, 4); expect(r.start.toISOString().slice(0, 10)).toBe("2026-10-01"); expect(r.end.toISOString().slice(0, 10)).toBe("2027-01-01"); });
  it("regular visitors need 2+ visits", () => { const r = frequentVisitors([{ full_name: "Ann", company: "X" }, { full_name: "ann ", company: "x" }, { full_name: "Bob", company: null }]); expect(r.length).toBe(1); expect(r[0]!.n).toBe(2); });
});

import { canSee as canSeeCT } from "@/lib/auth";
describe("counter terrorism visibility", () => {
  it("security sees CT even when not in page permissions", () => expect(canSeeCT("security", ["security"], ["/keys"], "/counter-terrorism")).toBe(true));
  it("manager sees CT even when not in page permissions", () => expect(canSeeCT("manager", ["manager"], ["/keys"], "/counter-terrorism")).toBe(true));
  it("cleaner restricted from CT", () => expect(canSeeCT("cleaner", ["cleaner"], ["/keys"], "/counter-terrorism")).toBe(false));
});
