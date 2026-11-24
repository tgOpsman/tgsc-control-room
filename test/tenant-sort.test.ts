import { describe, expect, it } from "vitest";
import { sortTenants } from "@/lib/tenant-sort";

describe("Tenant sorting", () => {
  const rows = [{ name: "Store 10", floor: "Upper", is_active: true }, { name: "Store 2", floor: "Ground", is_active: false }, { name: "Store 1", floor: null, is_active: true }];
  it("sorts store names alphabetically with natural numbers", () => {
    expect(sortTenants(rows, "name").map((r) => r.name)).toEqual(["Store 1", "Store 2", "Store 10"]);
  });
  it("reverses the selected order", () => {
    expect(sortTenants(rows, "name", true).map((r) => r.name)).toEqual(["Store 10", "Store 2", "Store 1"]);
  });
  it("sorts floors while keeping missing values last", () => {
    expect(sortTenants(rows, "floor").map((r) => r.name)).toEqual(["Store 2", "Store 10", "Store 1"]);
  });
  it("sorts active status without treating inactive as blank", () => {
    expect(sortTenants(rows, "is_active").map((r) => r.name)).toEqual(["Store 2", "Store 1", "Store 10"]);
  });
});