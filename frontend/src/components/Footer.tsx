import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Footer() {
  const { user, logout } = useAuth();

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-4 py-2">
      {user ? (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="min-w-0 truncate text-gray-400">{user.email}</span>
          <button type="button" onClick={logout} className="flex-shrink-0 font-semibold text-gray-300">
            Log out
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 text-xs font-semibold">
          <Link to="/login" className="text-gray-300">
            Log in
          </Link>
          <Link to="/signup" className="text-blue-400">
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
}

export default Footer;
