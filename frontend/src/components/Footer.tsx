import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Footer() {
  const { user, logout } = useAuth();

  return (
    // The safe-area inset only applies from 640px up. Below that BottomNav is
    // the bottom-most element and carries the inset itself — keeping it here
    // too would leave a band of dead space above the bar on a notched phone.
    <footer className="flex items-center justify-center gap-4 border-t border-neutral-800 px-4 pt-4 pb-4 text-xs sm:[padding-bottom:max(calc(var(--spacing)*4),env(safe-area-inset-bottom))]">
      {user ? (
        <>
          <span className="min-w-0 truncate text-neutral-500">{user.email}</span>
          {/* py-2 -my-2 grows the tap target past the 12px text without adding
              height to the bar itself. */}
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
    </footer>
  );
}

export default Footer;
