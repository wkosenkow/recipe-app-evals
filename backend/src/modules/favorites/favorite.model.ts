import { Schema, Types, model } from "mongoose";

export interface IIngredientNote {
  ingredient: string;
  allergen?: "meat" | "dairy" | "gluten" | "nuts";
  substitute?: string;
}

export interface IEnrichment {
  equipment: string[];
  ingredientNotes: IIngredientNote[];
}

export interface IFavorite {
  userId: Types.ObjectId;
  mealId: string;
  title: string;
  cuisine: string;
  thumbnail: string;
  ingredients: { name: string; measure: string }[];
  instructions: string;
  enrichment?: IEnrichment;
}

const ingredientNoteSchema = new Schema<IIngredientNote>(
  {
    ingredient: { type: String, required: true },
    allergen: { type: String, enum: ["meat", "dairy", "gluten", "nuts"] },
    substitute: { type: String },
  },
  { _id: false },
);

const enrichmentSchema = new Schema<IEnrichment>(
  {
    equipment: { type: [String], default: [] },
    ingredientNotes: { type: [ingredientNoteSchema], default: [] },
  },
  { _id: false },
);

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mealId: { type: String, required: true },
    title: { type: String, required: true },
    cuisine: { type: String, required: true },
    thumbnail: { type: String, required: true },
    ingredients: {
      type: [
        new Schema(
          { name: { type: String, required: true }, measure: { type: String, required: true } },
          { _id: false },
        ),
      ],
      default: [],
    },
    instructions: { type: String, required: true },
    enrichment: { type: enrichmentSchema },
  },
  { timestamps: true },
);

favoriteSchema.index({ userId: 1, mealId: 1 }, { unique: true });

export const Favorite = model<IFavorite>("Favorite", favoriteSchema);
