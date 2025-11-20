import { NavLink } from "react-router-dom";
import {
  Home,
  Settings,
  LogOut,
  Key,
  Users,
  Building2,
  Copy,
  Check,
} from "lucide-react";
import { useAuthStore, isAdmin, canManage } from "../store/auth.store";
import clsx from "clsx";
import { useEffect, useState, useRef } from "react";
import apiClient from "../services/api";

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [copiedOrgId, setCopiedOrgId] = useState(false);
  const hasFetchedOrg = useRef(false);

  useEffect(() => {
    if (user?.organizationId && !hasFetchedOrg.current) {
      hasFetchedOrg.current = true;
      fetchOrganization();
    }
  }, [user?.organizationId]);

  const fetchOrganization = async () => {
    try {
      const response = await apiClient.get("/organizations/me");
      if (response.data) {
        setOrganizationName(response.data.name);
      }
    } catch (error) {
      console.error("Failed to fetch organization:", error);
    }
  };

  const copyOrgId = async () => {
    if (!user?.organizationId) return;
    try {
      await navigator.clipboard.writeText(user.organizationId);
      setCopiedOrgId(true);
      setTimeout(() => setCopiedOrgId(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const links = [
    { to: "/", icon: Home, label: "Dashboard" },
    // API Keys - Admin and Maintainer only
    ...(canManage(user)
      ? [{ to: "/api-keys", icon: Key, label: "API Keys" }]
      : []),
    // Organization (invitations) - Admin and Maintainer only
    ...(canManage(user)
      ? [{ to: "/organization", icon: Users, label: "Organization" }]
      : []),
    // Admin page - Super admin only
    ...(user?.isSuperAdmin
      ? [{ to: "/admin", icon: Settings, label: "Admin" }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary-600">Dashwright</h1>
        {organizationName && user?.organizationId ? (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="text-gray-500" size={14} />
              <p className="text-sm font-medium text-gray-700">
                {organizationName}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-1 truncate">
                {user.organizationId}
              </code>
              <button
                onClick={copyOrgId}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                title="Copy Organization ID"
              >
                {copiedOrgId ? (
                  <Check className="text-green-600" size={12} />
                ) : (
                  <Copy
                    className="text-gray-400 hover:text-gray-600"
                    size={12}
                  />
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Playwright Dashboard</p>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
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
