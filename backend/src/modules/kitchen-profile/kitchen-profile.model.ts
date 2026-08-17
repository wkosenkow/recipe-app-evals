import { Schema, Types, model } from "mongoose";

export interface IKitchenProfile {
  userId: Types.ObjectId;
  servings: number;
  units: "metric" | "imperial";
  skill: "novice" | "experienced";
  equipment: string;
  diet: string;
}

const kitchenProfileSchema = new Schema<IKitchenProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    servings: { type: Number, required: true },
    units: { type: String, enum: ["metric", "imperial"], required: true },
    skill: { type: String, enum: ["novice", "experienced"], required: true },
    equipment: { type: String, default: "" },
    diet: { type: String, default: "" },
  },
  { timestamps: true },
);

export const KitchenProfile = model<IKitchenProfile>("KitchenProfile", kitchenProfileSchema);
