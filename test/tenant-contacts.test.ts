import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, eq, select, order, insert, update, remove, single } = vi.hoisted(() => ({ db: vi.fn(), eq: vi.fn(), select: vi.fn(), order: vi.fn(), insert: vi.fn(), update: vi.fn(), remove: vi.fn(), single: vi.fn() }));
vi.mock("@/lib/db", () => ({ db }));
import { tenantContactsQuery } from "@/components/app/TenantContacts";
import { deleteTenantContact, saveTenantContact } from "@/lib/tenant-contacts";

describe("Tenant out-of-hours contacts", () => {
  beforeEach(() => vi.clearAllMocks());
  it("requests only the selected store's linked contacts in its room", async () => {
    const chain = { select, eq, order };
    db.mockReturnValue(chain);
    select.mockReturnValue(chain);
    eq.mockReturnValue(chain);
    order.mockResolvedValue({ data: [{ id: "contact-1", name: "Store key holder" }], error: null });
    const result = await tenantContactsQuery({ id: "store-116", name: "Selected store", control_room_id: "room-1" }).queryFn();
    expect(db).toHaveBeenCalledWith("out_of_hours_contacts");
    expect(eq.mock.calls).toEqual([["tenant_id", "store-116"], ["control_room_id", "room-1"]]);
    expect(result).toEqual([{ id: "contact-1", name: "Store key holder" }]);
  });

  const tenant = { id: "store-116", name: "Selected store", control_room_id: "room-1" };
  const values = { name: " Keyholder ", role: " Manager ", phone: " 01234567890 ", email: "", notes: "" };
  const mockWrites = () => {
    const chain = { insert, update, delete: remove, eq, select, single };
    db.mockReturnValue(chain);
    for (const fn of [insert, update, remove, eq, select]) fn.mockReturnValue(chain);
    single.mockResolvedValue({ data: { id: "contact-1" }, error: null });
  };
  it("links a new contact to the selected store and room", async () => {
    mockWrites();
    await saveTenantContact(tenant, values);
    expect(insert).toHaveBeenCalledWith({ name: "Keyholder", role: "Manager", phone: "01234567890", email: null, notes: null, tenant_id: "store-116", control_room_id: "room-1" });
  });
  it("scopes edits to the contact, selected store and room", async () => {
    mockWrites();
    await saveTenantContact(tenant, values, "contact-1");
    expect(update).toHaveBeenCalledOnce();
    expect(eq.mock.calls).toEqual([["id", "contact-1"], ["tenant_id", "store-116"], ["control_room_id", "room-1"]]);
  });
  it("scopes deletion to the contact, selected store and room", async () => {
    mockWrites();
    await deleteTenantContact(tenant, "contact-1");
    expect(remove).toHaveBeenCalledOnce();
    expect(eq.mock.calls).toEqual([["id", "contact-1"], ["tenant_id", "store-116"], ["control_room_id", "room-1"]]);
  });
  it("does not write contacts with blank names", async () => {
    mockWrites();
    await expect(saveTenantContact(tenant, { ...values, name: " " })).rejects.toThrow("Enter the contact's name.");
    expect(insert).not.toHaveBeenCalled();
  });
  it("reports failed saves rather than returning success", async () => {
    mockWrites();
    single.mockResolvedValue({ data: null, error: new Error("Permission denied") });
    await expect(saveTenantContact(tenant, values)).rejects.toThrow("Permission denied");
  });
});