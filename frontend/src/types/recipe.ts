export interface Ingredient {
  name: string;
  metricQty: number;
  metricUnit: string;
  imperialQty: number;
  imperialUnit: string;
  allergen?: "meat" | "dairy" | "gluten" | "nuts";
  unavailableDefault?: boolean;
  substitute?: string;
}

export interface Step {
  text: string;
  why: string;
  equipment: string[];
}

export interface Recipe {
  _id: string;
  title: string;
  cuisine: string;
  time: number;
  difficulty: "Easy" | "Medium" | "Hard";
  baseServings: number;
  description: string;
  equipment: string[];
  ingredients: Ingredient[];
  steps: Step[];
}
