import { Router, Response } from "express";
import multer from "multer";
import { connectDB } from "../lib/mongodb";
import Photo from "../models/Photo";
import { cloudinary, getWatermarkedUrl, getThumbnailUrl, getOriginalUrl } from "../lib/cloudinary";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

type UploadResult = { public_id: string; secure_url: string; width: number; height: number };

router.post("/", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const galleryId = req.body.galleryId || null;
  const featured = req.body.featured === "true";

  const result = await new Promise<UploadResult>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "bigluxe", resource_type: "image", quality: "auto", fetch_format: "auto" },
        (error, res) => {
          if (error || !res) reject(error);
          else resolve(res as UploadResult);
        }
      )
      .end(req.file!.buffer);
  });

  await connectDB();

  const photo = await Photo.create({
    galleryId: galleryId || undefined,
    publicId: result.public_id,
    url: getOriginalUrl(result.public_id),
    thumbnailUrl: getThumbnailUrl(result.public_id, 800),
    watermarkedUrl: getWatermarkedUrl(result.public_id),
    width: result.width,
    height: result.height,
    featured,
  });

  return res.status(201).json(photo);
});

export default router;
