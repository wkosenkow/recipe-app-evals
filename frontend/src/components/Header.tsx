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
      <nav className="ml-auto flex gap-3 text-[11px] font-semibold whitespace-nowrap">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-1 ${isActive ? "text-accent" : "text-neutral-600 hover:text-neutral-400"}`
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
