import { BookOpen, SlidersHorizontal, Star, type Icon } from "@phosphor-icons/react";

export interface NavTab {
  to: string;
  label: string;
  Icon: Icon;
}

/**
 * The app's three destinations, shared by the header and the bottom bar so
 * the two can't drift. Below 640px the header's copy is hidden and the bar
 * takes over; above it, the reverse.
 */
export const NAV_TABS: NavTab[] = [
  { to: "/", label: "Recipes", Icon: BookOpen },
  { to: "/favorites", label: "Favorites", Icon: Star },
  { to: "/kitchen", label: "My Kitchen", Icon: SlidersHorizontal },
];
