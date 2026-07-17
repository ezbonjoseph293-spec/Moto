import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" || v === undefined ? undefined : v);
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());
const optionalNumber = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : Number(v)), schema.optional());

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Enter a hex color like #2563EB.");

const hoursValueSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(closed|([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d)$/,
    'Use "closed" or a range like 08:00-18:00.',
  );

export const businessHoursSchema = z.object({
  mon_fri: hoursValueSchema,
  sat: hoursValueSchema,
  sun: hoursValueSchema,
});
export type BusinessHours = z.infer<typeof businessHoursSchema>;

export const socialLinksSchema = z.object({
  facebook: optionalString(z.string().trim().url("Enter a valid URL.")),
  instagram: optionalString(z.string().trim().url("Enter a valid URL.")),
  twitter: optionalString(z.string().trim().url("Enter a valid URL.")),
  tiktok: optionalString(z.string().trim().url("Enter a valid URL.")),
});
export type SocialLinks = z.infer<typeof socialLinksSchema>;

export const fontChoiceValues = ["default", "classic", "modern"] as const;
export const borderRadiusValues = ["none", "sm", "md", "lg"] as const;
export const buttonStyleValues = ["solid", "outline"] as const;

export const identitySchema = z.object({
  businessName: z.string().trim().min(2, "Business name is too short.").max(120),
  tagline: optionalString(z.string().trim().max(160)),
  logoLightUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
  logoDarkUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
  faviconUrl: optionalString(z.string().trim().url("Enter a valid URL.")),
  brandColor: hexColorSchema,
  fontChoice: z.enum(fontChoiceValues),
  borderRadius: z.enum(borderRadiusValues),
  buttonStyle: z.enum(buttonStyleValues),
});
export type IdentityInput = z.infer<typeof identitySchema>;

export const contactSchema = z.object({
  phonePrimary: optionalString(z.string().trim().max(30)),
  phoneSecondary: optionalString(z.string().trim().max(30)),
  whatsappNumber: optionalString(z.string().trim().max(30)),
  email: optionalString(z.string().trim().email("Enter a valid email address.")),
  address: optionalString(z.string().trim().max(300)),
  latitude: optionalNumber(z.number().min(-90).max(90)),
  longitude: optionalNumber(z.number().min(-180).max(180)),
  hoursMonFri: hoursValueSchema,
  hoursSat: hoursValueSchema,
  hoursSun: hoursValueSchema,
  socialFacebook: optionalString(z.string().trim().url("Enter a valid URL.")),
  socialInstagram: optionalString(z.string().trim().url("Enter a valid URL.")),
  socialTwitter: optionalString(z.string().trim().url("Enter a valid URL.")),
  socialTiktok: optionalString(z.string().trim().url("Enter a valid URL.")),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const depositTypeValues = ["FIXED", "PERCENTAGE"] as const;

export const depositSchema = z
  .object({
    depositType: z.enum(depositTypeValues),
    depositFixedAmount: optionalNumber(z.number().positive()),
    depositPercentage: optionalNumber(z.number().min(0.1).max(100)),
    depositHoldHours: z.coerce.number().int().min(1).max(720),
    refundPolicyText: optionalString(z.string().trim().max(4000)),
  })
  .refine((v) => v.depositType !== "FIXED" || v.depositFixedAmount !== undefined, {
    message: "Enter a fixed deposit amount.",
    path: ["depositFixedAmount"],
  })
  .refine((v) => v.depositType !== "PERCENTAGE" || v.depositPercentage !== undefined, {
    message: "Enter a deposit percentage.",
    path: ["depositPercentage"],
  });
export type DepositInput = z.infer<typeof depositSchema>;

export const announcementSchema = z.object({
  announcementBarText: optionalString(z.string().trim().max(200)),
  announcementBarActive: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const menuLocationValues = ["HEADER", "FOOTER"] as const;

export const menuItemSchema = z.object({
  location: z.enum(menuLocationValues),
  label: z.string().trim().min(1, "Label is required.").max(60),
  url: z.string().trim().min(1, "URL is required.").max(300),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;
