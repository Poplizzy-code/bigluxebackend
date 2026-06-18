import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPhoto extends Document {
  galleryId?: mongoose.Types.ObjectId;
  publicId: string;
  url: string;
  thumbnailUrl: string;
  watermarkedUrl: string;
  width: number;
  height: number;
  featured: boolean;
  caption?: string;
  type: "image" | "video";
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    galleryId: { type: Schema.Types.ObjectId, ref: "Gallery", index: true },
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    watermarkedUrl: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    featured: { type: Boolean, default: false, index: true },
    caption: { type: String, trim: true },
    type: { type: String, enum: ["image", "video"], default: "image" },
  },
  { timestamps: true }
);

const Photo: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>("Photo", PhotoSchema);

export default Photo;
