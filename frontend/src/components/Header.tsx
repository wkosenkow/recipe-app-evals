import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Recipes" },
  { to: "/favorites", label: "Favorites" },
  { to: "/kitchen", label: "My Kitchen" },
];

function Header() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-700 bg-gray-900 px-4 py-3">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `whitespace-nowrap text-sm font-semibold ${isActive ? "text-blue-400" : "text-gray-500"}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export default Header;
