import { apiPost } from "./api";
import type { RecipeEnrichment } from "./recipe-enrichment";
import type { KitchenProfile } from "../types/kitchen";
import type { MealIngredient } from "../types/mealdb";

export interface ChatRecipe {
  title: string;
  cuisine: string;
  ingredients: MealIngredient[];
  instructions: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface SendChatMessageParams {
  recipe: ChatRecipe;
  enrichment?: RecipeEnrichment;
  kitchenProfile: KitchenProfile;
  message?: string;
  history?: ChatMessage[];
}

export const sendChatMessage = ({
  recipe,
  enrichment,
  kitchenProfile,
  message,
  history,
}: SendChatMessageParams): Promise<string> =>
  apiPost<{ reply: string }>("/api/chat", { recipe, enrichment, kitchenProfile, message, history }).then(
    (data) => data.reply,
  );
