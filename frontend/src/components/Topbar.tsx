import { useAuthStore } from '../store/auth.store';
import { User } from 'lucide-react';

export default function Topbar() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Welcome back!</h2>
          <p className="text-sm text-gray-500">Manage your Playwright test runs</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
            <User size={20} className="text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-500">@{user?.username}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
