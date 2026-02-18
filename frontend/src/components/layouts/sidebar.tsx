import { Link, NavLink } from 'react-router-dom';

import { Logo } from '../logo';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◐', id: 'nav-dashboard' },
  { to: '/locations', label: 'Locations', icon: '◎', id: 'nav-locations' },
  { to: '/races', label: 'Races', icon: '⇢', id: 'nav-races' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <Link to="/" className="px-6 py-5 border-b border-gray-800 flex flex-col items-center hover:bg-gray-800 transition-colors">
        <Logo />
        <h1 className="text-xl font-bold text-white tracking-wide mt-2">Cartographer</h1>
        <p className="text-xs text-gray-500 mt-0.5">Route Planner</p>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            id={item.id}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-800">
        <NavLink
          id="nav-help"
          to="/help"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gray-800 text-white'
                : 'hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <span className="text-lg">?</span>
          Help
        </NavLink>
      </div>
    </aside>
  );
}
