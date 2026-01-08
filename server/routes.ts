import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertVideoSchema, 
  insertBrandReferralSchema, 
  insertBrandSchema, 
  insertProductSchema, 
  insertAnalyticsEventSchema, 
  insertCreatorInvitationSchema,
  insertAffiliateInvitationSchema,
  insertCampaignAffiliateSchema,
  insertGlobalVideoLibrarySchema,
  insertVideoLicensePurchaseSchema,
  insertVideoPublishRecordSchema,
  insertSubscriberIntakeSchema,
  insertUserProfileSchema,
  insertCreatorRewardSchema,
  VIDEO_CATEGORY_OPTIONS,
} from "@shared/schema";
import { z } from "zod";
import { setupPdfAnalysisRoutes } from "./replit_integrations/pdf_analysis";
import { registerDetectionRoutes } from "./replit_integrations/detection/routes";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== AI/PDF ANALYSIS ROUTES ====================
  setupPdfAnalysisRoutes(app);

  // ==================== AI DETECTION ROUTES ====================
  registerDetectionRoutes(app, storage);

  // ==================== USER ROUTES ====================
  
  // Get current user (demo user for now)
  app.get("/api/users/me", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ==================== BRAND ROUTES ====================
  
  // Get all brands
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ error: "Failed to get brands" });
    }
  });

  // Get single brand
  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brand = await storage.getBrand(req.params.id);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      res.status(500).json({ error: "Failed to get brand" });
    }
  });

  // Create brand
  app.post("/api/brands", async (req, res) => {
    try {
      const data = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(data);
      res.status(201).json(brand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  // ==================== PRODUCT ROUTES ====================
  
  // Get products (optionally by brand)
  app.get("/api/products", async (req, res) => {
    try {
      const brandId = req.query.brandId as string | undefined;
      const products = await storage.getProducts(brandId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  // Create product
  app.post("/api/products", async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(data);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // ==================== VIDEO ROUTES ====================
  
  // Get videos for current user
  app.get("/api/videos", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const videos = await storage.getVideos(user.id);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to get videos" });
    }
  });

  // Get all published videos (global library)
  app.get("/api/videos/library", async (req, res) => {
    try {
      const videos = await storage.getAllPublishedVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to get library videos" });
    }
  });

  // Get single video
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to get video" });
    }
  });

  // Create video
  app.post("/api/videos", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { brandIds, ...videoData } = req.body;
      const data = insertVideoSchema.parse({
        ...videoData,
        creatorId: user.id,
      });
      
      const video = await storage.createVideo(data);

      // Add brand associations
      if (brandIds && Array.isArray(brandIds)) {
        for (const brandId of brandIds) {
          await storage.addVideoBrand({
            videoId: video.id,
            brandId,
          });
        }
      }

      // Update video status to published after a delay (simulating processing)
      setTimeout(async () => {
        await storage.updateVideo(video.id, { status: "published" } as any);
      }, 3000);

      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  // Update video
  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.updateVideo(req.params.id, req.body);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to update video" });
    }
  });

  // Delete video
  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVideo(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // ==================== REFERRAL ROUTES ====================
  
  // Get referrals for current user
  app.get("/api/referrals", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const referrals = await storage.getReferrals(user.id);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  // Create referral
  app.post("/api/referrals", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const data = insertBrandReferralSchema.parse({
        ...req.body,
        creatorId: user.id,
      });
      
      const referral = await storage.createReferral(data);

      // Simulate sending email (update status to "sent" after a delay)
      setTimeout(async () => {
        await storage.updateReferralStatus(referral.id, "sent");
      }, 2000);

      res.status(201).json(referral);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  // ==================== ANALYTICS ROUTES ====================
  
  // Get stats overview
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const stats = await storage.getVideoStats(user.id);
      const charityContribution = Number(user.charityContribution || 0);
      
      res.json({
        ...stats,
        charityContribution,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get detailed analytics
  app.get("/api/analytics/detailed", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const stats = await storage.getVideoStats(user.id);
      
      res.json({
        ...stats,
        topCountries: [
          { country: "United States", views: 5420 },
          { country: "United Kingdom", views: 2180 },
          { country: "Canada", views: 1540 },
          { country: "Australia", views: 890 },
          { country: "Germany", views: 670 },
        ],
        deviceBreakdown: [
          { device: "Mobile", percentage: 62 },
          { device: "Desktop", percentage: 31 },
          { device: "Tablet", percentage: 7 },
        ],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get detailed analytics" });
    }
  });

  // Track analytics event
  app.post("/api/analytics/events", async (req, res) => {
    try {
      const data = insertAnalyticsEventSchema.parse(req.body);
      const event = await storage.createAnalyticsEvent(data);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Get affiliate publishers analytics with sorting
  app.get("/api/analytics/affiliate-publishers", async (req, res) => {
    try {
      const { sortBy = "earnings", order = "desc" } = req.query;
      const validSortFields = ["earnings", "clicks", "conversions", "revenue", "conversionRate"];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : "earnings";
      const sortOrder = order === "asc" ? "asc" : "desc";
      
      // Get all campaign affiliates with user info
      const affiliatePublishers = await storage.getAffiliatePublishersAnalytics();
      
      // Sort based on the requested field
      const sorted = [...affiliatePublishers].sort((a, b) => {
        let aVal: number, bVal: number;
        switch (sortField) {
          case "clicks":
            aVal = a.totalClicks;
            bVal = b.totalClicks;
            break;
          case "conversions":
            aVal = a.totalConversions;
            bVal = b.totalConversions;
            break;
          case "revenue":
            aVal = parseFloat(a.totalRevenue);
            bVal = parseFloat(b.totalRevenue);
            break;
          case "conversionRate":
            aVal = a.totalClicks > 0 ? (a.totalConversions / a.totalClicks) * 100 : 0;
            bVal = b.totalClicks > 0 ? (b.totalConversions / b.totalClicks) * 100 : 0;
            break;
          case "earnings":
          default:
            aVal = parseFloat(a.totalEarnings);
            bVal = parseFloat(b.totalEarnings);
            break;
        }
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
      
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ error: "Failed to get affiliate publishers analytics" });
    }
  });

  // ==================== SUBSCRIBER INTAKE ROUTES ====================
  
  // Create subscriber intake (landing page signup)
  app.post("/api/subscriber-intake", async (req, res) => {
    try {
      const data = insertSubscriberIntakeSchema.parse(req.body);
      
      // Check if email already exists
      const existing = await storage.getSubscriberIntakeByEmail(data.email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }
      
      const intake = await storage.createSubscriberIntake(data);
      res.status(201).json(intake);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create subscriber" });
    }
  });

  // Get all subscriber intakes (admin)
  app.get("/api/subscriber-intakes", async (req, res) => {
    try {
      const intakes = await storage.getSubscriberIntakes();
      res.json(intakes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subscribers" });
    }
  });

  // ==================== UPLOAD ROUTES ====================
  
  // Get signed upload URL
  app.post("/api/upload/url", async (req, res) => {
    try {
      const { fileName, fileType, fileSize } = req.body;
      
      // Generate a unique object path
      const timestamp = Date.now();
      const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const objectPath = `videos/${timestamp}_${safeName}`;
      
      // In a real implementation, this would use the object storage integration
      // For now, return a mock signed URL
      const uploadUrl = `/api/upload/direct?path=${encodeURIComponent(objectPath)}`;
      
      res.json({
        uploadUrl,
        objectPath,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Complete upload
  app.post("/api/upload/complete", async (req, res) => {
    try {
      const { objectPath } = req.body;
      
      // In a real implementation, this would verify the upload and return the public URL
      const objectUrl = `/api/storage/${objectPath}`;
      
      res.json({
        objectUrl,
        objectPath,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete upload" });
    }
  });

  // ==================== BRAND DASHBOARD ROUTES ====================

  // Get brand stats
  app.get("/api/brands/stats", async (req, res) => {
    try {
      // Return demo stats for brand dashboard
      res.json({
        totalViews: 45230,
        totalClicks: 3420,
        totalConversions: 156,
        totalRevenue: 12450,
        activeCreators: 23,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get brand stats" });
    }
  });

  // Invite creator (brand to creator invitation)
  app.post("/api/brands/invite-creator", async (req, res) => {
    try {
      const { creatorName, creatorEmail, contentCategory, message, brandId } = req.body;
      
      if (!creatorName || !creatorEmail) {
        return res.status(400).json({ error: "Creator name and email are required" });
      }

      // Get a demo brand ID if not provided
      const brands = await storage.getBrands();
      const useBrandId = brandId || brands[0]?.id;
      
      if (!useBrandId) {
        return res.status(400).json({ error: "No brand available" });
      }

      const invitation = await storage.createCreatorInvitation({
        brandId: useBrandId,
        creatorName,
        email: creatorEmail,
        category: contentCategory || null,
        message: message || null,
      });

      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to send creator invitation" });
    }
  });

  // Bulk invite creators (CSV import)
  app.post("/api/brands/invite-creators/bulk", async (req, res) => {
    try {
      const { invitations, brandId } = req.body;
      
      if (!Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({ error: "Invitations array is required" });
      }

      if (invitations.length > 200) {
        return res.status(400).json({ error: "Maximum 200 invitations per bulk upload" });
      }

      // Get a demo brand ID if not provided
      const brands = await storage.getBrands();
      const useBrandId = brandId || brands[0]?.id;
      
      if (!useBrandId) {
        return res.status(400).json({ error: "No brand available" });
      }

      // Validate each invitation using the shared insert schema
      const validInvitations: Array<{ brandId: string; creatorName: string; email: string; category: string | null; message: string | null }> = [];
      const errors: Array<{ index: number; error: string }> = [];

      // Create a schema for validating invitation rows (matches insertCreatorInvitationSchema)
      const invitationRowSchema = insertCreatorInvitationSchema.omit({ brandId: true });

      invitations.forEach((inv: unknown, index: number) => {
        const parsed = invitationRowSchema.safeParse(inv);
        if (!parsed.success) {
          const errorMessage = parsed.error.errors.map(e => e.message).join(", ");
          errors.push({ index, error: errorMessage });
          return;
        }

        validInvitations.push({
          brandId: useBrandId,
          creatorName: parsed.data.creatorName,
          email: parsed.data.email,
          category: parsed.data.category || null,
          message: parsed.data.message || null,
        });
      });

      const created = await storage.createCreatorInvitationsBulk(validInvitations);

      res.status(201).json({
        success: true,
        created: created.length,
        errors: errors.length > 0 ? errors : undefined,
        invitations: created,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process bulk invitations" });
    }
  });

  // Get creator invitations sent by brand
  app.get("/api/brands/creator-invites", async (req, res) => {
    try {
      // Get a demo brand ID
      const brands = await storage.getBrands();
      const brandId = req.query.brandId as string || brands[0]?.id;
      
      if (!brandId) {
        return res.json([]);
      }

      const invitations = await storage.getCreatorInvitations(brandId);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get creator invitations" });
    }
  });

  // Update invitation status
  app.patch("/api/brands/creator-invites/:id", async (req, res) => {
    try {
      const { status } = req.body;
      if (!["pending", "sent", "accepted", "declined"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateCreatorInvitationStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invitation" });
    }
  });

  // ==================== BRAND KIT ROUTES ====================

  // Get brand kit for current user
  app.get("/api/brand-kit", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const brandKit = await storage.getBrandKit(user.id);
      res.json(brandKit || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get brand kit" });
    }
  });

  // Create or update brand kit
  app.post("/api/brand-kit", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingKit = await storage.getBrandKit(user.id);
      
      if (existingKit) {
        const updated = await storage.updateBrandKit(existingKit.id, req.body);
        return res.json(updated);
      }

      const newKit = await storage.createBrandKit({
        userId: user.id,
        ...req.body,
      });
      res.status(201).json(newKit);
    } catch (error) {
      res.status(500).json({ error: "Failed to save brand kit" });
    }
  });

  // ==================== CAROUSEL OVERRIDE ROUTES ====================

  // Get carousel override for a video
  app.get("/api/videos/:id/carousel", async (req, res) => {
    try {
      const override = await storage.getVideoCarouselOverride(req.params.id);
      res.json(override || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get carousel settings" });
    }
  });

  // Create or update carousel override for a video
  app.post("/api/videos/:id/carousel", async (req, res) => {
    try {
      const existingOverride = await storage.getVideoCarouselOverride(req.params.id);
      
      if (existingOverride) {
        const updated = await storage.updateVideoCarouselOverride(req.params.id, req.body);
        return res.json(updated);
      }

      const newOverride = await storage.createVideoCarouselOverride({
        videoId: req.params.id,
        ...req.body,
      });
      res.status(201).json(newOverride);
    } catch (error) {
      res.status(500).json({ error: "Failed to save carousel settings" });
    }
  });

  // ==================== CAMPAIGN ROUTES ====================

  // Get all campaigns for a brand
  app.get("/api/campaigns", async (req, res) => {
    try {
      const { brandId } = req.query;
      if (!brandId || typeof brandId !== "string") {
        return res.status(400).json({ error: "Brand ID required" });
      }
      const campaigns = await storage.getCampaigns(brandId);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaigns" });
    }
  });

  // Get campaign stats for a brand
  app.get("/api/campaigns/stats", async (req, res) => {
    try {
      const { brandId } = req.query;
      if (!brandId || typeof brandId !== "string") {
        return res.status(400).json({ error: "Brand ID required" });
      }
      const stats = await storage.getCampaignStats(brandId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign stats" });
    }
  });

  // Get a single campaign
  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign" });
    }
  });

  // Create a new campaign
  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaign = await storage.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // Update a campaign
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      if (!campaign) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // Delete a campaign
  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCampaign(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete campaign" });
    }
  });

  // ==================== DETECTION JOB ROUTES ====================

  // Get detection job for a video
  app.get("/api/videos/:id/detections", async (req, res) => {
    try {
      const job = await storage.getDetectionJobByVideoId(req.params.id);
      if (!job) {
        return res.json({ status: "none", results: [] });
      }
      
      const results = await storage.getDetectionResults(job.id);
      res.json({ ...job, results });
    } catch (error) {
      res.status(500).json({ error: "Failed to get detection status" });
    }
  });

  // Create detection job for a video
  app.post("/api/videos/:id/detections", async (req, res) => {
    try {
      const { brandIds } = req.body;
      
      const job = await storage.createDetectionJob({
        videoId: req.params.id,
        selectedBrandIds: JSON.stringify(brandIds || []),
        frameSamplingRate: 1,
      });

      // Simulate processing (in real implementation, this would be async worker)
      setTimeout(async () => {
        await storage.updateDetectionJob(job.id, { 
          status: "processing",
          startedAt: new Date(),
        });
        
        // Simulate completion after 5 seconds
        setTimeout(async () => {
          await storage.updateDetectionJob(job.id, { 
            status: "completed",
            completedAt: new Date(),
            totalFrames: 30,
            processedFrames: 30,
          });
        }, 5000);
      }, 1000);

      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to start detection" });
    }
  });

  // ==================== VIDEO PUBLISH ROUTES ====================

  // Publish a video and generate embed code
  app.post("/api/videos/:id/publish", async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const { widgetConfig } = req.body;
      
      // Generate embed code with UTM tracking
      const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
      const embedCode = generateEmbedCode(video.id, baseUrl, widgetConfig);

      // Create publish record
      const publishRecord = await storage.createVideoPublishRecord({
        videoId: video.id,
        embedCode,
        widgetConfig: widgetConfig ? JSON.stringify(widgetConfig) : null,
      });

      // Update video status
      await storage.updateVideo(video.id, { status: "published" });

      res.json({
        embedCode: publishRecord.embedCode,
        embedCodeMinified: publishRecord.embedCodeMinified,
        utmCode: publishRecord.baseUtmCode,
        publishedAt: publishRecord.publishedAt,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish video" });
    }
  });

  // Get published video embed info
  app.get("/api/videos/:id/publish", async (req, res) => {
    try {
      const publishRecord = await storage.getVideoPublishRecord(req.params.id);
      if (!publishRecord) {
        return res.json({ published: false });
      }
      res.json({ published: true, ...publishRecord });
    } catch (error) {
      res.status(500).json({ error: "Failed to get publish info" });
    }
  });

  // ==================== AFFILIATE INVITATION ROUTES ====================

  // Get affiliate invitations sent by current user
  app.get("/api/affiliates/invitations", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const invitations = await storage.getAffiliateInvitations(user.id);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get affiliate invitations" });
    }
  });

  // Send affiliate invitation
  app.post("/api/affiliates/invite", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const validatedData = insertAffiliateInvitationSchema.omit({ inviterId: true }).parse(req.body);
      const invitation = await storage.createAffiliateInvitation({
        ...validatedData,
        inviterId: user.id,
      });
      res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create affiliate invitation" });
    }
  });

  // Bulk invite affiliates via CSV
  app.post("/api/affiliates/invite/bulk", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { invitations } = req.body;
      if (!Array.isArray(invitations) || invitations.length === 0) {
        return res.status(400).json({ error: "No invitations provided" });
      }

      if (invitations.length > 200) {
        return res.status(400).json({ error: "Maximum 200 invitations per batch" });
      }

      const validatedInvitations = invitations.map((inv: any) => ({
        inviterId: user.id,
        affiliateName: inv.affiliateName,
        email: inv.email,
        commissionRate: inv.commissionRate || "10.00",
        message: inv.message,
      }));

      const created = await storage.createAffiliateInvitationsBulk(validatedInvitations);
      res.status(201).json({ created: created.length, invitations: created });
    } catch (error) {
      res.status(500).json({ error: "Failed to bulk create affiliate invitations" });
    }
  });

  // Accept affiliate invitation (for affiliate login)
  app.post("/api/affiliates/accept/:token", async (req, res) => {
    try {
      const invitation = await storage.getAffiliateInvitationByToken(req.params.token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "pending" && invitation.status !== "sent") {
        return res.status(400).json({ error: "Invitation already processed" });
      }

      // Create affiliate user account
      const affiliateUser = await storage.createUser({
        username: `affiliate_${invitation.email.split("@")[0]}`,
        password: "affiliate123", // In production, generate secure password or use OAuth
        email: invitation.email,
        displayName: invitation.affiliateName,
        role: "affiliate",
      });

      await storage.updateAffiliateInvitationStatus(invitation.id, "accepted", affiliateUser.id);

      res.json({ success: true, user: affiliateUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // ==================== CAMPAIGN AFFILIATES ROUTES ====================

  // Get affiliates for a video campaign
  app.get("/api/videos/:id/affiliates", async (req, res) => {
    try {
      const affiliates = await storage.getCampaignAffiliates(req.params.id);
      res.json(affiliates);
    } catch (error) {
      res.status(500).json({ error: "Failed to get campaign affiliates" });
    }
  });

  // Add affiliate to video campaign
  app.post("/api/videos/:id/affiliates", async (req, res) => {
    try {
      const validatedData = insertCampaignAffiliateSchema.parse({
        videoId: req.params.id,
        ...req.body,
      });
      
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const assignment = await storage.createCampaignAffiliate(validatedData);

      // Generate personalized embed code for affiliate
      const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
      const embedCode = generateAffiliateEmbedCode(video.id, assignment.utmCode!, baseUrl);
      await storage.updateCampaignAffiliateStats(assignment.id, { embedCode });

      res.status(201).json({ ...assignment, embedCode });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to add affiliate to campaign" });
    }
  });

  // Get campaigns for affiliate user
  app.get("/api/affiliates/campaigns", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const campaigns = await storage.getCampaignAffiliatesByUser(user.id);
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: "Failed to get affiliate campaigns" });
    }
  });

  // ==================== GLOBAL VIDEO LIBRARY ROUTES ====================

  // Get all published listings in global library
  app.get("/api/library", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const listings = await storage.getGlobalVideoListings(category);
      
      // Enrich with video details
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          const video = await storage.getVideo(listing.videoId);
          const creator = await storage.getUser(listing.creatorId);
          return {
            ...listing,
            video,
            creator: creator ? { displayName: creator.displayName, avatarUrl: creator.avatarUrl } : null,
          };
        })
      );
      
      res.json(enrichedListings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get library listings" });
    }
  });

  // Add video to global library (creator pays listing fee)
  app.post("/api/library/list", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const validatedData = insertGlobalVideoLibrarySchema.parse({
        ...req.body,
        creatorId: user.id,
      });

      const video = await storage.getVideo(validatedData.videoId);
      if (!video || video.creatorId !== user.id) {
        return res.status(404).json({ error: "Video not found or not owned by user" });
      }

      // Check if already listed
      const existingListing = await storage.getGlobalVideoListingByVideo(validatedData.videoId);
      if (existingListing) {
        return res.status(400).json({ error: "Video already listed in library" });
      }

      const listing = await storage.createGlobalVideoListing(validatedData);

      // Create Stripe payment intent for listing fee
      const paymentIntent = await stripeService.createPaymentIntent(
        45.00,
        "eur",
        { listingId: listing.id, userId: user.id, type: "library_listing" }
      );

      await storage.updateGlobalVideoListing(listing.id, {
        stripePaymentIntentId: paymentIntent.id,
        publishStatus: "pending_payment",
      });

      res.status(201).json({
        listing,
        paymentIntent: {
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create library listing:", error);
      res.status(500).json({ error: "Failed to create library listing" });
    }
  });

  // Confirm library listing payment
  app.post("/api/library/:id/confirm-payment", async (req, res) => {
    try {
      const listing = await storage.getGlobalVideoListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      await storage.updateGlobalVideoListing(listing.id, {
        publishStatus: "published",
        listedAt: new Date(),
      });

      res.json({ success: true, listing: await storage.getGlobalVideoListing(listing.id) });
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // ==================== VIDEO LICENSE PURCHASE ROUTES ====================

  // Purchase license for a video from global library
  app.post("/api/library/:id/purchase", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const listing = await storage.getGlobalVideoListing(req.params.id);
      if (!listing || listing.publishStatus !== "published") {
        return res.status(404).json({ error: "Listing not found or not available" });
      }

      const { commissionRate } = req.body;

      const purchase = await storage.createVideoLicensePurchase({
        globalListingId: listing.id,
        affiliateId: user.id,
        licenseFee: listing.licenseFee,
        commissionRate: commissionRate || "10.00",
      });

      // Create Stripe payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        Number(listing.licenseFee),
        "eur",
        { purchaseId: purchase.id, userId: user.id, type: "license_purchase" }
      );

      res.status(201).json({
        purchase,
        paymentIntent: {
          clientSecret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
        },
      });
    } catch (error) {
      console.error("Failed to create license purchase:", error);
      res.status(500).json({ error: "Failed to create license purchase" });
    }
  });

  // Confirm license purchase payment
  app.post("/api/purchases/:id/confirm-payment", async (req, res) => {
    try {
      const purchase = await storage.getVideoLicensePurchase(req.params.id);
      if (!purchase) {
        return res.status(404).json({ error: "Purchase not found" });
      }

      await storage.updateVideoLicensePurchaseStatus(purchase.id, "paid", req.body.paymentIntentId);

      // Get listing and video for embed code generation
      const listing = await storage.getGlobalVideoListing(purchase.globalListingId);
      if (listing) {
        const baseUrl = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
        const embedCode = generateAffiliateEmbedCode(listing.videoId, purchase.utmCode!, baseUrl);
        
        // Update purchase with embed code
        const updatedPurchase = await storage.getVideoLicensePurchase(purchase.id);
        if (updatedPurchase) {
          // Also increment license count
          await storage.updateGlobalVideoListing(listing.id, {
            totalLicenses: (listing.totalLicenses || 0) + 1,
          });
        }
        
        res.json({ 
          success: true, 
          purchase: updatedPurchase,
          embedCode,
          utmCode: purchase.utmCode,
        });
      } else {
        res.json({ success: true, purchase: await storage.getVideoLicensePurchase(purchase.id) });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Get affiliate's purchased licenses
  app.get("/api/affiliates/licenses", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const purchases = await storage.getVideoLicensePurchases(user.id);
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ error: "Failed to get licenses" });
    }
  });

  // ==================== STRIPE ROUTES ====================

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Create Stripe Connect account for affiliate payouts
  app.post("/api/stripe/connect/create", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (user.stripeConnectAccountId) {
        return res.json({ accountId: user.stripeConnectAccountId });
      }

      const account = await stripeService.createConnectAccount(user.email, user.id);
      await storage.updateUser(user.id, { stripeConnectAccountId: account.id } as any);

      res.json({ accountId: account.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to create connect account" });
    }
  });

  // Create onboarding link for Stripe Connect
  app.post("/api/stripe/connect/onboarding", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user || !user.stripeConnectAccountId) {
        return res.status(400).json({ error: "No connect account found" });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
      const accountLink = await stripeService.createConnectAccountLink(
        user.stripeConnectAccountId,
        `${baseUrl}/affiliate/settings`,
        `${baseUrl}/affiliate/settings?onboarded=true`
      );

      res.json({ url: accountLink.url });
    } catch (error) {
      res.status(500).json({ error: "Failed to create onboarding link" });
    }
  });

  // Get Stripe Connect account status
  app.get("/api/stripe/connect/status", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!user.stripeConnectAccountId) {
        return res.json({ connected: false });
      }

      const account = await stripeService.getConnectAccount(user.stripeConnectAccountId);
      const isOnboarded = account.charges_enabled && account.payouts_enabled;

      if (isOnboarded && !user.stripeConnectOnboarded) {
        await storage.updateUser(user.id, { stripeConnectOnboarded: true } as any);
      }

      res.json({
        connected: true,
        onboarded: isOnboarded,
        accountId: user.stripeConnectAccountId,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get connect status" });
    }
  });

  // ==================== USER PROFILE ROUTES ====================

  // Get user profile
  app.get("/api/profile", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const profile = await storage.getUserProfile(user.id);
      res.json(profile || { userId: user.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Update user profile
  app.put("/api/profile", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const validated = insertUserProfileSchema.partial().parse(req.body);
      const profile = await storage.updateUserProfile(user.id, validated);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ==================== CREATOR REWARDS ROUTES ====================

  // Get creator rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const rewards = await storage.getCreatorRewards(user.id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ error: "Failed to get rewards" });
    }
  });

  // Get creator rewards summary
  app.get("/api/rewards/summary", async (req, res) => {
    try {
      const user = await storage.getUserByUsername("demo_creator");
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const summary = await storage.getCreatorRewardsSummary(user.id);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to get rewards summary" });
    }
  });

  // Redeem reward for video listing
  app.post("/api/rewards/:id/redeem", async (req, res) => {
    try {
      const { listingId } = req.body;
      if (!listingId) {
        return res.status(400).json({ error: "Listing ID required" });
      }
      const reward = await storage.redeemCreatorReward(req.params.id, listingId);
      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      res.status(500).json({ error: "Failed to redeem reward" });
    }
  });

  // ==================== VIDEO CATEGORIES ROUTES ====================

  // Get available video categories
  app.get("/api/video-categories", async (req, res) => {
    res.json(VIDEO_CATEGORY_OPTIONS);
  });

  return httpServer;
}

// Helper function to generate embed code
function generateEmbedCode(videoId: string, baseUrl: string, config?: any): string {
  const widgetUrl = `https://${baseUrl}/embed/${videoId}`;
  return `<!-- Video Commerce Widget -->
<div id="vc-widget-${videoId}" data-video-id="${videoId}"></div>
<script src="${widgetUrl}/widget.js" async></script>
<script>
  window.vcWidgetConfig = ${JSON.stringify(config || {})};
</script>`;
}

// Helper function to generate affiliate-specific embed code with UTM
function generateAffiliateEmbedCode(videoId: string, utmCode: string, baseUrl: string): string {
  const widgetUrl = `https://${baseUrl}/embed/${videoId}`;
  return `<!-- Video Commerce Widget - Affiliate -->
<div id="vc-widget-${videoId}" data-video-id="${videoId}" data-utm="${utmCode}"></div>
<script src="${widgetUrl}/widget.js?utm=${utmCode}" async></script>`;
}
