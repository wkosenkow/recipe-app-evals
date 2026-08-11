import { Schema, model } from "mongoose";

export interface IIngredient {
  name: string;
  metricQty: number;
  metricUnit: string;
  imperialQty: number;
  imperialUnit: string;
  allergen?: "meat" | "dairy" | "gluten" | "nuts";
  unavailableDefault?: boolean;
  substitute?: string;
}

export interface IStep {
  text: string;
  why: string;
  equipment: string[];
}

export interface IRecipe {
  title: string;
  cuisine: string;
  time: number;
  difficulty: "Easy" | "Medium" | "Hard";
  baseServings: number;
  description: string;
  equipment: string[];
  ingredients: IIngredient[];
  steps: IStep[];
}

const ingredientSchema = new Schema<IIngredient>(
  {
    name: { type: String, required: true },
    metricQty: { type: Number, required: true },
    metricUnit: { type: String, required: true },
    imperialQty: { type: Number, required: true },
    imperialUnit: { type: String, required: true },
    allergen: { type: String, enum: ["meat", "dairy", "gluten", "nuts"] },
    unavailableDefault: { type: Boolean },
    substitute: { type: String },
  },
  { _id: false },
);

const stepSchema = new Schema<IStep>(
  {
    text: { type: String, required: true },
    why: { type: String, required: true },
    equipment: { type: [String], default: [] },
  },
  { _id: false },
);

const recipeSchema = new Schema<IRecipe>(
  {
    title: { type: String, required: true },
    cuisine: { type: String, required: true },
    time: { type: Number, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    baseServings: { type: Number, required: true },
    description: { type: String, required: true },
    equipment: { type: [String], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
    steps: { type: [stepSchema], default: [] },
  },
  { timestamps: true },
);

export const Recipe = model<IRecipe>("Recipe", recipeSchema);
