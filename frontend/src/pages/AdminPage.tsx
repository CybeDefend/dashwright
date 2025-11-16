import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Play,
  Database,
  Activity,
  Clock,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import apiClient from "../services/api";
import { format } from "date-fns";
import { useAuthStore } from "../store/auth.store";

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  organizations: {
    total: number;
  };
  testRuns: {
    total: number;
    today: number;
    thisWeek: number;
    passed: number;
    failed: number;
    running: number;
  };
  storage: {
    used: number;
    total: number;
    artifacts: number;
  };
  system: {
    uptime: number;
    version: string;
    environment: string;
  };
}

interface RecentUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  organizationName?: string;
}

interface RecentTestRun {
  id: string;
  name: string;
  status: string;
  organizationName: string;
  createdAt: string;
  duration: number;
}

const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTestRuns, setRecentTestRuns] = useState<RecentTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState<boolean>(true);
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Check if user is super admin
    if (!user?.isSuperAdmin) {
      navigate("/dashboard");
      return;
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setApiError(false);

      // Fetch all data in a single call
      const response = await apiClient.get("/admin/dashboard");

      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentTestRuns(response.data.recentTestRuns);
      setRegistrationEnabled(response.data.settings.registrationEnabled);
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      setApiError(true);
      // Use mock data as fallback
      setStats(getMockStats());
    } finally {
      setLoading(false);
    }
  };

  const toggleRegistration = async () => {
    try {
      setSavingRegistration(true);
      const newValue = !registrationEnabled;
      await apiClient.post("/admin/settings/registration-enabled", {
        enabled: newValue,
      });
      setRegistrationEnabled(newValue);
    } catch (error) {
      console.error("Failed to update registration setting:", error);
      alert("Failed to update registration setting");
    } finally {
      setSavingRegistration(false);
    }
  };

  const getMockStats = (): AdminStats => ({
    users: { total: 24, active: 18, inactive: 6 },
    organizations: { total: 5 },
    testRuns: {
      total: 1247,
      today: 45,
      thisWeek: 312,
      passed: 892,
      failed: 234,
      running: 3,
    },
    storage: { used: 2.4, total: 10, artifacts: 3456 },
    system: { uptime: 1234567, version: "1.0.0", environment: "production" },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Failed to load admin dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            System overview and administration
          </p>
        </div>
        {apiError ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="text-red-600" size={20} />
            <span className="text-sm font-medium text-red-700">
              API Connection Failed
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Activity className="text-green-600" size={20} />
            <span className="text-sm font-medium text-green-700">
              System Operational
            </span>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.users.total}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle size={12} />
              {stats.users.active} active
            </span>
            <span className="text-gray-500">
              {stats.users.inactive} inactive
            </span>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Building2 className="text-purple-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Organizations
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.organizations.total}
          </p>
          <div className="mt-3 text-xs text-gray-500">Active organizations</div>
        </div>

        {/* Test Runs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Play className="text-green-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Test Runs</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.testRuns.total}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-blue-600">{stats.testRuns.today} today</span>
            <span className="text-gray-500">
              {stats.testRuns.thisWeek} this week
            </span>
          </div>
        </div>

        {/* Storage */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Database className="text-orange-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Storage Used
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {formatBytes(stats.storage.used)}
          </p>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: `${(stats.storage.used / stats.storage.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatBytes(stats.storage.total)} total
            </p>
          </div>
        </div>
      </div>

      {/* Test Runs Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Test Runs Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="text-green-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Passed</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.testRuns.passed}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <XCircle className="text-red-600" size={32} />
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-900">
                {stats.testRuns.failed}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Clock className="text-blue-600 animate-pulse" size={32} />
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.testRuns.running}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Users</h2>
            <Users className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No recent users
              </p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.organizationName && (
                        <p className="text-xs text-gray-400">
                          {user.organizationName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(user.createdAt), "MMM d")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Test Runs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Recent Test Runs
            </h2>
            <Play className="text-gray-400" size={20} />
          </div>
          <div className="space-y-3">
            {recentTestRuns.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No recent test runs
              </p>
            ) : (
              recentTestRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {run.status === "passed" && (
                      <CheckCircle
                        className="text-green-500 flex-shrink-0"
                        size={20}
                      />
                    )}
                    {run.status === "failed" && (
                      <XCircle
                        className="text-red-500 flex-shrink-0"
                        size={20}
                      />
                    )}
                    {run.status === "running" && (
                      <Clock
                        className="text-blue-500 animate-spin flex-shrink-0"
                        size={20}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {run.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {run.organizationName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {format(new Date(run.createdAt), "MMM d")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-indigo-600" size={20} />
          <h2 className="text-lg font-bold text-gray-900">System Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Version</p>
            <p className="text-lg font-semibold text-gray-900">
              {stats.system.version}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Environment</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {stats.system.environment}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Uptime</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatUptime(stats.system.uptime)}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="text-orange-600" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Admin Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          >
            <Users className="text-indigo-600" size={24} />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Users</p>
              <p className="text-xs text-gray-500">View and edit users</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/admin/organizations")}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <Building2 className="text-purple-600" size={24} />
            <div className="text-left">
              <p className="font-semibold text-gray-900">
                Manage Organizations
              </p>
              <p className="text-xs text-gray-500">View and edit orgs</p>
            </div>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
          >
            <Shield className="text-orange-600" size={24} />
            <div className="text-left">
              <p className="font-semibold text-gray-900">System Settings</p>
              <p className="text-xs text-gray-500">Configure platform</p>
            </div>
          </button>
        </div>
      </div>

      {/* System Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="text-orange-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                System Settings
              </h2>
            </div>

            <div className="space-y-4">
              {/* Registration Toggle */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      User Registration
                    </p>
                    <p className="text-sm text-gray-600">
                      {registrationEnabled
                        ? "New users can create accounts"
                        : "Registration is disabled for new users"}
                    </p>
                  </div>
                  <button
                    onClick={toggleRegistration}
                    disabled={savingRegistration}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      registrationEnabled ? "bg-green-600" : "bg-gray-300"
                    } ${
                      savingRegistration ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        registrationEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  {registrationEnabled ? (
                    <>
                      <CheckCircle size={14} className="text-green-600" />
                      <span>Registration is currently enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} className="text-red-600" />
                      <span>Registration is currently disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
