import { Schema, Types, model } from "mongoose";

export interface ICookingSessionMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ICookingSession {
  userId: Types.ObjectId;
  mealId: string;
  messages: ICookingSessionMessage[];
}

const cookingSessionMessageSchema = new Schema<ICookingSessionMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const cookingSessionSchema = new Schema<ICookingSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mealId: { type: String, required: true },
    messages: { type: [cookingSessionMessageSchema], default: [] },
  },
  { timestamps: true },
);

// One saved conversation per cook per recipe — the same key shape as
// Favorite's own unique index, and for the same reason: upsert-on-save
// instead of juggling create-vs-update.
cookingSessionSchema.index({ userId: 1, mealId: 1 }, { unique: true });

export const CookingSession = model<ICookingSession>("CookingSession", cookingSessionSchema);
