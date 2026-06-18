import { Router, Response } from "express";
import { connectDB } from "../lib/mongodb";
import Photo from "../models/Photo";
import { cloudinary } from "../lib/cloudinary";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET photos — public (supports ?featured=true and ?galleryId=xxx)
router.get("/", async (req, res) => {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (req.query.featured === "true") query.featured = true;
  if (req.query.galleryId) query.galleryId = req.query.galleryId;

  const photos = await Photo.find(query).sort({ createdAt: -1 }).lean();
  return res.json(photos);
});

// PATCH update photo — admin only
router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  const photo = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!photo) return res.status(404).json({ error: "Not found" });
  return res.json(photo);
});

// DELETE photo — admin only
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ error: "Not found" });

  await cloudinary.uploader.destroy(photo.publicId);
  await Photo.findByIdAndDelete(req.params.id);

  return res.json({ success: true });
});

export default router;
