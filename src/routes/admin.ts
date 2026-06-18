import { Router } from "express";
import { connectDB } from "../lib/mongodb";
import Gallery from "../models/Gallery";
import Photo from "../models/Photo";
import Booking from "../models/Booking";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET dashboard stats — admin only
router.get("/dashboard", requireAuth, async (_req, res) => {
  await connectDB();

  const [totalGalleries, totalPhotos, totalBookings, pendingBookings, recentGalleries] =
    await Promise.all([
      Gallery.countDocuments(),
      Photo.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Gallery.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  const recentPhotoCountsMap = await Promise.all(
    recentGalleries.map((g) => Photo.countDocuments({ galleryId: g._id }))
  );

  return res.json({
    totalGalleries,
    totalPhotos,
    totalBookings,
    pendingBookings,
    recentGalleries: recentGalleries.map((g, i) => ({
      ...g,
      _id: g._id.toString(),
      photoCount: recentPhotoCountsMap[i],
    })),
  });
});

export default router;
