import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./lib/mongodb";

import authRoutes from "./routes/auth";
import bookingRoutes from "./routes/bookings";
import galleryRoutes from "./routes/galleries";
import photoRoutes from "./routes/photos";
import uploadRoutes from "./routes/upload";
import seedRoutes from "./routes/seed";
import adminRoutes from "./routes/admin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/galleries", galleryRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
