export interface Favorite {
  _id: string;
  mealId: string;
  title: string;
  cuisine: string;
  thumbnail: string;
  ingredients: { name: string; measure: string }[];
  instructions: string;
}
