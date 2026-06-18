import { Router, Response } from "express";
import { connectDB } from "../lib/mongodb";
import Gallery from "../models/Gallery";
import Photo from "../models/Photo";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { Resend } from "resend";
import slugify from "slugify";
import { randomBytes } from "crypto";

const router = Router();

// GET all galleries — admin only
router.get("/", requireAuth, async (_req, res) => {
  await connectDB();
  const galleries = await Gallery.find().sort({ createdAt: -1 }).lean();

  const galleriesWithCount = await Promise.all(
    galleries.map(async (g) => {
      const photoCount = await Photo.countDocuments({ galleryId: g._id });
      return { ...g, photoCount };
    })
  );

  return res.json(galleriesWithCount);
});

// POST create gallery — admin only
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, clientName, clientEmail, pin, expiresAt } = req.body;
  if (!title || !clientName) {
    return res.status(400).json({ error: "Title and client name are required" });
  }

  await connectDB();

  const baseSlug = slugify(`${clientName} ${title}`, { lower: true, strict: true });
  const suffix = randomBytes(3).toString("hex");
  const slug = `${baseSlug}-${suffix}`;

  const gallery = await Gallery.create({
    title,
    clientName,
    clientEmail: clientEmail || undefined,
    slug,
    pin: pin || undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  return res.status(201).json(gallery);
});

// GET gallery by slug — public (for client gallery page)
router.get("/slug/:slug", async (req, res) => {
  await connectDB();
  const gallery = await Gallery.findOne({ slug: req.params.slug }).lean();
  if (!gallery) return res.status(404).json({ error: "Not found" });

  const photos = await Photo.find({ galleryId: gallery._id }).sort({ createdAt: -1 }).lean();
  return res.json({ ...gallery, photos });
});

// GET gallery by ID — admin
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  const gallery = await Gallery.findById(req.params.id).lean();
  if (!gallery) return res.status(404).json({ error: "Not found" });

  const photos = await Photo.find({ galleryId: gallery._id }).sort({ createdAt: -1 }).lean();
  return res.json({ ...gallery, photos });
});

// PATCH update gallery — admin only
router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  const updates = req.body;
  const wasPublished = updates.published === true;

  const before = await Gallery.findById(req.params.id);
  const gallery = await Gallery.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!gallery) return res.status(404).json({ error: "Not found" });

  const studioName = process.env.STUDIO_NAME || "BigLuxe Studio";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (wasPublished && !before?.published && gallery.clientEmail) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const galleryUrl = `${frontendUrl}/gallery/${gallery.slug}`;
    try {
      await resend.emails.send({
        from: `${studioName} <onboarding@resend.dev>`,
        to: gallery.clientEmail,
        subject: `Your gallery is ready! — ${gallery.title}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:600px;border-radius:8px;">
            <h1 style="color:#D4AF37;margin-bottom:16px;">Your photos are ready!</h1>
            <p>Hi ${gallery.clientName},</p>
            <p style="margin-top:8px;color:#ccc;">Your gallery is now live. Click below to view and download your photos.</p>
            <a href="${galleryUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#D4AF37;color:#000;text-decoration:none;border-radius:8px;font-weight:700;">
              View Your Gallery →
            </a>
            ${gallery.pin ? `<p style="margin-top:20px;color:#888;">PIN: <strong style="color:#D4AF37;letter-spacing:0.2em;">${gallery.pin}</strong></p>` : ""}
          </div>`,
      });
    } catch (e) {
      console.error("Gallery publish email failed:", e);
    }
  }

  return res.json(gallery);
});

// DELETE gallery — admin only
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  await Gallery.findByIdAndDelete(req.params.id);
  await Photo.deleteMany({ galleryId: req.params.id });
  return res.json({ success: true });
});

// POST verify PIN — public
router.post("/:id/verify-pin", async (req, res) => {
  const { pin } = req.body;
  await connectDB();

  const gallery = await Gallery.findOne({ slug: req.params.id });
  if (!gallery) return res.status(404).json({ error: "Not found" });

  if (gallery.pin && gallery.pin !== pin) {
    return res.status(401).json({ valid: false });
  }

  return res.json({ valid: true });
});

// POST track view — public
router.post("/:id/view", async (req, res) => {
  await connectDB();
  await Gallery.findOneAndUpdate({ slug: req.params.id }, { $inc: { viewCount: 1 } });
  return res.json({ success: true });
});

export default router;
