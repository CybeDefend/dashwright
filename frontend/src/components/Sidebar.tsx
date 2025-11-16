import { NavLink } from 'react-router-dom';
import { Home, Play, Settings, LogOut, Key, Users } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import clsx from 'clsx';

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  const links = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/runs', icon: Play, label: 'Test Runs' },
    { to: '/organization', icon: Users, label: 'Organization' },
    { to: '/api-keys', icon: Key, label: 'API Keys' },
    { to: '/admin', icon: Settings, label: 'Admin' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Dashwright</h1>
        <p className="text-sm text-gray-500 mt-1">Playwright Dashboard</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )
            }
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
