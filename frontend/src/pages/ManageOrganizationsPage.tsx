import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Search,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
  Play,
} from "lucide-react";
import apiClient from "../services/api";
import { useAuthStore } from "../store/auth.store";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  usersCount: number;
  testRunsCount: number;
  createdAt: string;
}

interface OrganizationsResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ManageOrganizationsPage() {
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Check if user is super admin
    if (!currentUser?.isSuperAdmin) {
      navigate("/dashboard");
      return;
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasFetched.current) {
      fetchOrganizations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<OrganizationsResponse>(
        `/admin/organizations?page=${currentPage}&limit=20`
      );
      setOrganizations(response.data.organizations);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return;

    try {
      await apiClient.delete(`/admin/organizations/${selectedOrg.id}`);
      setShowDeleteModal(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error: any) {
      console.error("Failed to delete organization:", error);
      alert(error.response?.data?.message || "Failed to delete organization");
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && organizations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <Building2 className="text-purple-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Organizations
              </h1>
              <p className="text-sm text-gray-600">
                {total} organization{total !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search organizations by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrganizations.length === 0 ? (
          <div className="col-span-full">
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No organizations found</p>
            </div>
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {org.name}
                  </h3>
                  {org.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedOrg(org);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  title="Delete organization"
                  disabled={org.usersCount > 0}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>
                    {org.usersCount} user{org.usersCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Play size={16} className="text-gray-400" />
                  <span>
                    {org.testRunsCount} test run
                    {org.testRunsCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {format(new Date(org.createdAt), "MMM d, yyyy")}
                </p>
              </div>

              {org.usersCount > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Has active users
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Delete Organization
              </h2>
            </div>
            {selectedOrg.usersCount > 0 ? (
              <>
                <p className="text-gray-600 mb-6">
                  Cannot delete{" "}
                  <span className="font-semibold">{selectedOrg.name}</span>{" "}
                  because it has {selectedOrg.usersCount} active user
                  {selectedOrg.usersCount !== 1 ? "s" : ""}. Please remove or
                  transfer all users before deleting the organization.
                </p>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedOrg(null);
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{selectedOrg.name}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedOrg(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteOrganization}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
