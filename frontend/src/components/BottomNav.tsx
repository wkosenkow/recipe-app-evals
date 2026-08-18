import { NavLink } from "react-router-dom";

import { NAV_TABS } from "./nav-tabs";

/**
 * The phone's navigation. Below 640px the header's tabs are hidden and this
 * takes over.
 *
 * The header put them as ~18px targets in the top-right corner — the hardest
 * part of a 390px screen to reach with the thumb that's holding the phone.
 * Right-aligned chrome reads well on a desktop; on a phone it's the wrong end
 * of the device.
 *
 * Sizes are explicit rather than taken from the spacing scale: 56px tall with
 * 48px targets is a platform convention, not something that should shift with
 * the density token.
 *
 * Renders a spacer as well as the fixed bar. The bar is out of flow, so
 * without it the last band of every page would sit underneath — and putting
 * the spacer here rather than a `pb-*` on each page means a screen only has
 * to render <BottomNav /> to be correct.
 */
function BottomNav() {
  return (
    <>
      <div
        aria-hidden="true"
        className="sm:hidden"
        style={{ height: "calc(56px + env(safe-area-inset-bottom))" }}
      />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-800 bg-bg sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                isActive ? "text-accent" : "text-neutral-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Filled while active, outline otherwise — the state is
                    carried by weight as well as colour, so it doesn't rest on
                    hue alone. */}
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default BottomNav;
