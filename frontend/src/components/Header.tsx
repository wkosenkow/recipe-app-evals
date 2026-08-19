import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { NAV_TABS } from "./nav-tabs";

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-shrink-0 items-center gap-4 border-b border-neutral-800 px-6 py-4">
      {/* The mark doubles as the way home — the one thing a logo in the top-left
          is universally expected to do, and previously it did nothing at all.
          `-m-2 p-2` grows the tap target past the 30px artwork without moving
          it or making the header taller. */}
      <Link to="/" aria-label="Kitchen Companion — home" className="-m-2 flex-shrink-0 p-2">
        <Logo />
      </Link>

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

      {/* Account, moved up out of the footer. It used to sit at the very bottom
          of the page in 12px type, which is both the last place anyone looks
          for their account and the one strip a phone's home indicator competes
          for. `ml-auto sm:ml-4` is what lets this sit hard right on a phone,
          where the nav above is hidden, and merely follow the tabs on a
          desktop. */}
      <div className="ml-auto flex items-center gap-3 text-xs whitespace-nowrap sm:ml-4">
        {user ? (
          <>
            {/* The address is confirmation of *which* account, which matters far
                less than the action beside it — so it yields the width first. */}
            <span className="hidden max-w-[18ch] truncate text-neutral-500 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={logout}
              className="-my-2 py-2 font-semibold text-neutral-300 hover:text-neutral-100"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="-my-2 py-2 font-semibold text-neutral-400 hover:text-neutral-200">
              Log in
            </Link>
            <Link to="/signup" className="-my-2 py-2 font-semibold text-accent hover:text-accent-400">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
