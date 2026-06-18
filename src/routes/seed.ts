import { Router } from "express";
import { connectDB } from "../lib/mongodb";
import User from "../models/User";

const router = Router();

router.post("/", async (_req, res) => {
  await connectDB();

  const existing = await User.findOne({ role: "photographer" });
  if (existing) {
    return res.status(400).json({ message: "Admin already exists" });
  }

  const user = await User.create({
    name: process.env.STUDIO_NAME || "BigLuxe Studio",
    email: process.env.PHOTOGRAPHER_EMAIL || "admin@bigluxe.com",
    password: "bigluxe2024!",
    role: "photographer",
  });

  return res.json({ message: "Admin created", email: user.email });
});

export default router;
