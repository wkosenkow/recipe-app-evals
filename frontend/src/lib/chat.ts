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

// The whole history is replayed to the model every turn, so an unbounded
// conversation means a prompt — and a bill — that grows with each message.
// Keep the most recent turns; the backend enforces a hard ceiling of its own.
const HISTORY_WINDOW = 20;

export const sendChatMessage = ({
  recipe,
  enrichment,
  kitchenProfile,
  message,
  history,
}: SendChatMessageParams): Promise<string> =>
  apiPost<{ reply: string }>("/api/chat", {
    recipe,
    enrichment,
    kitchenProfile,
    message,
    history: history?.slice(-HISTORY_WINDOW),
  }).then((data) => data.reply);
