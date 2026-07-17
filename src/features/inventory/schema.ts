import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === undefined ? undefined : v);
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());
const optionalNumber = (schema: z.ZodTypeAny) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    schema.optional(),
  );

export const fuelTypeValues = [
  "PETROL",
  "DIESEL",
  "ELECTRIC",
  "HYBRID",
  "PLUGIN_HYBRID",
  "LPG",
  "OTHER",
] as const;
export const transmissionValues = ["MANUAL", "AUTOMATIC", "CVT", "SEMI_AUTOMATIC"] as const;
export const driveTypeValues = ["FWD", "RWD", "AWD", "FOUR_WD"] as const;
export const conditionValues = ["NEW", "USED", "IMPORTED", "CERTIFIED_PRE_OWNED"] as const;
export const mileageUnitValues = ["KM", "MILES"] as const;
export const vehicleStatusValues = [
  "DRAFT",
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
  "HIDDEN",
] as const;

/**
 * Legal Vehicle status transitions. RESERVED is deliberately unreachable
 * from the admin UI — it's only ever entered by the Stage 6 payment webhook.
 */
export const VEHICLE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  DRAFT: ["AVAILABLE", "ARCHIVED"],
  AVAILABLE: ["DRAFT", "SOLD", "ARCHIVED", "HIDDEN"],
  RESERVED: ["AVAILABLE", "SOLD", "ARCHIVED"],
  SOLD: ["ARCHIVED"],
  ARCHIVED: ["DRAFT", "AVAILABLE"],
  HIDDEN: ["AVAILABLE", "ARCHIVED"],
};

/** Comma/newline separated free-text -> trimmed non-empty string array. */
const featuresListSchema = z.preprocess(
  (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string") return [];
    return v
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  },
  z.array(z.string().max(80)).max(60),
);

export const vehicleSchema = z.object({
  brandId: z.string().min(1, "Choose a brand."),
  bodyTypeId: optionalString(z.string()),
  title: z.string().trim().min(2, "Title is too short.").max(160),
  year: z.coerce
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Enter a valid price."),
  currency: z.string().trim().length(3).default("UGX"),
  discountPrice: optionalNumber(z.number().positive()),
  mileage: optionalNumber(z.number().int().min(0)),
  mileageUnit: z.enum(mileageUnitValues).default("KM"),
  fuelType: z.enum(fuelTypeValues),
  transmission: z.enum(transmissionValues),
  driveType: optionalString(z.enum(driveTypeValues)),
  condition: z.enum(conditionValues),
  color: optionalString(z.string().trim().max(40)),
  seats: optionalNumber(z.number().int().min(1).max(60)),
  doors: optionalNumber(z.number().int().min(1).max(8)),
  engineSizeCc: optionalNumber(z.number().int().min(0)),
  vin: optionalString(z.string().trim().max(40)),
  description: z.string().trim().min(10, "Add a short description.").max(6000),
  features: featuresListSchema,
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
  publishAt: optionalString(z.string()),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

export const vehicleStatusSchema = z.object({
  status: z.enum(vehicleStatusValues),
});

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  logoUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
  description: optionalString(z.string().trim().max(500)),
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const bodyTypeSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  iconUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
});
export type BodyTypeInput = z.infer<typeof bodyTypeSchema>;

export const collectionRuleFieldValues = [
  "price",
  "year",
  "mileage",
  "condition",
  "brandId",
  "bodyTypeId",
  "status",
] as const;
export const collectionRuleOperatorValues = ["eq", "lt", "lte", "gt", "gte"] as const;

export const collectionRuleSchema = z.object({
  field: z.enum(collectionRuleFieldValues),
  operator: z.enum(collectionRuleOperatorValues),
  value: z.string().trim().min(1).max(60),
});
export type CollectionRule = z.infer<typeof collectionRuleSchema>;

export const collectionRuleConfigSchema = z.object({
  rules: z.array(collectionRuleSchema).max(10),
});
export type CollectionRuleConfig = z.infer<typeof collectionRuleConfigSchema>;

export const collectionRuleTypeValues = ["MANUAL", "RULE_BASED"] as const;

export const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  description: optionalString(z.string().trim().max(500)),
  imageUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
  ruleType: z.enum(collectionRuleTypeValues),
  rulesJson: optionalString(z.string()),
});
export type CollectionInput = z.infer<typeof collectionSchema>;

export const bulkStatusSchema = z.object({
  vehicleIds: z.array(z.string()).min(1),
  status: z.enum(vehicleStatusValues),
});

export const bulkPricingSchema = z.object({
  vehicleIds: z.array(z.string()).min(1),
  mode: z.enum(["set", "increase_pct", "decrease_pct"]),
  amount: z.coerce.number().positive(),
});

export const bulkDeleteSchema = z.object({
  vehicleIds: z.array(z.string()).min(1),
});

/** One row of an inventory CSV import — matches the export column order. */
export const csvVehicleRowSchema = z.object({
  title: z.string().trim().min(2),
  brand: z.string().trim().min(1),
  bodyType: optionalString(z.string().trim()),
  year: z.coerce.number().int().min(1950),
  price: z.coerce.number().positive(),
  discountPrice: optionalNumber(z.number().positive()),
  currency: optionalString(z.string().trim().length(3)),
  mileage: optionalNumber(z.number().int().min(0)),
  mileageUnit: optionalString(z.enum(mileageUnitValues)),
  fuelType: z.enum(fuelTypeValues),
  transmission: z.enum(transmissionValues),
  driveType: optionalString(z.enum(driveTypeValues)),
  condition: z.enum(conditionValues),
  color: optionalString(z.string().trim()),
  seats: optionalNumber(z.number().int().min(1)),
  doors: optionalNumber(z.number().int().min(1)),
  engineSizeCc: optionalNumber(z.number().int().min(0)),
  vin: optionalString(z.string().trim()),
  description: z.string().trim().min(10),
  features: optionalString(z.string()),
  status: optionalString(z.enum(vehicleStatusValues)),
});
export type CsvVehicleRow = z.infer<typeof csvVehicleRowSchema>;
