import "dotenv/config";

import { hashSync } from "bcryptjs";

import { forDealership, forPlatform } from "../src/features/tenancy";

const platform = forPlatform();

const SEED_PASSWORD_HASH = hashSync("Password123!", 10);

type VehicleSeed = {
  brand: string;
  bodyType: string;
  title: string;
  year: number;
  price: number;
  discountPrice?: number;
  mileage: number;
  fuelType:
    | "PETROL"
    | "DIESEL"
    | "ELECTRIC"
    | "HYBRID"
    | "PLUGIN_HYBRID"
    | "LPG"
    | "OTHER";
  transmission: "MANUAL" | "AUTOMATIC" | "CVT" | "SEMI_AUTOMATIC";
  driveType: "FWD" | "RWD" | "AWD" | "FOUR_WD";
  condition: "NEW" | "USED" | "IMPORTED" | "CERTIFIED_PRE_OWNED";
  color: string;
  seats: number;
  doors: number;
  engineSizeCc: number;
  status: "DRAFT" | "AVAILABLE" | "RESERVED" | "SOLD" | "ARCHIVED" | "HIDDEN";
  isFeatured?: boolean;
};

const BRANDS = ["Toyota", "Mercedes-Benz", "BMW", "Land Rover", "Nissan", "Ford"] as const;
const BODY_TYPES = ["SUV", "Sedan", "Pickup", "Hatchback", "Coupe"] as const;

const VEHICLES: VehicleSeed[] = [
  { brand: "Toyota", bodyType: "SUV", title: "Toyota Land Cruiser Prado", year: 2021, price: 62_000_000, mileage: 34_000, fuelType: "DIESEL", transmission: "AUTOMATIC", driveType: "FOUR_WD", condition: "USED", color: "Pearl White", seats: 7, doors: 5, engineSizeCc: 2800, status: "AVAILABLE", isFeatured: true },
  { brand: "Toyota", bodyType: "Sedan", title: "Toyota Corolla Altis", year: 2022, price: 28_500_000, mileage: 12_000, fuelType: "PETROL", transmission: "CVT", driveType: "FWD", condition: "USED", color: "Silver", seats: 5, doors: 4, engineSizeCc: 1800, status: "AVAILABLE" },
  { brand: "Toyota", bodyType: "Pickup", title: "Toyota Hilux Double Cab", year: 2020, price: 48_000_000, mileage: 61_000, fuelType: "DIESEL", transmission: "MANUAL", driveType: "FOUR_WD", condition: "USED", color: "Grey", seats: 5, doors: 4, engineSizeCc: 2400, status: "AVAILABLE" },
  { brand: "Toyota", bodyType: "SUV", title: "Toyota RAV4 Hybrid", year: 2023, price: 54_000_000, mileage: 8_000, fuelType: "HYBRID", transmission: "AUTOMATIC", driveType: "AWD", condition: "IMPORTED", color: "Blue", seats: 5, doors: 5, engineSizeCc: 2500, status: "AVAILABLE", isFeatured: true },
  { brand: "Mercedes-Benz", bodyType: "Sedan", title: "Mercedes-Benz C200", year: 2021, price: 89_000_000, mileage: 22_000, fuelType: "PETROL", transmission: "AUTOMATIC", driveType: "RWD", condition: "USED", color: "Obsidian Black", seats: 5, doors: 4, engineSizeCc: 2000, status: "AVAILABLE", isFeatured: true },
  { brand: "Mercedes-Benz", bodyType: "SUV", title: "Mercedes-Benz GLE 350", year: 2022, price: 165_000_000, mileage: 15_000, fuelType: "PETROL", transmission: "AUTOMATIC", driveType: "AWD", condition: "USED", color: "White", seats: 5, doors: 5, engineSizeCc: 3000, status: "RESERVED" },
  { brand: "Mercedes-Benz", bodyType: "Coupe", title: "Mercedes-Benz E-Class Coupe", year: 2020, price: 110_000_000, mileage: 41_000, fuelType: "PETROL", transmission: "AUTOMATIC", driveType: "RWD", condition: "USED", color: "Red", seats: 4, doors: 2, engineSizeCc: 2000, status: "AVAILABLE" },
  { brand: "BMW", bodyType: "Sedan", title: "BMW 320i M Sport", year: 2021, price: 92_000_000, mileage: 26_000, fuelType: "PETROL", transmission: "AUTOMATIC", driveType: "RWD", condition: "USED", color: "Alpine White", seats: 5, doors: 4, engineSizeCc: 2000, status: "AVAILABLE" },
  { brand: "BMW", bodyType: "SUV", title: "BMW X5 xDrive40i", year: 2022, price: 178_000_000, mileage: 18_500, fuelType: "PETROL", transmission: "AUTOMATIC", driveType: "AWD", condition: "USED", color: "Black Sapphire", seats: 5, doors: 5, engineSizeCc: 3000, status: "AVAILABLE", isFeatured: true },
  { brand: "Land Rover", bodyType: "SUV", title: "Range Rover Sport HSE", year: 2021, price: 210_000_000, mileage: 29_000, fuelType: "DIESEL", transmission: "AUTOMATIC", driveType: "FOUR_WD", condition: "USED", color: "Santorini Black", seats: 5, doors: 5, engineSizeCc: 3000, status: "SOLD" },
  { brand: "Land Rover", bodyType: "SUV", title: "Land Rover Defender 110", year: 2023, price: 245_000_000, mileage: 5_000, fuelType: "DIESEL", transmission: "AUTOMATIC", driveType: "FOUR_WD", condition: "IMPORTED", color: "Pangea Green", seats: 5, doors: 5, engineSizeCc: 3000, status: "AVAILABLE", isFeatured: true },
  { brand: "Nissan", bodyType: "Hatchback", title: "Nissan Note e-Power", year: 2022, price: 22_000_000, mileage: 14_000, fuelType: "HYBRID", transmission: "CVT", driveType: "FWD", condition: "IMPORTED", color: "Orange", seats: 5, doors: 5, engineSizeCc: 1200, status: "AVAILABLE" },
  { brand: "Nissan", bodyType: "SUV", title: "Nissan X-Trail", year: 2020, price: 39_000_000, mileage: 55_000, fuelType: "PETROL", transmission: "CVT", driveType: "AWD", condition: "USED", color: "Grey", seats: 7, doors: 5, engineSizeCc: 2000, status: "AVAILABLE" },
  { brand: "Ford", bodyType: "Pickup", title: "Ford Ranger Wildtrak", year: 2021, price: 51_000_000, mileage: 38_000, fuelType: "DIESEL", transmission: "AUTOMATIC", driveType: "FOUR_WD", condition: "USED", color: "Blue", seats: 5, doors: 4, engineSizeCc: 2000, status: "AVAILABLE" },
  { brand: "Ford", bodyType: "SUV", title: "Ford Everest Titanium", year: 2019, price: 44_000_000, mileage: 68_000, fuelType: "DIESEL", transmission: "AUTOMATIC", driveType: "FOUR_WD", condition: "USED", color: "White", seats: 7, doors: 5, engineSizeCc: 2000, status: "ARCHIVED" },
];

const DEALERSHIPS = [
  {
    slug: "prestige-motors-kampala",
    name: "Prestige Motors Kampala",
    brandColor: "#2563EB",
    businessName: "Prestige Motors Kampala",
    tagline: "Uganda's home of certified premium vehicles.",
    whatsappNumber: "+256700000001",
    email: "sales@prestigemotors.example",
    address: "Plot 14, Kampala Road, Kampala, Uganda",
    latitude: 0.3476,
    longitude: 32.5825,
  },
  {
    slug: "elite-auto-nairobi",
    name: "Elite Auto Nairobi",
    brandColor: "#C8A24B",
    businessName: "Elite Auto Nairobi",
    tagline: "Nairobi's trusted dealership for imported and local vehicles.",
    whatsappNumber: "+254700000002",
    email: "sales@eliteauto.example",
    address: "Mombasa Road, Nairobi, Kenya",
    latitude: -1.3194,
    longitude: 36.8272,
  },
] as const;

const POLICY_PAGES: Array<{ key: "PRIVACY" | "TERMS" | "COOKIE_POLICY" | "WARRANTY" | "RETURNS" | "FINANCING" | "ABOUT"; title: string; content: string }> = [
  { key: "ABOUT", title: "About Us", content: "We are a family-run dealership with over a decade of experience sourcing and certifying quality vehicles for our community." },
  { key: "PRIVACY", title: "Privacy Policy", content: "We collect only the contact details you provide when making an inquiry or reservation, and use them solely to respond to you and process your purchase." },
  { key: "TERMS", title: "Terms of Service", content: "All vehicle listings are subject to availability. Prices are quoted in local currency and may be updated without notice until a deposit is paid." },
  { key: "COOKIE_POLICY", title: "Cookie Policy", content: "We use essential cookies to keep your session and preferences working correctly across the site." },
  { key: "WARRANTY", title: "Warranty Policy", content: "Vehicles sold as Certified Pre-Owned include a 3-month/5,000km mechanical warranty covering the engine and transmission." },
  { key: "RETURNS", title: "Returns Policy", content: "Deposits are refundable in full if the vehicle fails our pre-collection inspection or if the dealership cancels the sale." },
  { key: "FINANCING", title: "Financing", content: "We partner with local banks and SACCOs to help qualifying buyers arrange installment financing on vehicles over 10,000,000 UGX/KES." },
];

async function resetSeedData() {
  await platform.dealership.deleteMany({ where: { slug: { in: DEALERSHIPS.map((d) => d.slug) } } });
  await platform.user.deleteMany({ where: { role: "PLATFORM_ADMIN" } });
  await platform.plan.deleteMany({ where: { code: { in: ["starter", "growth"] } } });
}

async function seedPlans() {
  const starter = await platform.plan.create({
    data: {
      code: "starter",
      name: "Starter",
      priceMonthly: 150_000,
      priceYearly: 1_500_000,
      currency: "UGX",
      trialDays: 14,
      features: { maxVehicles: 50, staffSeats: 3, deposits: true },
    },
  });
  const growth = await platform.plan.create({
    data: {
      code: "growth",
      name: "Growth",
      priceMonthly: 350_000,
      priceYearly: 3_500_000,
      currency: "UGX",
      trialDays: 14,
      features: { maxVehicles: 500, staffSeats: 15, deposits: true, blog: true },
    },
  });
  return { starter, growth };
}

async function seedPlatformAdmin() {
  await platform.user.create({
    data: {
      email: "admin@moto.example",
      passwordHash: SEED_PASSWORD_HASH,
      name: "Moto Platform Admin",
      role: "PLATFORM_ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedDealership(config: (typeof DEALERSHIPS)[number], planId: string) {
  const dealership = await platform.dealership.create({
    data: { slug: config.slug, name: config.name },
  });

  const db = forDealership(dealership.id);

  await db.subscription.create({
    data: {
      dealershipId: dealership.id,
      planId,
      status: "TRIALING",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await db.setting.create({
    data: {
      dealershipId: dealership.id,
      businessName: config.businessName,
      tagline: config.tagline,
      brandColor: config.brandColor,
      whatsappNumber: config.whatsappNumber,
      phonePrimary: config.whatsappNumber,
      email: config.email,
      address: config.address,
      latitude: config.latitude,
      longitude: config.longitude,
      businessHours: {
        mon_fri: "08:00-18:00",
        sat: "09:00-16:00",
        sun: "closed",
      },
      socialLinks: { facebook: "", instagram: "", twitter: "" },
      depositType: "PERCENTAGE",
      depositPercentage: 10,
      depositHoldHours: 48,
      refundPolicyText:
        "Deposits are fully refundable if the vehicle fails inspection or the hold period expires before you complete the purchase.",
    },
  });

  const brandBySlug = new Map<string, { id: string }>();
  for (const [i, name] of BRANDS.entries()) {
    const brand = await db.brand.create({
      data: { dealershipId: dealership.id, name, slug: slugify(name), order: i, isFeatured: i < 3 },
    });
    brandBySlug.set(name, brand);
  }

  const bodyTypeBySlug = new Map<string, { id: string }>();
  for (const [i, name] of BODY_TYPES.entries()) {
    const bodyType = await db.bodyType.create({
      data: { dealershipId: dealership.id, name, slug: slugify(name), order: i },
    });
    bodyTypeBySlug.set(name, bodyType);
  }

  const vehicles: Awaited<ReturnType<typeof db.vehicle.create>>[] = [];
  for (const [i, v] of VEHICLES.entries()) {
    const brand = brandBySlug.get(v.brand);
    const bodyType = bodyTypeBySlug.get(v.bodyType);
    if (!brand || !bodyType) throw new Error(`Missing brand/bodyType for ${v.title}`);

    const vehicle = await db.vehicle.create({
      data: {
        dealershipId: dealership.id,
        brandId: brand.id,
        bodyTypeId: bodyType.id,
        title: v.title,
        slug: `${slugify(v.title)}-${v.year}-${dealership.slug.slice(0, 4)}-${i}`,
        year: v.year,
        price: v.price,
        discountPrice: v.discountPrice,
        currency: config.slug.includes("nairobi") ? "KES" : "UGX",
        mileage: v.mileage,
        fuelType: v.fuelType,
        transmission: v.transmission,
        driveType: v.driveType,
        condition: v.condition,
        color: v.color,
        seats: v.seats,
        doors: v.doors,
        engineSizeCc: v.engineSizeCc,
        description: `A well-maintained ${v.year} ${v.title} in ${v.color.toLowerCase()}, ${v.condition.toLowerCase()} condition with ${v.mileage.toLocaleString()}km on the odometer.`,
        features: ["Air Conditioning", "Bluetooth", "Reverse Camera", "Alloy Wheels"],
        status: v.status,
        isFeatured: v.isFeatured ?? false,
        soldAt: v.status === "SOLD" ? new Date() : null,
      },
    });

    await db.vehicleImage.create({
      data: {
        dealershipId: dealership.id,
        vehicleId: vehicle.id,
        url: `https://res.cloudinary.com/demo/image/upload/v1/moto/${dealership.slug}/${vehicle.slug}-1.jpg`,
        publicId: `moto/${dealership.slug}/${vehicle.slug}-1`,
        altText: v.title,
        order: 0,
        isCover: true,
      },
    });

    vehicles.push(vehicle);
  }

  const collections: Array<{ name: string; slug: string; predicate: (v: (typeof vehicles)[number]) => boolean }> = [
    { name: "Luxury Collection", slug: "luxury", predicate: (v) => Number(v.price) >= 80_000_000 },
    { name: "SUVs", slug: "suvs", predicate: (v) => v.bodyTypeId === bodyTypeBySlug.get("SUV")?.id },
    { name: "Best Deals", slug: "best-deals", predicate: (v) => v.status === "AVAILABLE" },
  ];

  for (const [i, c] of collections.entries()) {
    const collection = await db.collection.create({
      data: { dealershipId: dealership.id, name: c.name, slug: c.slug, order: i, isFeatured: true },
    });
    const matches = vehicles.filter(c.predicate).slice(0, 6);
    for (const [j, vehicle] of matches.entries()) {
      await db.collectionVehicle.create({
        data: {
          dealershipId: dealership.id,
          collectionId: collection.id,
          vehicleId: vehicle.id,
          order: j,
        },
      });
    }
  }

  for (const page of POLICY_PAGES) {
    await db.page.create({
      data: {
        dealershipId: dealership.id,
        key: page.key,
        slug: slugify(page.key),
        title: page.title,
        content: page.content,
      },
    });
  }

  const menuItems: Array<{ location: "HEADER" | "FOOTER"; label: string; url: string; order: number }> = [
    { location: "HEADER", label: "Inventory", url: "/inventory", order: 0 },
    { location: "HEADER", label: "About", url: "/about", order: 1 },
    { location: "HEADER", label: "Contact", url: "/contact", order: 2 },
    { location: "FOOTER", label: "Privacy Policy", url: "/privacy", order: 0 },
    { location: "FOOTER", label: "Terms of Service", url: "/terms", order: 1 },
  ];
  for (const item of menuItems) {
    await db.menu.create({ data: { dealershipId: dealership.id, ...item } });
  }

  const owner = await platform.user.create({
    data: {
      email: `owner@${config.slug}.example`,
      passwordHash: SEED_PASSWORD_HASH,
      name: `${config.name} Owner`,
      role: "OWNER",
      dealershipId: dealership.id,
      emailVerifiedAt: new Date(),
    },
  });
  const manager = await platform.user.create({
    data: {
      email: `manager@${config.slug}.example`,
      passwordHash: SEED_PASSWORD_HASH,
      name: `${config.name} Manager`,
      role: "MANAGER",
      dealershipId: dealership.id,
      emailVerifiedAt: new Date(),
    },
  });
  await platform.user.create({
    data: {
      email: `sales@${config.slug}.example`,
      passwordHash: SEED_PASSWORD_HASH,
      name: `${config.name} Sales Rep`,
      role: "SALES",
      dealershipId: dealership.id,
      emailVerifiedAt: new Date(),
    },
  });

  const featuredVehicle = vehicles.find((v) => v.isFeatured) ?? vehicles[0]!;
  await db.lead.create({
    data: {
      dealershipId: dealership.id,
      source: "VEHICLE_INQUIRY",
      name: "Grace Namutebi",
      phone: "+256772000111",
      email: "grace.namutebi@example.com",
      message: `Is the ${featuredVehicle.title} still available? I'd like to view it this weekend.`,
      vehicleId: featuredVehicle.id,
      status: "NEW",
    },
  });
  await db.lead.create({
    data: {
      dealershipId: dealership.id,
      source: "CONTACT_FORM",
      name: "Brian Okello",
      phone: "+256772000222",
      message: "Do you offer financing on vehicles above 40 million?",
      status: "CONTACTED",
      assignedToId: manager.id,
    },
  });

  const soldVehicle = vehicles.find((v) => v.status === "SOLD");
  if (soldVehicle) {
    const reservation = await db.reservation.create({
      data: {
        dealershipId: dealership.id,
        vehicleId: soldVehicle.id,
        buyerName: "Patrick Ssemakula",
        buyerPhone: "+256772000333",
        buyerEmail: "patrick.ssemakula@example.com",
        depositAmount: Number(soldVehicle.price) * 0.1,
        currency: soldVehicle.currency,
        status: "COMPLETED",
        holdExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });
    await db.paymentTransaction.create({
      data: {
        dealershipId: dealership.id,
        reservationId: reservation.id,
        purpose: "DEPOSIT",
        provider: "FLUTTERWAVE",
        providerRef: `seed-${dealership.slug}-${soldVehicle.id}`,
        flwTransactionId: `demo-${Date.now()}`,
        status: "SUCCESSFUL",
        amount: reservation.depositAmount,
        currency: reservation.currency,
        verifiedAt: new Date(),
      },
    });
  }

  console.log(`Seeded ${dealership.name} (${dealership.slug}) — ${vehicles.length} vehicles, owner=${owner.email}`);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await resetSeedData();
  const { starter } = await seedPlans();
  await seedPlatformAdmin();

  for (const config of DEALERSHIPS) {
    await seedDealership(config, starter.id);
  }

  console.log("\nSeed complete. All seeded users share the password: Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await platform.$disconnect();
  });
