import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertBrandReferralSchema, insertBrandSchema, insertProductSchema, insertAnalyticsEventSchema, insertCreatorInvitationSchema } from "@shared/schema";
import { z } from "zod";
import { setupPdfAnalysisRoutes } from "./replit_integrations/pdf_analysis";
import { registerDetectionRoutes } from "./replit_integrations/detection/routes";

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

      // Validate and prepare invitations
      const validInvitations: Array<{ brandId: string; creatorName: string; email: string; category: string | null; message: string | null }> = [];
      const errors: Array<{ index: number; error: string }> = [];

      invitations.forEach((inv: { creatorName?: string; email?: string; category?: string; message?: string }, index: number) => {
        if (!inv.creatorName || !inv.email) {
          errors.push({ index, error: "Name and email are required" });
          return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(inv.email)) {
          errors.push({ index, error: "Invalid email format" });
          return;
        }

        validInvitations.push({
          brandId: useBrandId,
          creatorName: inv.creatorName,
          email: inv.email,
          category: inv.category || null,
          message: inv.message || null,
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

  return httpServer;
}
