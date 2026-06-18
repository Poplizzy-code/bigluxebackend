import mongoose, { Document, Model, Schema } from "mongoose";

export type SessionType = "portrait" | "video" | "event" | "wedding" | "other";
export type BookingStatus = "pending" | "approved" | "declined";

export interface IBooking extends Document {
  name: string;
  email?: string;
  whatsapp?: string;
  date: Date;
  sessionType: SessionType;
  message?: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    date: { type: Date, required: true },
    sessionType: {
      type: String,
      enum: ["portrait", "video", "event", "wedding", "other"],
      required: true,
    },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
