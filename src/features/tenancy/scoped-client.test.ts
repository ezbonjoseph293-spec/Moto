import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { forDealership, forPlatform, TenancyViolationError } from "@/features/tenancy";

const platform = forPlatform();

let dealerA: { id: string };
let dealerB: { id: string };
let brandA: { id: string };
let brandB: { id: string };
let vehicleA: { id: string };
let vehicleB: { id: string };

beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8);

  dealerA = await platform.dealership.create({
    data: { slug: `test-dealer-a-${suffix}`, name: "Test Dealer A" },
  });
  dealerB = await platform.dealership.create({
    data: { slug: `test-dealer-b-${suffix}`, name: "Test Dealer B" },
  });

  const dbA = forDealership(dealerA.id);
  const dbB = forDealership(dealerB.id);

  brandA = await dbA.brand.create({
    data: { dealershipId: dealerA.id, name: "Toyota", slug: `toyota-${suffix}` },
  });
  brandB = await dbB.brand.create({
    data: { dealershipId: dealerB.id, name: "Toyota", slug: `toyota-${suffix}` },
  });

  vehicleA = await dbA.vehicle.create({
    data: vehicleFixture(dealerA.id, brandA.id, `land-cruiser-a-${suffix}`),
  });
  vehicleB = await dbB.vehicle.create({
    data: vehicleFixture(dealerB.id, brandB.id, `land-cruiser-b-${suffix}`),
  });
});

afterAll(async () => {
  // Cascades: deleting the dealership removes every dealer-owned row created above.
  await platform.dealership.deleteMany({ where: { id: { in: [dealerA.id, dealerB.id] } } });
});

function vehicleFixture(dealershipId: string, brandId: string, slug: string) {
  return {
    dealershipId,
    brandId,
    title: "Toyota Land Cruiser 2021",
    slug,
    year: 2021,
    price: 45000,
    fuelType: "DIESEL" as const,
    transmission: "AUTOMATIC" as const,
    condition: "USED" as const,
    description: "A well-maintained Land Cruiser.",
  };
}

describe("tenant isolation", () => {
  it("never returns another tenant's rows from findMany", async () => {
    const dbA = forDealership(dealerA.id);
    const vehicles = await dbA.vehicle.findMany({ where: { id: { in: [vehicleA.id, vehicleB.id] } } });

    expect(vehicles).toHaveLength(1);
    expect(vehicles[0]?.id).toBe(vehicleA.id);
  });

  it("returns null from findUnique when the id belongs to another tenant", async () => {
    const dbA = forDealership(dealerA.id);
    const result = await dbA.vehicle.findUnique({ where: { id: vehicleB.id } });

    expect(result).toBeNull();
  });

  it("cannot update another tenant's row by id — record not found rather than a leaked mutation", async () => {
    const dbA = forDealership(dealerA.id);

    await expect(
      dbA.vehicle.update({ where: { id: vehicleB.id }, data: { title: "Hijacked" } }),
    ).rejects.toThrow();

    const untouched = await forPlatform().vehicle.findUnique({ where: { id: vehicleB.id } });
    expect(untouched?.title).not.toBe("Hijacked");
  });

  it("updateMany scoped to tenant A affects zero of tenant B's rows", async () => {
    const dbA = forDealership(dealerA.id);
    const result = await dbA.vehicle.updateMany({
      where: { id: vehicleB.id },
      data: { title: "Hijacked" },
    });

    expect(result.count).toBe(0);
  });

  it("throws when a query explicitly names a different tenant's dealershipId", async () => {
    const dbA = forDealership(dealerA.id);

    await expect(
      dbA.vehicle.findFirst({ where: { dealershipId: dealerB.id } }),
    ).rejects.toThrow(TenancyViolationError);
  });

  it("throws when creating a row with a mismatched dealershipId", async () => {
    const dbA = forDealership(dealerA.id);

    await expect(
      dbA.brand.create({
        data: { name: "Nissan", slug: `nissan-${randomUUID()}`, dealershipId: dealerB.id },
      }),
    ).rejects.toThrow(TenancyViolationError);
  });

  it("stamps dealershipId automatically at runtime even if a caller bypasses the type check", async () => {
    // TypeScript requires dealershipId on every create() call (see the type
    // errors this would otherwise produce), but the extension backstops any
    // caller that bypasses that — e.g. plain-JS callers, or an `as never`
    // escape hatch like this test — by stamping the correct tenant regardless.
    const dbA = forDealership(dealerA.id);
    const brand = await dbA.brand.create({
      data: { name: "Mazda", slug: `mazda-${randomUUID()}` } as never,
    });

    expect(brand.dealershipId).toBe(dealerA.id);
  });

  it("rejects an empty dealershipId outright", () => {
    expect(() => forDealership("")).toThrow(TenancyViolationError);
  });

  it("forPlatform() is intentionally unscoped and can see both tenants", async () => {
    const vehicles = await forPlatform().vehicle.findMany({
      where: { id: { in: [vehicleA.id, vehicleB.id] } },
    });

    expect(vehicles.map((v) => v.id).sort()).toEqual([vehicleA.id, vehicleB.id].sort());
  });
});
