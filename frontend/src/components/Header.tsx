import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

/**
 * Logo and account only. Navigation lives in BottomNav at every width.
 *
 * This used to swap the three tabs between here and the bottom bar at 640px,
 * which meant the controls physically moved from the bottom of the screen to
 * the top as a window widened — the layout rearranging itself under the user
 * rather than reflowing. One placement everywhere is calmer, and the phone
 * placement is the right one to keep: this is a cooking app, used on a phone
 * propped up in a kitchen far more often than in a desktop browser.
 */
function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-shrink-0 items-center gap-4 border-b border-neutral-800 px-6 py-4">
      {/* The mark doubles as the way home — the one thing a logo in the top-left
          is universally expected to do. `-m-2 p-2` grows the tap target past
          the 30px artwork without moving it or making the header taller. */}
      <Link to="/" aria-label="Kitchen Companion — home" className="-m-2 flex-shrink-0 p-2">
        <Logo />
      </Link>

      {/* Account, moved up out of the old footer, where it sat at the very
          bottom of the page in 12px type — both the last place anyone looks for
          their account and the one strip a phone's home indicator competes
          for. */}
      <div className="ml-auto flex min-w-0 items-center gap-3 text-xs whitespace-nowrap">
        {user ? (
          <>
            {/* The address is confirmation of *which* account, which matters
                far less than the action beside it — so it yields width first. */}
            <span className="min-w-0 truncate text-neutral-500">{user.email}</span>
            <button
              type="button"
              onClick={logout}
              className="-my-2 flex-shrink-0 py-2 font-semibold text-neutral-300 hover:text-neutral-100"
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
