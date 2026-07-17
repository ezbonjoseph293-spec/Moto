import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const verifyTransactionMock = vi.fn();

vi.mock("@/lib/flutterwave", () => ({
  verifyTransaction: verifyTransactionMock,
  isValidWebhookHash: vi.fn(() => true),
  initiatePayment: vi.fn(),
}));
vi.mock("@/lib/sms", () => ({ sendSms: vi.fn() }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn() }));

const { forDealership, forPlatform } = await import("@/features/tenancy");
const {
  processFlutterwaveWebhookEvent,
  expireStaleReservations,
  syncReservationOnVehicleRelease,
  markReservationRefunded,
  markReservationDisputed,
} = await import("./service");

const platform = forPlatform();
const DEPOSIT_AMOUNT = 500_000;
const CURRENCY = "UGX";

let dealer: { id: string };
let brand: { id: string };
let actorId: string;

beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8);
  dealer = await platform.dealership.create({
    data: { slug: `test-payments-${suffix}`, name: "Test Payments Dealer" },
  });
  await platform.setting.create({
    data: {
      dealershipId: dealer.id,
      depositType: "FIXED",
      depositFixedAmount: DEPOSIT_AMOUNT,
      depositHoldHours: 48,
    },
  });
  brand = await forDealership(dealer.id).brand.create({
    data: { dealershipId: dealer.id, name: "Toyota", slug: `toyota-${suffix}` },
  });
  const owner = await forDealership(dealer.id).user.create({
    data: {
      dealershipId: dealer.id,
      name: "Test Owner",
      email: `owner-${suffix}@example.com`,
      passwordHash: "not-a-real-hash",
      role: "OWNER",
    },
  });
  actorId = owner.id;
});

afterAll(async () => {
  await platform.dealership.delete({ where: { id: dealer.id } });
});

beforeEach(() => {
  verifyTransactionMock.mockReset();
});

let vehicleCounter = 0;
async function createVehicle(status: "AVAILABLE" | "RESERVED" = "AVAILABLE") {
  vehicleCounter += 1;
  const db = forDealership(dealer.id);
  return db.vehicle.create({
    data: {
      dealershipId: dealer.id,
      brandId: brand.id,
      title: `Test Vehicle ${vehicleCounter}`,
      slug: `test-vehicle-${vehicleCounter}-${randomUUID().slice(0, 8)}`,
      year: 2022,
      price: 20_000_000,
      currency: CURRENCY,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      condition: "USED",
      description: "A test vehicle.",
      status,
    },
  });
}

async function createPendingReservation(vehicleId: string, amount = DEPOSIT_AMOUNT) {
  const db = forDealership(dealer.id);
  const reservation = await db.reservation.create({
    data: {
      dealershipId: dealer.id,
      vehicleId,
      buyerName: "Test Buyer",
      buyerPhone: "+256700000000",
      depositAmount: amount,
      currency: CURRENCY,
      status: "PENDING_PAYMENT",
    },
  });
  const txRef = `dep_${reservation.id}`;
  await db.paymentTransaction.create({
    data: {
      dealershipId: dealer.id,
      reservationId: reservation.id,
      purpose: "DEPOSIT",
      provider: "FLUTTERWAVE",
      providerRef: txRef,
      status: "PENDING",
      amount,
      currency: CURRENCY,
    },
  });
  return { reservation, txRef };
}

function mockSuccessfulVerification() {
  verifyTransactionMock.mockImplementation(async (flwTransactionId: string) => ({
    ok: true as const,
    status: "successful" as const,
    amount: DEPOSIT_AMOUNT,
    currency: CURRENCY,
    txRef: flwTransactionId,
    flwTransactionId,
    raw: {},
  }));
}

describe("processFlutterwaveWebhookEvent", () => {
  it("confirms payment and reserves the vehicle on a valid webhook", async () => {
    const vehicle = await createVehicle();
    const { reservation, txRef } = await createPendingReservation(vehicle.id);
    mockSuccessfulVerification();

    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });

    const db = forDealership(dealer.id);
    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    const updatedVehicle = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    const txn = await db.paymentTransaction.findUniqueOrThrow({ where: { providerRef: txRef } });

    expect(updatedReservation.status).toBe("ACTIVE");
    expect(updatedReservation.holdExpiresAt).not.toBeNull();
    expect(updatedVehicle.status).toBe("RESERVED");
    expect(txn.status).toBe("SUCCESSFUL");
  });

  it("cancels the reservation when Flutterwave verification fails", async () => {
    const vehicle = await createVehicle();
    const { reservation, txRef } = await createPendingReservation(vehicle.id);
    verifyTransactionMock.mockResolvedValue({ ok: false, error: "could not verify" });

    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });

    const db = forDealership(dealer.id);
    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    const updatedVehicle = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });
    const txn = await db.paymentTransaction.findUniqueOrThrow({ where: { providerRef: txRef } });

    expect(updatedReservation.status).toBe("CANCELLED");
    expect(updatedVehicle.status).toBe("AVAILABLE");
    expect(txn.status).toBe("FAILED");
  });

  it("cancels the reservation on a charge.failed event without calling verify", async () => {
    const vehicle = await createVehicle();
    const { reservation, txRef } = await createPendingReservation(vehicle.id);

    await processFlutterwaveWebhookEvent({
      event: "charge.failed",
      data: { id: txRef, tx_ref: txRef },
    });

    const db = forDealership(dealer.id);
    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(updatedReservation.status).toBe("CANCELLED");
    expect(verifyTransactionMock).not.toHaveBeenCalled();
  });

  it("is a no-op when the same successful webhook is replayed", async () => {
    const vehicle = await createVehicle();
    const { reservation, txRef } = await createPendingReservation(vehicle.id);
    mockSuccessfulVerification();

    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });
    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });

    const db = forDealership(dealer.id);
    const leadCount = await db.lead.count({ where: { vehicleId: vehicle.id } });
    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });

    expect(leadCount).toBe(1);
    expect(updatedReservation.status).toBe("ACTIVE");
    // The second delivery finds the PaymentTransaction already non-PENDING
    // and short-circuits before ever calling verifyTransaction again.
    expect(verifyTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("flags the losing reservation REFUND_PENDING when two buyers pay for one vehicle", async () => {
    const vehicle = await createVehicle();
    const { txRef: txRefA, reservation: reservationA } = await createPendingReservation(
      vehicle.id,
    );
    const { txRef: txRefB, reservation: reservationB } = await createPendingReservation(
      vehicle.id,
    );
    mockSuccessfulVerification();

    await Promise.all([
      processFlutterwaveWebhookEvent({
        event: "charge.completed",
        data: { id: txRefA, tx_ref: txRefA },
      }),
      processFlutterwaveWebhookEvent({
        event: "charge.completed",
        data: { id: txRefB, tx_ref: txRefB },
      }),
    ]);

    const db = forDealership(dealer.id);
    const [finalA, finalB, finalVehicle] = await Promise.all([
      db.reservation.findUniqueOrThrow({ where: { id: reservationA.id } }),
      db.reservation.findUniqueOrThrow({ where: { id: reservationB.id } }),
      db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } }),
    ]);

    const statuses = [finalA.status, finalB.status].sort();
    expect(statuses).toEqual(["ACTIVE", "REFUND_PENDING"].sort());
    expect(finalVehicle.status).toBe("RESERVED");
  });
});

describe("expireStaleReservations", () => {
  it("releases a stale ACTIVE hold back to AVAILABLE and flags a refund", async () => {
    const vehicle = await createVehicle("RESERVED");
    const db = forDealership(dealer.id);
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealer.id,
        vehicleId: vehicle.id,
        buyerName: "Late Buyer",
        buyerPhone: "+256700000001",
        depositAmount: DEPOSIT_AMOUNT,
        currency: CURRENCY,
        status: "ACTIVE",
        holdExpiresAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    await expireStaleReservations(dealer.id);

    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    const updatedVehicle = await db.vehicle.findUniqueOrThrow({ where: { id: vehicle.id } });

    expect(updatedReservation.status).toBe("EXPIRED");
    expect(updatedReservation.refundStatus).toBe("PENDING");
    expect(updatedVehicle.status).toBe("AVAILABLE");
  });

  it("cancels an abandoned PENDING_PAYMENT checkout after the abandon window", async () => {
    const vehicle = await createVehicle();
    const { reservation, txRef } = await createPendingReservation(vehicle.id);
    const db = forDealership(dealer.id);
    await db.reservation.update({
      where: { id: reservation.id },
      data: { createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    await expireStaleReservations(dealer.id);

    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    const txn = await db.paymentTransaction.findUniqueOrThrow({ where: { providerRef: txRef } });

    expect(updatedReservation.status).toBe("CANCELLED");
    expect(txn.status).toBe("FAILED");
  });

  it("leaves a fresh PENDING_PAYMENT checkout untouched", async () => {
    const vehicle = await createVehicle();
    const { reservation } = await createPendingReservation(vehicle.id);

    await expireStaleReservations(dealer.id);

    const db = forDealership(dealer.id);
    const updatedReservation = await db.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(updatedReservation.status).toBe("PENDING_PAYMENT");
  });
});

describe("syncReservationOnVehicleRelease", () => {
  it("completes the reservation when the dealer marks the vehicle SOLD", async () => {
    const vehicle = await createVehicle("RESERVED");
    const db = forDealership(dealer.id);
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealer.id,
        vehicleId: vehicle.id,
        buyerName: "Sold Buyer",
        buyerPhone: "+256700000002",
        depositAmount: DEPOSIT_AMOUNT,
        currency: CURRENCY,
        status: "ACTIVE",
        holdExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await syncReservationOnVehicleRelease(dealer.id, actorId, vehicle.id, "SOLD");

    const updated = await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(updated.status).toBe("COMPLETED");
  });

  it("cancels and flags a refund when the dealer releases the vehicle back to AVAILABLE", async () => {
    const vehicle = await createVehicle("RESERVED");
    const db = forDealership(dealer.id);
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealer.id,
        vehicleId: vehicle.id,
        buyerName: "Released Buyer",
        buyerPhone: "+256700000003",
        depositAmount: DEPOSIT_AMOUNT,
        currency: CURRENCY,
        status: "ACTIVE",
        holdExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await syncReservationOnVehicleRelease(dealer.id, actorId, vehicle.id, "AVAILABLE");

    const updated = await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(updated.status).toBe("CANCELLED");
    expect(updated.refundStatus).toBe("PENDING");
  });
});

describe("admin reservation actions", () => {
  it("marks a REFUND_PENDING reservation as REFUNDED", async () => {
    const vehicle = await createVehicle();
    const db = forDealership(dealer.id);
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealer.id,
        vehicleId: vehicle.id,
        buyerName: "Refund Buyer",
        buyerPhone: "+256700000004",
        depositAmount: DEPOSIT_AMOUNT,
        currency: CURRENCY,
        status: "REFUND_PENDING",
      },
    });

    const updated = await markReservationRefunded(
      dealer.id,
      actorId,
      reservation.id,
      "Refunded via mobile money.",
    );

    expect(updated.status).toBe("REFUNDED");
    expect(updated.refundStatus).toBe("REFUNDED");
  });

  it("marks a reservation as DISPUTED", async () => {
    const vehicle = await createVehicle();
    const db = forDealership(dealer.id);
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealer.id,
        vehicleId: vehicle.id,
        buyerName: "Dispute Buyer",
        buyerPhone: "+256700000005",
        depositAmount: DEPOSIT_AMOUNT,
        currency: CURRENCY,
        status: "REFUND_PENDING",
      },
    });

    const updated = await markReservationDisputed(
      dealer.id,
      actorId,
      reservation.id,
      "Buyer disputes the refund amount.",
    );

    expect(updated.status).toBe("DISPUTED");
  });
});
