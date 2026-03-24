import { type Express } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword } from "./auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  role: z.enum(["creator", "brand", "affiliate"]).default("creator"),
  accessCode: z.string().optional(),
});

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { email, password } = parsed.data;
    const user = await storage.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    (req.session as any).userId = user.id;
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isAdmin: user.isAdmin,
      avatarUrl: user.avatarUrl,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid input" });
    }

    const { email, password, displayName, role, accessCode } = parsed.data;

    const validCode = process.env.ACCESS_CODE ?? "exclusiveaccess1233*";
    const hasFreeAccess = !!(accessCode && accessCode.trim() === validCode);

    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashed = await hashPassword(password);
    const username = email.split("@")[0] + "_" + Date.now();

    const user = await storage.createUser({
      username,
      password: hashed,
      email,
      displayName,
      role,
      freeAccess: hasFreeAccess,
    } as any);

    (req.session as any).userId = user.id;
    await new Promise<void>((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    res.status(201).json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isAdmin: user.isAdmin,
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      role: user.role,
      isAdmin: user.isAdmin,
      avatarUrl: user.avatarUrl,
      stripeCustomerId: user.stripeCustomerId,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboarded: user.stripeConnectOnboarded,
    });
  });
}

export async function seedAdminAccount() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ADMIN_ACCOUNT) {
    return;
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "missbethanieashton@gmail.com";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test1233*";

  try {
    const existing = await storage.getUserByEmail(ADMIN_EMAIL);
    if (existing) {
      const hashed = await hashPassword(ADMIN_PASSWORD);
      await storage.updateUser(existing.id, { isAdmin: true, password: hashed } as any);
      console.log("[Auth] Admin account password synced: " + ADMIN_EMAIL);
      return;
    }

    const hashed = await hashPassword(ADMIN_PASSWORD);
    await storage.createUser({
      username: "bethanieashton_admin",
      password: hashed,
      email: ADMIN_EMAIL,
      displayName: "Bethanie Ashton",
      role: "creator",
      isAdmin: true,
    } as any);

    console.log("[Auth] Admin test account created: " + ADMIN_EMAIL);
  } catch (err) {
    console.error("[Auth] Failed to seed admin account:", err);
  }
}
