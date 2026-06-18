import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGallery extends Document {
  title: string;
  clientName: string;
  clientEmail?: string;
  slug: string;
  pin?: string;
  expiresAt?: Date;
  viewCount: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    title: { type: String, required: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, trim: true, lowercase: true },
    slug: { type: String, required: true, unique: true, trim: true },
    pin: { type: String },
    expiresAt: { type: Date },
    viewCount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Gallery: Model<IGallery> =
  mongoose.models.Gallery || mongoose.model<IGallery>("Gallery", GallerySchema);

export default Gallery;
