import type { Express, Request } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";

import { validateRequest } from "./lib/validate";
import { logger } from "./lib/logger";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import Twilio from "twilio";
import Stripe from "stripe";

// Per-user rate limiter for the qualify-lead endpoint (max 10 calls / 60 s)
const QUALIFY_LEAD_LIMIT = 10;
const QUALIFY_LEAD_WINDOW_MS = 60_000;
const qualifyLeadCalls = new Map<string, { count: number; windowStart: number }>();
function checkQualifyLeadRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = qualifyLeadCalls.get(userId);
  if (!entry || now - entry.windowStart >= QUALIFY_LEAD_WINDOW_MS) {
    qualifyLeadCalls.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= QUALIFY_LEAD_LIMIT) return false;
  entry.count += 1;
  return true;
}

type AdminGuardResult =
  | { ok: true; adminId: string }
  | { ok: false; status: number; message: string };

type AdminSessionPayload = {
  id: string;
  device: string;
  ipAddress: string | null;
  status: "active" | "expired";
  createdAt: string | null;
  expiresAt: string | null;
};

type AdminProviderPayload = {
  id: string;
  provider: string;
  status: "connected";
  connectedAt: string | null;
  lastSignInAt: string | null;
};

const uuidSchema = z.string().uuid();

function getBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

function parseDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes("edg")) return "Edge";
  if (userAgent.includes("opr") || userAgent.includes("opera")) return "Opera";
  if (userAgent.includes("chrome")) return "Chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome")) return "Safari";
  if (userAgent.includes("firefox")) return "Firefox";
  return "Navigateur";
}

function detectOs(userAgent: string): string {
  if (userAgent.includes("mac os") || userAgent.includes("macintosh")) return "macOS";
  if (userAgent.includes("windows")) return "Windows";
  if (userAgent.includes("android")) return "Android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ios")) return "iOS";
  if (userAgent.includes("linux")) return "Linux";
  return "OS inconnu";
}

function formatDeviceLabel(userAgentRaw: unknown): string {
  if (typeof userAgentRaw !== "string" || !userAgentRaw.trim()) {
    return "Session inconnue";
  }

  const userAgent = userAgentRaw.toLowerCase();
  const browser = detectBrowser(userAgent);
  const os = detectOs(userAgent);

  return `${browser} sur ${os}`;
}

function mapSessionRow(row: Record<string, unknown>): AdminSessionPayload {
  const createdAt = parseDate(row.created_at);
  const expiresAt = parseDate(row.not_after ?? row.expires_at);
  const now = Date.now();
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= now : false;

  return {
    id: String(row.id ?? ""),
    device: formatDeviceLabel(row.user_agent),
    ipAddress: typeof row.ip === "string" ? row.ip : null,
    status: isExpired ? "expired" : "active",
    createdAt,
    expiresAt,
  };
}

function mapProviders(user: {
  email?: string;
  app_metadata?: { providers?: string[] };
  identities?: Array<{
    id?: string;
    provider?: string;
    created_at?: string;
    last_sign_in_at?: string;
  }>;
} | null): AdminProviderPayload[] {
  const providers = new Map<string, AdminProviderPayload>();

  for (const identity of user?.identities ?? []) {
    if (!identity.provider) continue;

    const key = identity.provider.toLowerCase();
    providers.set(key, {
      id: identity.id ?? `${key}-${identity.created_at ?? "unknown"}`,
      provider: key,
      status: "connected",
      connectedAt: parseDate(identity.created_at),
      lastSignInAt: parseDate(identity.last_sign_in_at),
    });
  }

  for (const provider of user?.app_metadata?.providers ?? []) {
    const key = provider.toLowerCase();

    if (!providers.has(key)) {
      providers.set(key, {
        id: `provider-${key}`,
        provider: key,
        status: "connected",
        connectedAt: null,
        lastSignInAt: null,
      });
    }
  }

  if (user?.email && !providers.has("email")) {
    providers.set("email", {
      id: "provider-email",
      provider: "email",
      status: "connected",
      connectedAt: null,
      lastSignInAt: null,
    });
  }

  return Array.from(providers.values());
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    has_accepted_terms: z.boolean().optional(),
  });

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingEnvVars: string[] = [];

  if (!supabaseUrl) missingEnvVars.push("VITE_SUPABASE_URL (or SUPABASE_URL)");
  if (!serviceRoleKey) missingEnvVars.push("SUPABASE_SERVICE_ROLE_KEY");

  if (missingEnvVars.length > 0) {
    logger.error(
      { missingEnvVars },
      "Supabase admin client is not configured. Check Replit Secrets / .env",
    );
  }

  const supabaseAdmin =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

  const requireAdmin = async (req: Request): Promise<AdminGuardResult> => {
    if (!supabaseAdmin) {
      return { ok: false, status: 500, message: "Supabase auth is not configured" };
    }

    const token = getBearerToken(req);

    if (!token) {
      return { ok: false, status: 401, message: "Missing authorization token" };
    }

    const { data: requesterData, error: requesterError } = await supabaseAdmin.auth.getUser(token);

    if (requesterError || !requesterData.user) {
      return { ok: false, status: 401, message: "Invalid authorization token" };
    }

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requesterData.user.id)
      .maybeSingle();

    if (profileError) {
      logger.error({ err: profileError }, "Failed to verify admin role");
      return { ok: false, status: 500, message: "Unable to verify permissions" };
    }

    if (!requesterProfile || requesterProfile.role !== "admin") {
      return { ok: false, status: 403, message: "Admin access required" };
    }

    return { ok: true, adminId: requesterData.user.id };
  };

  const requireAuth = async (req: Request): Promise<{ ok: true; userId: string } | { ok: false; status: number; message: string }> => {
    if (!supabaseAdmin) {
      return { ok: false, status: 500, message: "Supabase auth is not configured" };
    }
    const token = getBearerToken(req);
    if (!token) {
      return { ok: false, status: 401, message: "Missing authorization token" };
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return { ok: false, status: 401, message: "Invalid authorization token" };
    }
    return { ok: true, userId: userData.user.id };
  };

  const APP_BASE_URL = process.env.APP_BASE_URL || "https://relanco.replit.app";

  app.get(api.health.path, (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/register", validateRequest(registerSchema), async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const { email, password, has_accepted_terms } = req.body as z.infer<typeof registerSchema>;

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          has_accepted_terms: has_accepted_terms ?? true,
        },
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(201).json({
        user: data.user,
      });
    } catch (error: any) {
      logger.error({ err: error }, "Register endpoint error");
      return res.status(500).json({ message: error.message ?? "Registration failed" });
    }
  });

  app.get("/api/admin/users/:id/details", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      const parsedUserId = uuidSchema.safeParse(userId);

      if (!parsedUserId.success) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const [profileResult, authUserResult, sessionsResult] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id,email,full_name,avatar_url,role,is_subscriber,created_at,last_active_at")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(userId),
        supabaseAdmin.rpc("admin_list_user_sessions", { p_user_id: userId }),
      ]);

      if (profileResult.error) {
        logger.error({ err: profileResult.error, userId }, "Failed to fetch profile details");
        return res.status(500).json({ message: "Failed to fetch user profile" });
      }

      if (!profileResult.data) {
        return res.status(404).json({ message: "User profile not found" });
      }

      if (authUserResult.error) {
        logger.error({ err: authUserResult.error, userId }, "Failed to fetch auth user details");
      }

      let sessionsUnavailable = false;
      let sessions: AdminSessionPayload[] = [];

      if (sessionsResult.error) {
        sessionsUnavailable = true;
        logger.warn({ err: sessionsResult.error, userId }, "Failed to fetch auth sessions");
      } else {
        sessions = (sessionsResult.data ?? []).map((row: unknown) => mapSessionRow(row as Record<string, unknown>));
      }

      const authUser = authUserResult.data.user;

      return res.json({
        profile: {
          id: profileResult.data.id,
          email: profileResult.data.email ?? authUser?.email ?? null,
          fullName:
            profileResult.data.full_name ??
            (typeof authUser?.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null),
          avatarUrl: profileResult.data.avatar_url ?? null,
          role: profileResult.data.role,
          isSubscriber: profileResult.data.is_subscriber,
          createdAt: profileResult.data.created_at,
          lastActiveAt: profileResult.data.last_active_at,
          lastSignInAt: authUser?.last_sign_in_at ?? null,
        },
        sessions,
        sessionsUnavailable,
        providers: mapProviders(authUser),
      });
    } catch (error: any) {
      logger.error({ err: error }, "Admin user details endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to fetch user details" });
    }
  });

  app.delete("/api/admin/users/:id/sessions/:sessionId", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      const sessionId = req.params.sessionId;

      if (!uuidSchema.safeParse(userId).success || !uuidSchema.safeParse(sessionId).success) {
        return res.status(400).json({ message: "Invalid identifier" });
      }

      const { error } = await supabaseAdmin.rpc("admin_revoke_user_session", {
        p_user_id: userId,
        p_session_id: sessionId,
      });

      if (error) {
        logger.error({ err: error, userId, sessionId }, "Failed to revoke session");
        return res.status(500).json({ message: "Failed to revoke session" });
      }

      return res.status(204).send();
    } catch (error: any) {
      logger.error({ err: error }, "Revoke session endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to revoke session" });
    }
  });

  app.post("/api/admin/users/:id/sessions/revoke-all", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase auth is not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const userId = req.params.id;
      if (!uuidSchema.safeParse(userId).success) {
        return res.status(400).json({ message: "Invalid user id" });
      }

      const { data: revokedCountResult, error } = await supabaseAdmin.rpc("admin_revoke_all_user_sessions", {
        p_user_id: userId,
      });

      if (error) {
        logger.error({ err: error, userId }, "Failed to revoke all sessions");
        return res.status(500).json({ message: "Failed to revoke all sessions" });
      }

      const revokedCount = typeof revokedCountResult === "number" ? revokedCountResult : 0;
      return res.json({ revokedCount });
    } catch (error: any) {
      logger.error({ err: error }, "Revoke all sessions endpoint error");
      return res.status(500).json({ message: error.message ?? "Failed to revoke all sessions" });
    }
  });

  app.get("/api/debug/profiles", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const { data, error } = await supabaseAdmin.from("profiles").select("*");

      if (error) {
        logger.error({ err: error }, "Error fetching profiles");
        return res.status(500).json({ message: error.message });
      }

      res.json(data);
    } catch (error: any) {
      logger.error({ err: error }, "Debug endpoint error");
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/debug/auth-users", async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase credentials not configured" });
      }

      const adminCheck = await requireAdmin(req);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }

      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        logger.error({ err: error }, "Error fetching auth users");
        return res.status(500).json({ message: error.message });
      }

      const users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        provider: u.app_metadata?.provider,
        created_at: u.created_at,
        user_metadata: u.user_metadata,
      }));

      res.json(users);
    } catch (error: any) {
      logger.error({ err: error }, "Debug auth-users endpoint error");
      res.status(500).json({ message: error.message });
    }
  });

  // Relanco API routes
  const relancoSchema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    vehicle: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    type: z.string().optional(),
    dueDate: z.string().optional(),
    channel: z.string().optional(),
  });

  // Leads
  app.get("/api/leads", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("leads").select("*").eq("user_id", userData.user.id);
      if (error) return res.status(500).json({ message: error.message });
      return res.json(data ?? []);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", validateRequest(relancoSchema), async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("leads").insert({ ...req.body, user_id: userData.user.id }).select();
      if (error) return res.status(500).json({ message: error.message });
      return res.status(201).json(data?.[0]);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to create lead" });
    }
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("clients").select("*").eq("user_id", userData.user.id);
      if (error) return res.status(500).json({ message: error.message });
      return res.json(data ?? []);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const body = req.body;
      const { data, error } = await supabaseAdmin.from("clients").insert({
        user_id: userData.user.id,
        name: body.name,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone,
        vehicle: body.vehicle,
        purchase_date: body.purchase_date,
        client_type: body.client_type,
        status: body.status || "Actif",
      }).select().single();

      if (error) return res.status(500).json({ message: error.message });
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to create client" });
    }
  });

  // Concessions
  app.get("/api/concession", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("concessions").select("*").eq("user_id", userData.user.id).single();
      if (error) return res.status(500).json({ message: error.message });
      return res.json(data ?? null);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch concession" });
    }
  });

  app.put("/api/concession", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const body = req.body;
      const { data, error } = await supabaseAdmin.from("concessions").upsert({
        user_id: userData.user.id,
        name: body.name,
        address: body.address,
        phone: body.phone,
      }, { onConflict: "user_id" }).select().single();

      if (error) return res.status(500).json({ message: error.message });
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to update concession" });
    }
  });

  // Relances
  app.get("/api/relances", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("relances").select("*").eq("user_id", userData.user.id);
      if (error) return res.status(500).json({ message: error.message });
      return res.json(data ?? []);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch relances" });
    }
  });

  // Reports
  app.get("/api/reports", async (req, res) => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ message: "Supabase not configured" });
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      const { data, error } = await supabaseAdmin.from("reports").select("*").eq("user_id", userData.user.id);
      if (error) return res.status(500).json({ message: error.message });
      return res.json(data ?? []);
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch reports" });
    }
  });

  // Agent IA Test — Claude
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

  // Twilio
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
  logger.info({
    twilio_sid_set: !!TWILIO_ACCOUNT_SID,
    twilio_token_set: !!TWILIO_AUTH_TOKEN,
    twilio_phone: TWILIO_PHONE_NUMBER,
  }, "Twilio config check");
  const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

  // Stripe
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" }) : null;

  const RELANCO_STRIPE_PRODUCTS = {
    rappels_auto_monthly:  { name: "Rappels Auto Mensuel", price: 17900, interval: "month" },
    rappels_auto_annual:   { name: "Rappels Auto Annuel", price: 171800, interval: "year" },
    reponse_clients_monthly: { name: "Réponse Clients Mensuel", price: 17900, interval: "month" },
    reponse_clients_annual:  { name: "Réponse Clients Annuel", price: 171800, interval: "year" },
    pack_complet_monthly:    { name: "Pack Complet Mensuel", price: 29900, interval: "month" },
    pack_complet_annual:     { name: "Pack Complet Annuel", price: 286800, interval: "year" },
  };

  // Twilio test SMS endpoint
  app.post("/api/test/sms", async (req, res) => {
    try {
      const authResult = await requireAdmin(req);
      if (!authResult.ok) {
        return res.status(authResult.status).json({ message: authResult.message });
      }

      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ success: false, message: "Missing 'to' or 'message'" });
      }

      // Mode simulation si Twilio n'est pas configuré ou si l'envoi échoue
      if (!twilioClient || !TWILIO_PHONE_NUMBER) {
        logger.info({ to, message }, "[SMS SIMULÉ] Twilio non configuré");
        console.log("[SMS SIMULÉ]", JSON.stringify({ to, message, timestamp: new Date().toISOString() }));
        return res.json({ success: true, simulated: true, message: "SMS simulé (Twilio non configuré)" });
      }

      try {
        const result = await twilioClient.messages.create({
          body: message,
          from: TWILIO_PHONE_NUMBER,
          to,
        });
        logger.info({ sid: result.sid }, "SMS test sent");
        return res.json({ success: true, sid: result.sid });
      } catch (twilioError: any) {
        // Si l'envoi Twilio échoue (numéro invalide, crédits insuffisants, etc.)
        // on passe en mode simulation pour ne pas planter l'app
        logger.warn({ to, message, error: twilioError.message }, "[SMS SIMULÉ] Envoi Twilio échoué");
        console.log("[SMS SIMULÉ]", JSON.stringify({ to, message, error: twilioError.message, timestamp: new Date().toISOString() }));
        return res.json({ success: true, simulated: true, message: "SMS simulé (envoi Twilio échoué)" });
      }
    } catch (error: any) {
      logger.error({ error: error.message }, "SMS test failed");
      return res.status(500).json({ success: false, message: error.message ?? "SMS test failed" });
    }
  });

  // Stripe checkout endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ success: false, message: "Stripe not configured" });
      }
      const { productKey } = req.body;
      const product = RELANCO_STRIPE_PRODUCTS[productKey as keyof typeof RELANCO_STRIPE_PRODUCTS];
      if (!product) {
        return res.status(400).json({ success: false, message: "Invalid product key" });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price_data: {
          currency: "eur",
          product_data: { name: product.name },
          unit_amount: product.price,
          recurring: { interval: product.interval as "month" | "year" },
        }, quantity: 1 }],
        success_url: `${APP_BASE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_BASE_URL}/`,
      });

      return res.json({ success: true, url: session.url });
    } catch (error: any) {
      logger.error({ error: error.message }, "Stripe checkout failed");
      return res.status(500).json({ success: false, message: error.message ?? "Checkout failed" });
    }
  });

  // Auth login endpoint (used by Chrome extension)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email et mot de passe requis" });
      }
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ message: "Supabase non configuré" });
      }

      const resAuth = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await resAuth.json();
      if (!resAuth.ok) {
        return res.status(resAuth.status).json({
          message: data.error_description || data.error || "Échec de la connexion",
        });
      }

      return res.json({
        token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, "Auth login failed");
      return res.status(500).json({ message: error.message ?? "Auth login failed" });
    }
  });

  // Schema setup endpoint (creates missing tables via Supabase SQL)
  app.post("/api/setup/schema", async (req, res) => {
    try {
      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ message: "Supabase not configured" });
      }

      const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS public.leads (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          vehicle TEXT,
          source TEXT,
          status TEXT DEFAULT 'En attente',
          priority TEXT DEFAULT 'Moyenne',
          type_demande TEXT DEFAULT 'acheteur',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS public.clients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          phone TEXT,
          vehicle TEXT,
          purchase_date TEXT,
          client_type TEXT DEFAULT 'Acheteur',
          last_visit TEXT,
          next_ct TEXT,
          next_service TEXT,
          status TEXT DEFAULT 'Actif',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS public.relances (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          client TEXT NOT NULL,
          vehicle TEXT,
          type TEXT NOT NULL,
          due_date TEXT,
          days_left TEXT,
          status TEXT DEFAULT 'En attente',
          channel TEXT DEFAULT 'SMS',
          sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS public.reports (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          month TEXT NOT NULL,
          leads_total TEXT,
          leads_qualified TEXT,
          relances_sent TEXT,
          relances_returned TEXT,
          revenue TEXT,
          status TEXT DEFAULT 'Généré',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS public.concessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          address TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )`,
        `ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY`,
        `ALTER TABLE public.concessions ENABLE ROW LEVEL SECURITY`,
        `DROP POLICY IF EXISTS "Users can read own leads" ON public.leads`,
        `CREATE POLICY "Users can read own leads" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id)`,
        `DROP POLICY IF EXISTS "Users can read own clients" ON public.clients`,
        `CREATE POLICY "Users can read own clients" ON public.clients FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = user_id)`,
        `DROP POLICY IF EXISTS "Users can read own relances" ON public.relances`,
        `CREATE POLICY "Users can read own relances" ON public.relances FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own relances" ON public.relances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own relances" ON public.relances FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own relances" ON public.relances FOR DELETE TO authenticated USING (auth.uid() = user_id)`,
        `DROP POLICY IF EXISTS "Users can read own reports" ON public.reports`,
        `CREATE POLICY "Users can read own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE TO authenticated USING (auth.uid() = user_id)`,
        `DROP POLICY IF EXISTS "Users can read own concession" ON public.concessions`,
        `CREATE POLICY "Users can read own concession" ON public.concessions FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can insert own concession" ON public.concessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`,
        `CREATE POLICY "Users can update own concession" ON public.concessions FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
        `CREATE POLICY "Users can delete own concession" ON public.concessions FOR DELETE TO authenticated USING (auth.uid() = user_id)`,
        `GRANT ALL ON public.leads TO service_role`,
        `GRANT ALL ON public.clients TO service_role`,
        `GRANT ALL ON public.relances TO service_role`,
        `GRANT ALL ON public.reports TO service_role`,
        `GRANT ALL ON public.concessions TO service_role`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.relances TO authenticated`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated`,
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.concessions TO authenticated`,
      ];

      const results = [];
      for (const sql of sqlStatements) {
        const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': supabaseAnonKey || serviceRoleKey,
          },
          body: JSON.stringify({ query: sql }),
        });
        const rpcData = await rpcRes.json().catch(() => ({}));
        results.push({ sql: sql.substring(0, 50), status: rpcRes.status, ok: rpcRes.ok });
      }

      return res.json({
        success: true,
        message: 'Schema setup completed',
        results: results.filter(r => !r.ok)
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Schema setup failed');
      return res.status(500).json({ message: error.message ?? 'Schema setup failed' });
    }
  });

  // Demo account setup endpoint (one-time initialization, non-production only)
  app.post("/api/setup/demo", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "Not found" });
    }

    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Supabase admin not configured" });
      }

      // 1. Create or update demo user
      const { data: existingUser, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      const demoUser = existingUser?.users?.find(u => u.email === 'demo@relanco.fr');
      let userId = demoUser?.id;

      if (!userId) {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: 'demo@relanco.fr',
          password: 'demo2025',
          email_confirm: true,
          user_metadata: { full_name: 'Julien', role: 'admin' }
        });
        if (createError) {
          return res.status(500).json({ message: `Failed to create user: ${createError.message}` });
        }
        userId = newUser.user.id;
      } else {
        // Update password to ensure it's correct
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: 'demo2025',
          email_confirm: true,
          user_metadata: { full_name: 'Julien', role: 'admin' }
        });
        if (updateError) {
          return res.status(500).json({ message: `Failed to update user: ${updateError.message}` });
        }
      }

      // 2. Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: 'demo@relanco.fr',
          full_name: 'Julien',
          role: 'admin',
          is_subscriber: true,
          has_accepted_terms: true,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
      }

      // 3. Create concession
      const { error: concessionError } = await supabaseAdmin
        .from('concessions')
        .upsert({
          user_id: userId,
          name: 'Garage Moreau Automobiles',
          address: '14 rue de la Paix, 69006 Lyon',
          phone: '04 78 12 34 56'
        }, { onConflict: 'user_id' });

      if (concessionError) {
        console.error('Concession upsert error:', concessionError);
      }

      // 4. Delete existing clients for this user
      await supabaseAdmin.from('clients').delete().eq('user_id', userId);

      // 5. Insert 5 demo clients
      const { error: clientsError } = await supabaseAdmin.from('clients').insert([
        { user_id: userId, name: 'Marc Dubois', first_name: 'Marc', last_name: 'Dubois', email: 'marc.dubois@gmail.com', phone: '0612345678', vehicle: 'Renault Clio 4 2019', purchase_date: '2023-03-15', client_type: 'Acheteur', status: 'Actif', last_visit: '2024-01-10', next_ct: '2025-03-15', next_service: '2024-06-15' },
        { user_id: userId, name: 'Sophie Laurent', first_name: 'Sophie', last_name: 'Laurent', email: 'sophie.laurent@orange.fr', phone: '0623456789', vehicle: 'Peugeot 3008 GT 2021', purchase_date: '2023-06-20', client_type: 'Acheteur', status: 'Actif', last_visit: '2024-02-05', next_ct: '2025-06-20', next_service: '2024-08-20' },
        { user_id: userId, name: 'Jean-Pierre Martin', first_name: 'Jean-Pierre', last_name: 'Martin', email: 'jp.martin@free.fr', phone: '0634567890', vehicle: 'BMW X3 xDrive 2020', purchase_date: '2023-09-10', client_type: 'Acheteur', status: 'Actif', last_visit: '2023-12-20', next_ct: '2025-09-10', next_service: '2024-03-10' },
        { user_id: userId, name: 'Claire Bernard', first_name: 'Claire', last_name: 'Bernard', email: 'claire.bernard@sfr.fr', phone: '0645678901', vehicle: 'Audi A4 Avant 2022', purchase_date: '2024-01-05', client_type: 'Acheteur', status: 'Actif', last_visit: '2024-03-15', next_ct: '2026-01-05', next_service: '2024-07-05' },
        { user_id: userId, name: 'Thomas Petit', first_name: 'Thomas', last_name: 'Petit', email: 'thomas.petit@gmail.com', phone: '0656789012', vehicle: 'Mercedes Classe A 2023', purchase_date: '2024-02-28', client_type: 'Acheteur', status: 'Actif', last_visit: '2024-04-01', next_ct: '2026-02-28', next_service: '2024-08-28' },
      ]);

      if (clientsError) {
        console.error('Clients insert error:', clientsError);
      }

      return res.json({
        success: true,
        message: 'Demo account created/updated',
        userId,
      });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Demo setup failed');
      return res.status(500).json({ message: error.message ?? 'Demo setup failed' });
    }
  });

  app.post("/api/agent/test", async (req, res) => {
    try {
      const authResult = await requireAuth(req);
      if (!authResult.ok) {
        return res.status(authResult.status).json({ message: authResult.message });
      }

      if (!anthropic) {
        return res.status(503).json({ message: "Anthropic API key not configured" });
      }
      const { message, history } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ message: "Missing or invalid 'message' field" });
      }

      const isFirstMessage = !Array.isArray(history) || history.length === 0;
      const historyLines = Array.isArray(history)
        ? history.map((m: any) => `${m.role === "user" ? "Client" : "Agent"}: ${m.text}`).join("\n")
        : "";

      const contextBlock = isFirstMessage
        ? "C'est le PREMIER message du client. Tu peux te présenter brièvement, accueillir le client, mentionner que tu transmettras à l'équipe, et poser UNE seule question."
        : `Historique de la conversation :\n${historyLines}\n\nC'est un message de SUIVI. Tu dois :\n- PAS de bonjour, pas de re-présentation\n- PAS de 'Je transmettrai au commercial'\n- PAS de 'Merci pour votre message'\n- PAS de formules de politesse répétées\n- Enchaîner naturellement sur la réponse précédente\n- Poser UNE seule question courte\n- Maximum 2 phrases par message\n- Style SMS : court, direct, une question à la fois.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: `Tu es l'agent IA Relanco, un assistant commercial pour une concession automobile française.

COMPORTEMENT SELON LE CONTEXTE :
${contextBlock}

RÈGLES UNIVERSELLES :
1. Identifie le type de demande : ACHAT ou VENTE.
2. Pose des questions de qualification pertinentes directement dans le texte, de façon naturelle — jamais sous forme de liste numérotée ou à puces.
3. Réponds en français, ton professionnel mais chaleureux.
4. Ne pas faire de promesses tarifaires.
5. Ne pas donner de prix d'achat/vente sans voir le véhicule.
6. Utilise "Avez-vous un véhicule à vendre en même temps ?" et jamais "Avez-vous un véhicule à reprendre ?".
7. Utilise "vente de votre véhicule actuel" et jamais "reprise de véhicule".
8. Utilise "véhicule à vendre" et jamais "véhicule à reprendre".
9. Utilise "si vous souhaitez vendre votre véhicule actuel" et jamais "dans le cadre d'une reprise".
10. Ne JAMAIS utiliser de gras markdown (**texte**) dans tes réponses.
11. Ne JAMAIS utiliser d'emojis, sauf dans le tout premier message d'accueil.
12. Maximum 3 questions par message, posées de façon naturelle dans le texte.

JAMAIS dans les messages de suivi (2, 3, 4...) :
- "Bonjour"
- "Merci pour votre message"
- "Je transmettrai au commercial"
- "Notre équipe vous contactera"
- "Excellente initiative"
- "C'est une bonne idée"
- Phrases de plus de 2 lignes

PROHIBITIONS DE TICS DE LANGAGE :
Tu es interdit d'utiliser ces expressions de confirmation répétitives :
- "C'est noté"
- "Très bien noté"
- "Noté !"
- "Parfait, c'est noté"
- "Entendu"
- "D'accord" en début de phrase systématique

Reformule naturellement ce que le client vient de dire, ou enchaîne directement sur la question suivante sans confirmation.
❌ "C'est noté. Vous préférez quelle couleur ?"
✅ "Pour la couleur, vous avez une préférence ?"

RÈGLE ABSOLUE — TU NE CONNAIS PAS :
- Les disponibilités des véhicules en stock
- Les prix exacts de vente
- Les délais de livraison
- Les politiques de l'entreprise (déplacement expert, transport, horaires...)
- Ce que peut ou ne peut pas faire la concession

Quand un client pose une question sur ces sujets, tu NE réponds PAS à sa place.
Tu redis TOUJOURS : "Bonne question — je transmets ça à notre équipe qui vous confirmera directement."

EXEMPLES :
- Client : "Un expert peut venir chez moi ?" → ❌ "Oui, l'expert peut se déplacer" → ✅ "Je transmets la question à notre équipe qui vous confirme ça rapidement."
- Client : "Vous avez ce modèle en rouge ?" → ❌ "Oui nous avons plusieurs rouges" → ✅ "Je vérifie le stock avec notre équipe et on revient vers vous."
- Client : "C'est combien pour ma vente ?" → ❌ Donner un prix → ✅ "L'estimation se fait à la concession — notre expert vous donne un chiffre précis lors de votre rendez-vous."

RÈGLE DE MÉMOIRE — LIS L'HISTORIQUE AVANT CHAQUE RÉPONSE :
Tu lis attentivement tout l'historique de la conversation avant de répondre.
Tu ne poses JAMAIS une question dont la réponse a déjà été donnée dans la conversation.
Avant chaque question, vérifie mentalement : "Est-ce que le client a déjà répondu à ça ?"
Si oui → ne repose pas la question, passe à la suivante ou confirme le rendez-vous.

EXEMPLE :
Si le client a dit "je viendrai demain avec ma voiture" → Ne pas demander "Vous pouvez venir avec votre véhicule ?" → Il a déjà répondu — passe à autre chose.

RÈGLE DE RÔLE FINAL :
Quand tu n'as pas l'information ou que tu n'es pas sûr → tu ne réponds pas à la place de la concession.
Tu collectes les infos du client et tu transmets.
C'est ton seul rôle — pas de jouer au commercial qui promet des choses.`,
        messages: [{ role: "user", content: message }],
      });

      const rawText = response.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("");

      // Nettoyage pour compatibilité SMS / texte brut
      let cleanText = rawText
        // Supprimer gras markdown
        .replace(/\*\*(.*?)\*\*/g, "$1")
        // Supprimer listes numérotées "1. " "2. " "3. "
        .replace(/^\s*\d+\.\s+/gm, "")
        // Supprimer puces markdown
        .replace(/^\s*[-\u2022]\s+/gm, "")
        // Supprimer emojis (plage unicode)
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, "")
        // Supprimer les doubles sauts de ligne excédentaires
        .replace(/\n{3,}/g, "\n\n")
        // Nettoyer espaces en début/fin
        .trim();

      return res.json({ response: cleanText, type: "claude" });
    } catch (error: any) {
      logger.error({ error: error.message }, "Agent test failed");
      return res.status(500).json({ message: error.message ?? "Agent test failed" });
    }
  });

  // Agent qualify-lead endpoint (used by Chrome extension)
  app.post("/api/agent/qualify-lead", async (req, res) => {
    try {
      if (!anthropic) {
        return res.status(503).json({ message: "Anthropic API key not configured" });
      }
      const token = getBearerToken(req);
      if (!token) return res.status(401).json({ message: "Missing token" });
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (!userData.user) return res.status(401).json({ message: "Invalid token" });

      if (!checkQualifyLeadRateLimit(userData.user.id)) {
        return res.status(429).json({ message: "Too many requests. Please wait before trying again." });
      }

      const { message_lead, vehicule, source, canal, historique } = req.body;
      if (!message_lead || typeof message_lead !== "string") {
        return res.status(400).json({ message: "Missing or invalid 'message_lead' field" });
      }

      const isFirstMessage = !Array.isArray(historique) || historique.length === 0;
      const historyLines = Array.isArray(historique)
        ? historique.map((m: any) => `${m.role === "user" ? "Client" : "Agent"}: ${m.text}`).join("\n")
        : "";

      const contextBlock = isFirstMessage
        ? "C'est le PREMIER message du client. Tu peux te présenter brièvement, accueillir le client, mentionner que tu transmettras à l'équipe, et poser UNE seule question."
        : `Historique de la conversation :\n${historyLines}\n\nC'est un message de SUIVI. Tu dois :\n- PAS de bonjour, pas de re-présentation\n- PAS de 'Je transmettrai au commercial'\n- PAS de 'Merci pour votre message'\n- PAS de formules de politesse répétées\n- Enchaîner naturellement sur la réponse précédente\n- Poser UNE seule question courte\n- Maximum 2 phrases par message\n- Style SMS : court, direct, une question à la fois.`;

      const vehicleContext = vehicule ? `\nVéhicule concerné : ${vehicule}.` : "";
      const sourceContext = source ? `\nSource du lead : ${source}.` : "";

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: `Tu es l'agent IA Relanco, un assistant commercial pour une concession automobile française.${vehicleContext}${sourceContext}

COMPORTEMENT SELON LE CONTEXTE :
${contextBlock}

RÈGLES UNIVERSELLES :
1. Identifie le type de demande : ACHAT ou VENTE.
2. Pose des questions de qualification pertinentes directement dans le texte, de façon naturelle — jamais sous forme de liste numérotée ou à puces.
3. Réponds en français, ton professionnel mais chaleureux.
4. Ne pas faire de promesses tarifaires.
5. Ne pas donner de prix d'achat/vente sans voir le véhicule.
6. Utilise "Avez-vous un véhicule à vendre en même temps ?" et jamais "Avez-vous un véhicule à reprendre ?".
7. Utilise "vente de votre véhicule actuel" et jamais "reprise de véhicule".
8. Utilise "véhicule à vendre" et jamais "véhicule à reprendre".
9. Utilise "si vous souhaitez vendre votre véhicule actuel" et jamais "dans le cadre d'une reprise".
10. Ne JAMAIS utiliser de gras markdown (**texte**) dans tes réponses.
11. Ne JAMAIS utiliser d'emojis, sauf dans le tout premier message d'accueil.
12. Maximum 3 questions par message, posées de façon naturelle dans le texte.

JAMAIS dans les messages de suivi (2, 3, 4...) :
- "Bonjour"
- "Merci pour votre message"
- "Je transmettrai au commercial"
- "Notre équipe vous contactera"
- "Excellente initiative"
- "C'est une bonne idée"
- Phrases de plus de 2 lignes

PROHIBITIONS DE TICS DE LANGAGE :
Tu es interdit d'utiliser ces expressions de confirmation répétitives :
- "C'est noté"
- "Très bien noté"
- "Noté !"
- "Parfait, c'est noté"
- "Entendu"
- "D'accord" en début de phrase systématique

Reformule naturellement ce que le client vient de dire, ou enchaîne directement sur la question suivante sans confirmation.

RÈGLE ABSOLUE — TU NE CONNAIS PAS :
- Les disponibilités des véhicules en stock
- Les prix exacts de vente
- Les délais de livraison
- Les politiques de l'entreprise
- Ce que peut ou ne peut pas faire la concession

Quand un client pose une question sur ces sujets, tu NE réponds PAS à sa place.
Tu redis TOUJOURS : "Bonne question — je transmets ça à notre équipe qui vous confirmera directement."

RÈGLE DE MÉMOIRE — LIS L'HISTORIQUE AVANT CHAQUE RÉPONSE :
Tu lis attentivement tout l'historique de la conversation avant de répondre.
Tu ne poses JAMAIS une question dont la réponse a déjà été donnée dans la conversation.

RÈGLE DE RÔLE FINAL :
Quand tu n'as pas l'information ou que tu n'es pas sûr → tu ne réponds pas à la place de la concession.
Tu collectes les infos du client et tu transmets.
C'est ton seul rôle — pas de jouer au commercial qui promet des choses.`,
        messages: [{ role: "user", content: message_lead }],
      });

      const rawText = response.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("");

      let cleanText = rawText
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/^\s*\d+\.\s+/gm, "")
        .replace(/^\s*[-\u2022]\s+/gm, "")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      return res.json({ reply: cleanText });
    } catch (error: any) {
      logger.error({ error: error.message }, "Agent qualify-lead failed");
      return res.status(500).json({ message: error.message ?? "Agent qualify-lead failed" });
    }
  });

  // Download Chrome extension ZIP
  app.get("/api/download/extension", async (req, res) => {
    try {
      const archiverModule = await import("archiver");
      const archive = new archiverModule.ZipArchive({ zlib: { level: 6 } });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="relanco-extension.zip"');

      archive.on("error", (err) => {
        logger.error({ error: err.message }, "Extension ZIP archive failed");
        res.status(500).json({ message: "Failed to create extension archive" });
      });

      archive.pipe(res);
      archive.directory("./chrome-extension/", false);
      await archive.finalize();
    } catch (error: any) {
      logger.error({ error: error.message }, "Extension download failed");
      return res.status(500).json({ message: error.message ?? "Extension download failed" });
    }
  });

  return httpServer;
}
