import { Router, Request, Response } from "express";
import { connectDB } from "../lib/mongodb";
import Booking from "../models/Booking";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { Resend } from "resend";

const router = Router();

// GET all bookings — admin only
router.get("/", requireAuth, async (_req, res) => {
  await connectDB();
  const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
  return res.json(bookings);
});

// POST new booking — public (clients submit this)
router.post("/", async (req: Request, res: Response) => {
  const { name, email, whatsapp, date, sessionType, message } = req.body;

  if (!name || !date || !sessionType) {
    return res.status(400).json({ error: "Name, date, and session type are required" });
  }

  await connectDB();
  const booking = await Booking.create({ name, email, whatsapp, date, sessionType, message });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const photographerEmail = process.env.PHOTOGRAPHER_EMAIL;
  const studioName = process.env.STUDIO_NAME || "BigLuxe Studio";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (photographerEmail) {
    try {
      await resend.emails.send({
        from: `${studioName} <onboarding@resend.dev>`,
        to: photographerEmail,
        subject: `New booking request — ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:40px;max-width:600px;border-radius:8px;">
            <h1 style="color:#D4AF37;margin-bottom:16px;">New Booking Request</h1>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;">
              <tr><td style="color:#888;padding:8px 0;width:120px;">Name</td><td style="color:#fff;">${name}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Date</td><td style="color:#fff;">${new Date(date).toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td></tr>
              <tr><td style="color:#888;padding:8px 0;">Session</td><td style="color:#fff;text-transform:capitalize;">${sessionType}</td></tr>
              ${email ? `<tr><td style="color:#888;padding:8px 0;">Email</td><td style="color:#fff;">${email}</td></tr>` : ""}
              ${whatsapp ? `<tr><td style="color:#888;padding:8px 0;">WhatsApp</td><td style="color:#fff;">${whatsapp}</td></tr>` : ""}
              ${message ? `<tr><td style="color:#888;padding:8px 0;vertical-align:top;">Message</td><td style="color:#fff;">${message}</td></tr>` : ""}
            </table>
            <a href="${frontendUrl}/admin/bookings" style="display:inline-block;margin-top:28px;padding:14px 28px;background:#D4AF37;color:#000;text-decoration:none;border-radius:8px;font-weight:700;">
              View in Dashboard →
            </a>
          </div>`,
      });
    } catch (e) {
      console.error("Booking notification email failed:", e);
    }
  }

  return res.status(201).json(booking);
});

// PATCH booking status — admin only
router.patch("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) return res.status(404).json({ error: "Not found" });
  return res.json(booking);
});

// DELETE booking — admin only
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await connectDB();
  await Booking.findByIdAndDelete(req.params.id);
  return res.json({ success: true });
});

export default router;
