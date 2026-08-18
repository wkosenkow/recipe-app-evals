import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Footer() {
  const { user, logout } = useAuth();

  return (
    <footer className="flex items-center justify-center gap-4 border-t border-neutral-800 p-4 text-xs">
      {user ? (
        <>
          <span className="min-w-0 truncate text-neutral-500">{user.email}</span>
          <button
            type="button"
            onClick={logout}
            className="flex-shrink-0 font-semibold text-neutral-300 hover:text-neutral-100"
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="font-semibold text-neutral-400 hover:text-neutral-200">
            Log in
          </Link>
          <Link to="/signup" className="font-semibold text-accent hover:text-accent-400">
            Sign up
          </Link>
        </>
      )}
    </footer>
  );
}

export default Footer;
