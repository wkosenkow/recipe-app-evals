import type { ChatRequestBody } from "./chat.schemas.js";

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const EQUIPMENT_LABELS: Record<string, string> = {
  oven: "Oven",
  blender: "Blender",
  standMixer: "Stand mixer",
  slowCooker: "Slow cooker",
  grill: "Grill",
};

const DIET_LABELS: Record<string, string> = {
  veg: "Vegetarian",
  vegan: "Vegan",
  glutenFree: "Gluten-free",
  dairyFree: "Dairy-free",
  nutFree: "Nut-free",
};

const describeKitchen = (kitchenProfile: ChatRequestBody["kitchenProfile"]): string => {
  const owned = Object.keys(kitchenProfile.equipment).filter((key) => kitchenProfile.equipment[key]);
  const restrictions = Object.keys(kitchenProfile.diet).filter((key) => kitchenProfile.diet[key]);

  return (
    `units=${kitchenProfile.units}, skill level=${kitchenProfile.skill}, servings wanted=${kitchenProfile.servings}, ` +
    `equipment on hand=${owned.map((key) => EQUIPMENT_LABELS[key] ?? key).join(", ") || "none listed"}, ` +
    `dietary restrictions=${restrictions.map((key) => DIET_LABELS[key] ?? key).join(", ") || "none"}`
  );
};

const describeRecipe = ({ recipe, enrichment }: ChatRequestBody): string => {
  const ingredientLines = recipe.ingredients.map((ing) => `${ing.measure} ${ing.name}`.trim()).join(", ");
  const lines = [
    `Recipe: ${recipe.title} (${recipe.cuisine}).`,
    `Ingredients as listed by the recipe source: ${ingredientLines}.`,
    `Instructions: ${recipe.instructions.replace(/\r?\n+/g, " ").trim()}`,
  ];

  if (enrichment?.equipment.length) {
    lines.push(
      `Equipment this recipe needs: ${enrichment.equipment.map((key) => EQUIPMENT_LABELS[key] ?? key).join(", ")}.`,
    );
  }

  if (enrichment?.ingredientNotes.length) {
    const notes = enrichment.ingredientNotes
      .map((note) => {
        const parts = [note.ingredient];
        if (note.allergen) parts.push(`contains ${note.allergen}`);
        if (note.substitute) parts.push(`substitute: ${note.substitute}`);
        return parts.join(" — ");
      })
      .join("; ");
    lines.push(`Ingredient notes: ${notes}.`);
  }

  return lines.join("\n");
};

const buildSystemPrompt = (body: ChatRequestBody): string =>
  "You are a friendly cooking assistant walking a home cook through a recipe step by step in chat. " +
  "The conversation below is the full history so far — you already said whatever is attributed to you in it, " +
  "so never restart or repeat steps you've already covered. If the cook says something like \"next\" or " +
  "\"continue\", pick up exactly where your last message left off.\n" +
  describeRecipe(body) +
  "\n" +
  `Cook's kitchen: ${describeKitchen(body.kitchenProfile)}.\n` +
  "Keep replies well under 350 words.";

const OPENING_TRIGGER =
  "Let's get started. Give me the full walkthrough now: the ingredients (call out anything relevant to my " +
  "dietary restrictions and any substitute given for them), then every step in order, adapted for my servings " +
  "and kitchen. Do not stop partway through or ask if I want you to continue — list every step through to " +
  "serving in this one message, then invite me to ask for changes.";

export const buildChatMessages = (body: ChatRequestBody): OllamaChatMessage[] => {
  const messages: OllamaChatMessage[] = [{ role: "system", content: buildSystemPrompt(body) }];

  for (const turn of body.history ?? []) {
    messages.push({ role: turn.role, content: turn.text });
  }

  messages.push({ role: "user", content: body.message ?? OPENING_TRIGGER });

  return messages;
};
