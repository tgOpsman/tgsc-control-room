import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: vi.fn() }));
import { liveMusterRows } from "@/lib/live-muster";
const event = { id: "ev-1", control_room_id: "room-1" };
describe("Live Red Hat occupancy", () => {
  it("loads only active tenants as occupiers without inventing headcounts", () => {
    const rows = liveMusterRows(event, [{ id: "t1", name: "Active shop", is_active: true }, { id: "t2", name: "Closed shop", is_active: false }], [], [], []);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Active shop", people: 0, event_id: "ev-1", control_room_id: "room-1", extra: { category: "Occupier", headcount_unknown: true } });
  });
  it("loads signed-in visitors, staff and contractors with their correct category", () => {
    const rows = liveMusterRows(event, [], ["Visitor", "Staff", "Contractor"].map((visit_type) => ({ id: visit_type, full_name: visit_type, visit_type, status: "active" })), [], []);
    expect(rows.map((r) => r.extra.category)).toEqual(["Visitor", "Staff", "Contractor"]);
    expect(rows.map((r) => r.people)).toEqual([1, 1, 1]);
  });
  it("excludes departed, archived and roof-access records", () => {
    const rows = liveMusterRows(event, [], [{ status: "completed" }, { status: "active", check_out_time: "2026-11-12" }, { status: "active", archived: true }, { status: "active", visit_type: "RoofAccess" }], [], []);
    expect(rows).toEqual([]);
  });
  it("does not reload an existing source or alter its accounted status", () => {
    const existing = [{ name: "Shop", status: "accounted", people: 5, extra: { source: "tenants", source_id: "t1" } }];
    expect(liveMusterRows(event, [{ id: "t1", name: "Shop", is_active: true }], [], [], existing)).toEqual([]);
    expect(existing[0]).toMatchObject({ status: "accounted", people: 5 });
  });
});