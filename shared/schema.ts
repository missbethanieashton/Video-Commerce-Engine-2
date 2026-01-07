import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["creator", "brand", "affiliate"]);
export const videoStatusEnum = pgEnum("video_status", ["draft", "processing", "published", "archived"]);
export const referralStatusEnum = pgEnum("referral_status", ["pending", "sent", "accepted", "declined"]);

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
