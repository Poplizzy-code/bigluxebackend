import { Router, Response } from "express";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { connectDB } from "../lib/mongodb";
import Invite from "../models/Invite";
import User from "../models/User";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET pending invites — admin only
router.get("/", requireAuth, async (_req, res) => {
  await connectDB();
  const invites = await Invite.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
  return res.json(invites);
});

// POST send invite — admin only
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ error: "A team member with this email already exists" });

  const pendingInvite = await Invite.findOne({ email: email.toLowerCase(), status: "pending" });
  if (pendingInvite) return res.status(400).json({ error: "An invite was already sent to this email" });

  const token = randomBytes(32).toString("hex");
  const invite = await Invite.create({
    email,
    token,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  const studioName = process.env.STUDIO_NAME || "BigLuxe Studio";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const inviteUrl = `${frontendUrl}/admin/join/${token}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `${studioName} <onboarding@resend.dev>`,
      to: email,
      subject: `You've been invited to join ${studioName}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:600px;border-radius:8px;">
          <h1 style="color:#D4AF37;margin-bottom:16px;">You're invited!</h1>
          <p>You've been invited to join the <strong>${studioName}</strong> admin dashboard.</p>
          <p style="margin-top:8px;color:#ccc;">Click the button below to set up your account. This link expires in 48 hours.</p>
          <a href="${inviteUrl}" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#D4AF37;color:#000;text-decoration:none;border-radius:8px;font-weight:700;">
            Accept Invite →
          </a>
          <p style="margin-top:24px;color:#555;font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
        </div>`,
    });
  } catch (e) {
    console.error("Invite email failed:", e);
  }

  return res.status(201).json(invite);
});

// DELETE cancel invite — admin only
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  await Invite.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

// GET verify invite token — public
router.get("/verify/:token", async (req, res) => {
  await connectDB();
  const invite = await Invite.findOne({ token: req.params.token, status: "pending" });
  if (!invite || invite.expiresAt < new Date()) {
    return res.status(404).json({ error: "This invite link is invalid or has expired" });
  }
  return res.json({ email: invite.email });
});

// POST accept invite — public
router.post("/accept/:token", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Name and password are required" });

  await connectDB();

  const invite = await Invite.findOne({ token: req.params.token, status: "pending" });
  if (!invite || invite.expiresAt < new Date()) {
    return res.status(404).json({ error: "This invite link is invalid or has expired" });
  }

  const existing = await User.findOne({ email: invite.email });
  if (existing) return res.status(400).json({ error: "Account already exists for this email" });

  await User.create({ name, email: invite.email, password });

  invite.status = "accepted";
  await invite.save();

  return res.json({ success: true, email: invite.email });
});

export default router;
