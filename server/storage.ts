import { randomUUID } from "crypto";
import {
  type User, type InsertUser,
  type Brand, type InsertBrand,
  type Product, type InsertProduct,
  type Video, type InsertVideo,
  type VideoBrand, type InsertVideoBrand,
  type VideoProduct, type InsertVideoProduct,
  type BrandReferral, type InsertBrandReferral,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type AffiliatePayout, type InsertAffiliatePayout,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Brands
  getBrands(): Promise<Brand[]>;
  getBrand(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, data: Partial<InsertBrand>): Promise<Brand | undefined>;
  
  // Products
  getProducts(brandId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Videos
  getVideos(creatorId?: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;
  getAllPublishedVideos(): Promise<Video[]>;
  
  // Video-Brand associations
  addVideoBrand(videoBrand: InsertVideoBrand): Promise<VideoBrand>;
  getVideoBrands(videoId: string): Promise<VideoBrand[]>;
  
  // Video-Product associations (detected products)
  addVideoProduct(videoProduct: InsertVideoProduct): Promise<VideoProduct>;
  getVideoProducts(videoId: string): Promise<VideoProduct[]>;
  
  // Brand Referrals
  getReferrals(creatorId: string): Promise<BrandReferral[]>;
  getReferral(id: string): Promise<BrandReferral | undefined>;
  createReferral(referral: InsertBrandReferral): Promise<BrandReferral>;
  updateReferralStatus(id: string, status: string): Promise<BrandReferral | undefined>;
  
  // Analytics
  getAnalyticsEvents(videoId?: string): Promise<AnalyticsEvent[]>;
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getVideoStats(creatorId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
  }>;
  
  // Payouts
  getPayouts(userId: string): Promise<AffiliatePayout[]>;
  createPayout(payout: InsertAffiliatePayout): Promise<AffiliatePayout>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private brands: Map<string, Brand> = new Map();
  private products: Map<string, Product> = new Map();
  private videos: Map<string, Video> = new Map();
  private videoBrands: Map<string, VideoBrand> = new Map();
  private videoProducts: Map<string, VideoProduct> = new Map();
  private referrals: Map<string, BrandReferral> = new Map();
  private analyticsEvents: Map<string, AnalyticsEvent> = new Map();
  private payouts: Map<string, AffiliatePayout> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    // Create demo user
    const demoUserId = randomUUID();
    const demoUser: User = {
      id: demoUserId,
      username: "demo_creator",
      password: "demo123",
      email: "demo@example.com",
      displayName: "Demo Creator",
      avatarUrl: null,
      role: "creator",
      affiliateTrackingId: randomUUID(),
      referralCode: `REF_${randomUUID().slice(0, 8).toUpperCase()}`,
      commissionRate: "15.00",
      charityContribution: "0.00",
    };
    this.users.set(demoUserId, demoUser);

    // Create demo brands
    const brandData = [
      { name: "Nike", category: "Fashion", website: "nike.com" },
      { name: "Apple", category: "Electronics", website: "apple.com" },
      { name: "Samsung", category: "Electronics", website: "samsung.com" },
      { name: "Adidas", category: "Fashion", website: "adidas.com" },
      { name: "Sony", category: "Electronics", website: "sony.com" },
      { name: "Sephora", category: "Beauty", website: "sephora.com" },
      { name: "Lululemon", category: "Fitness", website: "lululemon.com" },
      { name: "Dyson", category: "Home", website: "dyson.com" },
    ];

    for (const data of brandData) {
      const brandId = randomUUID();
      const brand: Brand = {
        id: brandId,
        name: data.name,
        category: data.category,
        website: data.website,
        logoUrl: null,
        description: null,
        prContactEmail: null,
        prContactName: null,
        isActive: true,
        ownerId: null,
      };
      this.brands.set(brandId, brand);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = {
      id,
      ...user,
      avatarUrl: user.avatarUrl ?? null,
      affiliateTrackingId: randomUUID(),
      referralCode: `REF_${randomUUID().slice(0, 8).toUpperCase()}`,
      commissionRate: user.commissionRate ?? "15.00",
      charityContribution: user.charityContribution ?? "0.00",
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  // Brands
  async getBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values()).filter((b) => b.isActive);
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const id = randomUUID();
    const newBrand: Brand = {
      id,
      name: brand.name,
      logoUrl: brand.logoUrl ?? null,
      website: brand.website ?? null,
      category: brand.category ?? null,
      description: brand.description ?? null,
      prContactEmail: brand.prContactEmail ?? null,
      prContactName: brand.prContactName ?? null,
      isActive: brand.isActive ?? true,
      ownerId: brand.ownerId ?? null,
    };
    this.brands.set(id, newBrand);
    return newBrand;
  }

  async updateBrand(id: string, data: Partial<InsertBrand>): Promise<Brand | undefined> {
    const brand = this.brands.get(id);
    if (!brand) return undefined;
    const updated = { ...brand, ...data };
    this.brands.set(id, updated);
    return updated;
  }

  // Products
  async getProducts(brandId?: string): Promise<Product[]> {
    const allProducts = Array.from(this.products.values()).filter((p) => p.isActive);
    if (brandId) {
      return allProducts.filter((p) => p.brandId === brandId);
    }
    return allProducts;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      id,
      brandId: product.brandId,
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      imageUrl: product.imageUrl ?? null,
      productUrl: product.productUrl ?? null,
      sku: product.sku ?? null,
      category: product.category ?? null,
      isActive: product.isActive ?? true,
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  // Videos
  async getVideos(creatorId?: string): Promise<Video[]> {
    const allVideos = Array.from(this.videos.values());
    if (creatorId) {
      return allVideos.filter((v) => v.creatorId === creatorId)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    return allVideos.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const newVideo: Video = {
      id,
      creatorId: video.creatorId,
      title: video.title,
      description: video.description ?? null,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl ?? null,
      status: "processing",
      embedCode: null,
      utmCode: randomUUID(),
      totalViews: 0,
      totalClicks: 0,
      totalRevenue: "0.00",
      createdAt: new Date(),
    };
    this.videos.set(id, newVideo);
    return newVideo;
  }

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (!video) return undefined;
    const updated = { ...video, ...data } as Video;
    this.videos.set(id, updated);
    return updated;
  }

  async deleteVideo(id: string): Promise<boolean> {
    return this.videos.delete(id);
  }

  async getAllPublishedVideos(): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter((v) => v.status === "published")
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Video-Brand associations
  async addVideoBrand(videoBrand: InsertVideoBrand): Promise<VideoBrand> {
    const id = randomUUID();
    const newVideoBrand: VideoBrand = { id, ...videoBrand };
    this.videoBrands.set(id, newVideoBrand);
    return newVideoBrand;
  }

  async getVideoBrands(videoId: string): Promise<VideoBrand[]> {
    return Array.from(this.videoBrands.values()).filter((vb) => vb.videoId === videoId);
  }

  // Video-Product associations
  async addVideoProduct(videoProduct: InsertVideoProduct): Promise<VideoProduct> {
    const id = randomUUID();
    const newVideoProduct: VideoProduct = {
      id,
      videoId: videoProduct.videoId,
      productId: videoProduct.productId,
      confidence: videoProduct.confidence ?? null,
      timestamp: videoProduct.timestamp ?? null,
    };
    this.videoProducts.set(id, newVideoProduct);
    return newVideoProduct;
  }

  async getVideoProducts(videoId: string): Promise<VideoProduct[]> {
    return Array.from(this.videoProducts.values()).filter((vp) => vp.videoId === videoId);
  }

  // Brand Referrals
  async getReferrals(creatorId: string): Promise<BrandReferral[]> {
    return Array.from(this.referrals.values())
      .filter((r) => r.creatorId === creatorId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getReferral(id: string): Promise<BrandReferral | undefined> {
    return this.referrals.get(id);
  }

  async createReferral(referral: InsertBrandReferral): Promise<BrandReferral> {
    const id = randomUUID();
    const newReferral: BrandReferral = {
      id,
      creatorId: referral.creatorId,
      brandName: referral.brandName,
      prContactName: referral.prContactName,
      prContactEmail: referral.prContactEmail,
      productCategory: referral.productCategory ?? null,
      message: referral.message ?? null,
      status: "pending",
      signupToken: randomUUID(),
      createdAt: new Date(),
    };
    this.referrals.set(id, newReferral);
    return newReferral;
  }

  async updateReferralStatus(id: string, status: string): Promise<BrandReferral | undefined> {
    const referral = this.referrals.get(id);
    if (!referral) return undefined;
    const updated = { ...referral, status: status as any };
    this.referrals.set(id, updated);
    return updated;
  }

  // Analytics
  async getAnalyticsEvents(videoId?: string): Promise<AnalyticsEvent[]> {
    const allEvents = Array.from(this.analyticsEvents.values());
    if (videoId) {
      return allEvents.filter((e) => e.videoId === videoId);
    }
    return allEvents;
  }

  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const newEvent: AnalyticsEvent = {
      id,
      videoId: event.videoId,
      eventType: event.eventType,
      productId: event.productId ?? null,
      utmSource: event.utmSource ?? null,
      utmMedium: event.utmMedium ?? null,
      utmCampaign: event.utmCampaign ?? null,
      revenue: event.revenue ?? null,
      country: event.country ?? null,
      device: event.device ?? null,
      createdAt: new Date(),
    };
    this.analyticsEvents.set(id, newEvent);
    return newEvent;
  }

  async getVideoStats(creatorId: string): Promise<{
    totalViews: number;
    totalClicks: number;
    totalRevenue: number;
    averageCTR: number;
  }> {
    const creatorVideos = await this.getVideos(creatorId);
    
    let totalViews = 0;
    let totalClicks = 0;
    let totalRevenue = 0;
    
    for (const video of creatorVideos) {
      totalViews += video.totalViews || 0;
      totalClicks += video.totalClicks || 0;
      totalRevenue += Number(video.totalRevenue || 0);
    }
    
    const averageCTR = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    
    return { totalViews, totalClicks, totalRevenue, averageCTR };
  }

  // Payouts
  async getPayouts(userId: string): Promise<AffiliatePayout[]> {
    return Array.from(this.payouts.values())
      .filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createPayout(payout: InsertAffiliatePayout): Promise<AffiliatePayout> {
    const id = randomUUID();
    const newPayout: AffiliatePayout = {
      id,
      userId: payout.userId,
      amount: payout.amount,
      status: payout.status ?? "pending",
      periodStart: payout.periodStart ?? null,
      periodEnd: payout.periodEnd ?? null,
      createdAt: new Date(),
    };
    this.payouts.set(id, newPayout);
    return newPayout;
  }
}

export const storage = new MemStorage();
