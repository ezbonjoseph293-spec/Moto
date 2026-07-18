import type { Setting } from "@prisma/client";
import { z } from "zod";

/**
 * `Setting.depositFixedAmount`/`depositPercentage` come back from Prisma as
 * `Decimal` instances, which Next.js refuses to pass across the Server ->
 * Client Component boundary ("Only plain objects... Decimal objects are not
 * supported"). `getSettings()` callers serialize them to strings before
 * handing a `Setting` row to any client component — this type reflects that
 * post-serialization shape, and every settings form is typed against it.
 */
export type SerializedSetting = Omit<Setting, "depositFixedAmount" | "depositPercentage"> & {
  depositFixedAmount: string | null;
  depositPercentage: string | null;
};

const emptyToUndefined = (v: unknown) => (v === "" || v === undefined ? undefined : v);
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(emptyToUndefined, schema.optional());
const optionalNumber = (schema: z.ZodTypeAny) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    schema.optional(),
  );

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

export const notificationsSchema = z.object({
  notifyNewLeadEmail: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
  notifyNewLeadSms: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});
export type NotificationsInput = z.infer<typeof notificationsSchema>;

export const pageKeyValues = [
  "ABOUT",
  "PRIVACY",
  "TERMS",
  "COOKIE_POLICY",
  "WARRANTY",
  "RETURNS",
  "FINANCING",
] as const;

export const pageContentSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().trim().min(2, "Title is too short.").max(160),
  content: z.string().trim().min(10, "Add some content.").max(20_000),
  seoTitle: optionalString(z.string().trim().max(160)),
  seoDescription: optionalString(z.string().trim().max(300)),
});
export type PageContentInput = z.infer<typeof pageContentSchema>;

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2, "Name is too short.").max(120),
  customerPhoto: optionalString(z.string().trim().url("Enter a valid URL.")),
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(5, "Add a short message.").max(2000),
  isFeatured: z
    .union([z.literal("on"), z.literal("true"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export type WhyChooseUsItem = { title: string; body: string };

export const homepageContentSchema = z.object({
  heroSubtitle: optionalString(z.string().trim().max(300)),
  why1Title: z.string().trim().min(2, "Title is too short.").max(60),
  why1Body: z.string().trim().min(5, "Add a short description.").max(200),
  why2Title: z.string().trim().min(2, "Title is too short.").max(60),
  why2Body: z.string().trim().min(5, "Add a short description.").max(200),
  why3Title: z.string().trim().min(2, "Title is too short.").max(60),
  why3Body: z.string().trim().min(5, "Add a short description.").max(200),
  why4Title: z.string().trim().min(2, "Title is too short.").max(60),
  why4Body: z.string().trim().min(5, "Add a short description.").max(200),
  ctaTitle: optionalString(z.string().trim().max(120)),
  ctaBodyText: optionalString(z.string().trim().max(300)),
});
export type HomepageContentInput = z.infer<typeof homepageContentSchema>;

export function homepageContentToWhyChooseUsItems(input: HomepageContentInput): WhyChooseUsItem[] {
  return [
    { title: input.why1Title, body: input.why1Body },
    { title: input.why2Title, body: input.why2Body },
    { title: input.why3Title, body: input.why3Body },
    { title: input.why4Title, body: input.why4Body },
  ];
}

export const menuItemSchema = z.object({
  location: z.enum(menuLocationValues),
  label: z.string().trim().min(1, "Label is required.").max(60),
  url: z.string().trim().min(1, "URL is required.").max(300),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;
