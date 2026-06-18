import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvite extends Document {
  email: string;
  token: string;
  status: "pending" | "accepted";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const Invite: Model<IInvite> =
  mongoose.models.Invite || mongoose.model<IInvite>("Invite", InviteSchema);

export default Invite;
