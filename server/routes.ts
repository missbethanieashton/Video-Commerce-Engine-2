import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVideoSchema, insertBrandReferralSchema, insertBrandSchema, insertProductSchema, insertAnalyticsEventSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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

  return httpServer;
}
