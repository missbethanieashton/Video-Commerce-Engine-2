import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["creator", "brand", "affiliate"]);
export const videoStatusEnum = pgEnum("video_status", ["draft", "processing", "published", "archived"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "sent", "accepted", "declined"]);
export const buttonLabelEnum = pgEnum("button_label", [
  "BUY NOW", "PRE ORDER", "RENT", "ENQUIRE", "APPLY NOW", "DONATE", "BOOK NOW", "BID NOW"
]);
export const detectionJobStatusEnum = pgEnum("detection_job_status", [
  "queued", "processing", "completed", "failed"
]);
export const carouselPositionEnum = pgEnum("carousel_position", [
  "bottom", "top", "left", "right", "bottom-left", "bottom-right", "top-left", "top-right"
]);

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").notNull().default("creator"),
  affiliateTrackingId: text("affiliate_tracking_id").default(sql`gen_random_uuid()`),
  referralCode: text("referral_code").default(sql`'REF_' || substr(gen_random_uuid()::text, 1, 8)`),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("15.00"),
  charityContribution: decimal("charity_contribution", { precision: 5, scale: 2 }).default("0.00"),
});

// Brands table
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  category: text("category"),
  description: text("description"),
  prContactEmail: text("pr_contact_email"),
  prContactName: text("pr_contact_name"),
  isActive: boolean("is_active").default(true),
  ownerId: varchar("owner_id").references(() => users.id),
});

// Products table for brand inventory
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  sku: text("sku"),
  category: text("category"),
  isActive: boolean("is_active").default(true),
});

// Videos table
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  status: videoStatusEnum("status").default("draft"),
  embedCode: text("embed_code"),
  utmCode: text("utm_code").default(sql`gen_random_uuid()`),
  totalViews: integer("total_views").default(0),
  totalClicks: integer("total_clicks").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Video-Brand associations (many-to-many)
export const videoBrands = pgTable("video_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  brandId: varchar("brand_id").notNull().references(() => brands.id),
});

// Detected products in videos
export const videoProducts = pgTable("video_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  timestamp: decimal("timestamp", { precision: 10, scale: 2 }),
});

// Brand referrals from creators
export const brandReferrals = pgTable("brand_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  brandName: text("brand_name").notNull(),
  prContactName: text("pr_contact_name").notNull(),
  prContactEmail: text("pr_contact_email").notNull(),
  productCategory: text("product_category"),
  message: text("message"),
  status: referralStatusEnum("status").default("pending"),
  signupToken: text("signup_token").default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Analytics events
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  eventType: text("event_type").notNull(), // view, click, purchase
  productId: varchar("product_id").references(() => products.id),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }),
  country: text("country"),
  device: text("device"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Affiliate payouts
export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Brand Kits - stores brand styling defaults from PDF extraction or manual entry
export const brandKits = pgTable("brand_kits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sourcePdfUrl: text("source_pdf_url"),
  extractedFonts: text("extracted_fonts"), // JSON array of font names
  extractedColors: text("extracted_colors"), // JSON array of {name, cmyk, hex, rgb}
  manualFonts: text("manual_fonts"), // JSON array of manually added fonts
  manualColors: text("manual_colors"), // JSON array of manually added colors
  defaultButtonFont: text("default_button_font"),
  defaultButtonColor: text("default_button_color"), // hex color
  defaultButtonTextColor: text("default_button_text_color"), // hex color
  defaultCornerRadius: integer("default_corner_radius").default(8),
  defaultBackgroundOpacity: integer("default_background_opacity").default(80),
  defaultShowThumbnail: boolean("default_show_thumbnail").default(true),
  defaultShowButton: boolean("default_show_button").default(true),
  defaultShowPrice: boolean("default_show_price").default(true),
  defaultShowTitle: boolean("default_show_title").default(true),
  defaultButtonLabel: buttonLabelEnum("default_button_label").default("BUY NOW"),
  defaultPosition: carouselPositionEnum("default_position").default("bottom"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Video Carousel Overrides - per-video customizations
export const videoCarouselOverrides = pgTable("video_carousel_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  position: carouselPositionEnum("position"),
  positionOffsetX: integer("position_offset_x").default(0),
  positionOffsetY: integer("position_offset_y").default(0),
  delayUntilEnd: boolean("delay_until_end").default(false),
  cornerRadius: integer("corner_radius"),
  backgroundOpacity: integer("background_opacity"),
  showThumbnail: boolean("show_thumbnail"),
  showButton: boolean("show_button"),
  showPrice: boolean("show_price"),
  showTitle: boolean("show_title"),
  buttonLabel: buttonLabelEnum("button_label"),
  buttonFont: text("button_font"),
  buttonColor: text("button_color"),
  buttonTextColor: text("button_text_color"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Video Detection Jobs - tracks AI product detection processing
export const videoDetectionJobs = pgTable("video_detection_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  selectedBrandIds: text("selected_brand_ids"), // JSON array of brand IDs to scan
  status: detectionJobStatusEnum("status").default("queued"),
  frameSamplingRate: integer("frame_sampling_rate").default(1), // frames per second
  totalFrames: integer("total_frames").default(0),
  processedFrames: integer("processed_frames").default(0),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Video Detection Results - individual product detections with timestamps
export const videoDetectionResults = pgTable("video_detection_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => videoDetectionJobs.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  brandId: varchar("brand_id").notNull().references(() => brands.id),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  frameTimestamp: decimal("frame_timestamp", { precision: 10, scale: 2 }).notNull(), // seconds into video
  startTime: decimal("start_time", { precision: 10, scale: 2 }), // when to show product
  endTime: decimal("end_time", { precision: 10, scale: 2 }), // when to hide product
  boundingBox: text("bounding_box"), // JSON {x, y, width, height}
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  videos: many(videos),
  referrals: many(brandReferrals),
  payouts: many(affiliatePayouts),
  ownedBrand: one(brands, { fields: [users.id], references: [brands.ownerId] }),
}));

export const brandsRelations = relations(brands, ({ many, one }) => ({
  products: many(products),
  videoBrands: many(videoBrands),
  owner: one(users, { fields: [brands.ownerId], references: [users.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  videoProducts: many(videoProducts),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  creator: one(users, { fields: [videos.creatorId], references: [users.id] }),
  videoBrands: many(videoBrands),
  videoProducts: many(videoProducts),
  analyticsEvents: many(analyticsEvents),
}));

export const videoBrandsRelations = relations(videoBrands, ({ one }) => ({
  video: one(videos, { fields: [videoBrands.videoId], references: [videos.id] }),
  brand: one(brands, { fields: [videoBrands.brandId], references: [brands.id] }),
}));

export const videoProductsRelations = relations(videoProducts, ({ one }) => ({
  video: one(videos, { fields: [videoProducts.videoId], references: [videos.id] }),
  product: one(products, { fields: [videoProducts.productId], references: [products.id] }),
}));

export const brandReferralsRelations = relations(brandReferrals, ({ one }) => ({
  creator: one(users, { fields: [brandReferrals.creatorId], references: [users.id] }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  video: one(videos, { fields: [analyticsEvents.videoId], references: [videos.id] }),
  product: one(products, { fields: [analyticsEvents.productId], references: [products.id] }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayouts, ({ one }) => ({
  user: one(users, { fields: [affiliatePayouts.userId], references: [users.id] }),
}));

export const brandKitsRelations = relations(brandKits, ({ one }) => ({
  user: one(users, { fields: [brandKits.userId], references: [users.id] }),
}));

export const videoCarouselOverridesRelations = relations(videoCarouselOverrides, ({ one }) => ({
  video: one(videos, { fields: [videoCarouselOverrides.videoId], references: [videos.id] }),
}));

export const videoDetectionJobsRelations = relations(videoDetectionJobs, ({ one, many }) => ({
  video: one(videos, { fields: [videoDetectionJobs.videoId], references: [videos.id] }),
  results: many(videoDetectionResults),
}));

export const videoDetectionResultsRelations = relations(videoDetectionResults, ({ one }) => ({
  job: one(videoDetectionJobs, { fields: [videoDetectionResults.jobId], references: [videoDetectionJobs.id] }),
  video: one(videos, { fields: [videoDetectionResults.videoId], references: [videos.id] }),
  product: one(products, { fields: [videoDetectionResults.productId], references: [products.id] }),
  brand: one(brands, { fields: [videoDetectionResults.brandId], references: [brands.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, affiliateTrackingId: true, referralCode: true });
export const insertBrandSchema = createInsertSchema(brands).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, embedCode: true, utmCode: true, totalViews: true, totalClicks: true, totalRevenue: true, createdAt: true });
export const insertVideoBrandSchema = createInsertSchema(videoBrands).omit({ id: true });
export const insertVideoProductSchema = createInsertSchema(videoProducts).omit({ id: true });
export const insertBrandReferralSchema = createInsertSchema(brandReferrals).omit({ id: true, status: true, signupToken: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export const insertAffiliatePayoutSchema = createInsertSchema(affiliatePayouts).omit({ id: true, createdAt: true });
export const insertBrandKitSchema = createInsertSchema(brandKits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVideoCarouselOverrideSchema = createInsertSchema(videoCarouselOverrides).omit({ id: true, createdAt: true });
export const insertVideoDetectionJobSchema = createInsertSchema(videoDetectionJobs).omit({ id: true, status: true, totalFrames: true, processedFrames: true, error: true, startedAt: true, completedAt: true, createdAt: true });
export const insertVideoDetectionResultSchema = createInsertSchema(videoDetectionResults).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type Brand = typeof brands.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideoBrand = z.infer<typeof insertVideoBrandSchema>;
export type VideoBrand = typeof videoBrands.$inferSelect;
export type InsertVideoProduct = z.infer<typeof insertVideoProductSchema>;
export type VideoProduct = typeof videoProducts.$inferSelect;
export type InsertBrandReferral = z.infer<typeof insertBrandReferralSchema>;
export type BrandReferral = typeof brandReferrals.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAffiliatePayout = z.infer<typeof insertAffiliatePayoutSchema>;
export type AffiliatePayout = typeof affiliatePayouts.$inferSelect;
export type InsertBrandKit = z.infer<typeof insertBrandKitSchema>;
export type BrandKit = typeof brandKits.$inferSelect;
export type InsertVideoCarouselOverride = z.infer<typeof insertVideoCarouselOverrideSchema>;
export type VideoCarouselOverride = typeof videoCarouselOverrides.$inferSelect;
export type InsertVideoDetectionJob = z.infer<typeof insertVideoDetectionJobSchema>;
export type VideoDetectionJob = typeof videoDetectionJobs.$inferSelect;
export type InsertVideoDetectionResult = z.infer<typeof insertVideoDetectionResultSchema>;
export type VideoDetectionResult = typeof videoDetectionResults.$inferSelect;

// Button label options for carousel
export const BUTTON_LABEL_OPTIONS = [
  "BUY NOW", "PRE ORDER", "RENT", "ENQUIRE", "APPLY NOW", "DONATE", "BOOK NOW", "BID NOW"
] as const;

// Carousel position options
export const CAROUSEL_POSITION_OPTIONS = [
  "bottom", "top", "left", "right", "bottom-left", "bottom-right", "top-left", "top-right"
] as const;
