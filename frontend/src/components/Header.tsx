import { NavLink } from "react-router-dom";

import Logo from "./Logo";
import { NAV_TABS } from "./nav-tabs";

function Header() {
  return (
    <header className="flex items-center gap-6 border-b border-neutral-800 px-6 py-4">
      <Logo />
      {/* Hidden below 640px, where BottomNav carries the same three
          destinations within thumb's reach. `-my-2 py-2` grows each target
          without making the header taller; neutral-500 rather than
          neutral-600 for the inactive state, which is 4.1:1 on this ground
          against the 4.5:1 these 11px labels need. */}
      <nav aria-label="Main" className="ml-auto hidden gap-3 text-[11px] font-semibold whitespace-nowrap sm:flex">
        {NAV_TABS.map(({ to, label, Icon }) => (
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
