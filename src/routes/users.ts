import { Router, Response } from "express";
import { connectDB } from "../lib/mongodb";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  await connectDB();
  const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
  return res.json(users);
});

router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: "An admin with this email already exists" });
  }

  const user = await User.create({ name, email, password });
  const { password: _pw, ...safe } = user.toObject();
  return res.status(201).json(safe);
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.user?.id === req.params.id) {
    return res.status(400).json({ error: "You cannot remove yourself" });
  }

  await connectDB();
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({ success: true });
});

export default router;
