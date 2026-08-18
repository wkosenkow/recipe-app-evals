import { apiGet, apiPut } from "./api";
import type { ChatMessage } from "./chat";

// One saved conversation per cook per recipe. GET returns an empty array when
// nothing's been saved yet, never a 404 — an unstarted chat isn't an error.
export const getCookingSession = (mealId: string): Promise<ChatMessage[]> =>
  apiGet<{ messages: ChatMessage[] }>(`/api/cooking-sessions/${mealId}`).then((data) => data.messages);

// Replaces the saved transcript wholesale — the caller always has the full
// `messages` array in memory already, so there's no partial-update case to
// support.
export const saveCookingSession = (mealId: string, messages: ChatMessage[]): Promise<void> =>
  apiPut(`/api/cooking-sessions/${mealId}`, { messages }).then(() => undefined);
