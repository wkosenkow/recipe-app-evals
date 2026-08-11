import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/", label: "Recipes" },
  { to: "/favorites", label: "Favorites" },
  { to: "/kitchen", label: "My Kitchen" },
];

function TabBar() {
  return (
    <nav className="flex border-t border-gray-700 bg-gray-900">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-xs font-semibold ${
              isActive ? "text-blue-400" : "text-gray-500"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default TabBar;
