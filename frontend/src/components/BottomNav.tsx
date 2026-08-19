import { NavLink } from "react-router-dom";

import { NAV_TABS } from "./nav-tabs";

/**
 * The app's navigation, at every width.
 *
 * It used to trade places with a set of header tabs at 640px, so the controls
 * jumped from the bottom of the screen to the top as a window widened. One
 * placement everywhere is calmer, and this is the placement worth keeping: the
 * header put these as ~18px targets in the top-right corner — the hardest part
 * of a phone screen to reach with the thumb that's holding it.
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
      <div aria-hidden="true" style={{ height: "calc(56px + env(safe-area-inset-bottom))" }} />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-neutral-800 bg-bg"
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
