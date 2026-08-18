import { BookOpen, SlidersHorizontal, Star } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

import Logo from "./Logo";

const TABS = [
  { to: "/", label: "Recipes", Icon: BookOpen },
  { to: "/favorites", label: "Favorites", Icon: Star },
  { to: "/kitchen", label: "My Kitchen", Icon: SlidersHorizontal },
];

function Header() {
  return (
    <header className="flex items-center gap-6 border-b border-neutral-800 px-6 py-4">
      <Logo />
      {/* Pushed to the trailing edge, away from the mark — the design's
          left-aligned, asymmetric direction. */}
      {/* `-my-2 py-2` on each tab grows the tap target without making the
          header taller. neutral-500 rather than neutral-600 for the inactive
          state: neutral-600 on this ground is 4.1:1, under the 4.5:1 small
          text needs, and these labels are 11px. neutral-500 is 5.4:1. */}
      <nav className="ml-auto flex gap-3 text-[11px] font-semibold whitespace-nowrap">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `-my-2 flex items-center gap-1 py-2 ${
                isActive ? "text-accent" : "text-neutral-500 hover:text-neutral-300"
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export default Header;
