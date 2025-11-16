import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";
import apiClient from "../services/api";
import { wsService } from "../services/websocket";
import { format } from "date-fns";
import ConfirmModal from "../components/ConfirmModal";

interface TestRun {
  id: string;
  name: string;
  status: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  createdAt: string;
  environment?: string;
  branch?: string;
}

export default function DashboardPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const wsConnected = useRef(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "force-fail" | null;
    runId: string | null;
    runName: string;
  }>({
    isOpen: false,
    type: null,
    runId: null,
    runName: "",
  });

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTestRuns();
    }

    // Connect WebSocket for real-time updates
    if (!wsConnected.current) {
      wsConnected.current = true;
      wsService.connect();

      wsService.on("test-run:created", (newRun: TestRun) => {
        setTestRuns((prev) => [newRun, ...prev]);
      });

      wsService.on("test-run:updated", (updatedRun: TestRun) => {
        setTestRuns((prev) =>
          prev.map((run) => (run.id === updatedRun.id ? updatedRun : run))
        );
      });
    }

    return () => {
      if (wsConnected.current) {
        wsService.disconnect();
        wsConnected.current = false;
      }
    };
  }, []);

  const fetchTestRuns = async () => {
    try {
      const response = await apiClient.get("/test-runs");
      setTestRuns(response.data);
    } catch (error) {
      console.error("Failed to fetch test runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceFail = async (runId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);

    const run = testRuns.find((r) => r.id === runId);
    setConfirmModal({
      isOpen: true,
      type: "force-fail",
      runId,
      runName: run?.name || "this test run",
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.runId || !confirmModal.type) return;

    try {
      if (confirmModal.type === "force-fail") {
        await apiClient.put(`/test-runs/${confirmModal.runId}/force-fail`);
        // Update will be received via WebSocket
      } else if (confirmModal.type === "delete") {
        await apiClient.delete(`/test-runs/${confirmModal.runId}`);
        setTestRuns((prev) =>
          prev.filter((run) => run.id !== confirmModal.runId)
        );
      }
    } catch (error) {
      console.error(`Failed to ${confirmModal.type} test run:`, error);
      alert(`Error during test run ${confirmModal.type}`);
    } finally {
      setConfirmModal({ isOpen: false, type: null, runId: null, runName: "" });
    }
  };

  const handleDelete = async (runId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);

    const run = testRuns.find((r) => r.id === runId);
    setConfirmModal({
      isOpen: true,
      type: "delete",
      runId,
      runName: run?.name || "this test run",
    });
  };

  const toggleMenu = (runId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(openMenuId === runId ? null : runId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="text-green-500" size={20} />;
      case "failed":
        return <XCircle className="text-red-500" size={20} />;
      case "running":
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      default:
        return <Play className="text-gray-500" size={20} />;
    }
  };

  // Get unique environments from test runs
  const environments = Array.from(
    new Set(testRuns.map((run) => run.environment).filter(Boolean))
  ) as string[];

  // Filter and sort test runs
  const filteredAndSortedRuns = testRuns
    .filter((run) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        run.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        run.branch?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "failed" && run.status === "failed") ||
        (statusFilter === "passed" && run.status === "passed") ||
        (statusFilter === "running" && run.status === "running") ||
        (statusFilter === "has-failures" && run.failedTests > 0);

      // Environment filter
      const matchesEnvironment =
        environmentFilter === "all" || run.environment === environmentFilter;

      return matchesSearch && matchesStatus && matchesEnvironment;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return <div className="text-center py-12">Loading test runs...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Stats */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Test Runs</h1>
          <p className="text-gray-600">
            Monitor your Playwright test executions in real-time
          </p>
        </div>

        {/* Quick Stats */}
        {testRuns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">
                    Total Runs
                  </p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {testRuns.length}
                  </p>
                </div>
                <CheckCircle className="text-emerald-500" size={32} />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Running</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {testRuns.filter((r) => r.status === "running").length}
                  </p>
                </div>
                <Clock className="text-indigo-500 animate-pulse" size={32} />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Passed</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {testRuns.filter((r) => r.status === "passed").length}
                  </p>
                </div>
                <CheckCircle className="text-emerald-500" size={32} />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-900">
                    {testRuns.filter((r) => r.status === "failed").length}
                  </p>
                </div>
                <XCircle className="text-red-500" size={32} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      {testRuns.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-44">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="has-failures">Has Failures</option>
              </select>
            </div>

            {/* Environment Filter */}
            {environments.length > 0 && (
              <div className="w-full lg:w-44">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <select
                  value={environmentFilter}
                  onChange={(e) => setEnvironmentFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Environments</option>
                  {environments.map((env) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort */}
            <div className="w-full lg:w-44">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "oldest")
                }
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Results Count - Inline */}
            <div className="text-xs text-gray-600 whitespace-nowrap lg:pb-2">
              {filteredAndSortedRuns.length} / {testRuns.length}
            </div>
          </div>
        </div>
      )}

      {/* Test Runs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRuns.map((run, index) => (
          <div
            key={run.id}
            className="card hover:scale-[1.02] transition-all duration-200 group animate-scale-in relative"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <Link to={`/runs/${run.id}`} className="block">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(run.status)}
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {run.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {format(new Date(run.createdAt), "MMM d, yyyy • HH:mm")}
                    </span>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="relative">
                  <button
                    onClick={(e) => toggleMenu(run.id, e)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Actions"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {openMenuId === run.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(null);
                        }}
                      />

                      {/* Menu dropdown */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                        {run.status === "running" && (
                          <button
                            onClick={(e) => handleForceFail(run.id, e)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                          >
                            <XCircle size={16} />
                            Marquer comme échoué
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(run.id, e)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {run.totalTests > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                      style={{
                        width: `${(run.passedTests / run.totalTests) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-600 mb-1">Total Tests</p>
                  <p className="text-xl font-bold text-gray-900">
                    {run.totalTests}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-emerald-600 mb-1">Passed</p>
                  <p className="text-xl font-bold text-emerald-900">
                    {run.passedTests}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 border border-red-100">
                  <p className="text-xs text-red-600 mb-1">Failed</p>
                  <p className="text-xl font-bold text-red-900">
                    {run.failedTests}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-xs text-amber-600 mb-1">Duration</p>
                  <p className="text-xl font-bold text-amber-900">
                    {run.duration
                      ? `${(run.duration / 1000).toFixed(1)}s`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {(run.branch || run.environment) && (
                <div className="flex gap-2 flex-wrap">
                  {run.branch && (
                    <span className="badge badge-info">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {run.branch}
                    </span>
                  )}
                  {run.environment && (
                    <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {run.environment}
                    </span>
                  )}
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>

      {/* Empty State - No Results from Filters */}
      {testRuns.length > 0 && filteredAndSortedRuns.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-slate-100 rounded-2xl mb-6">
            <XCircle className="text-gray-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            No test runs match your filters
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Try adjusting your search or filter criteria to see more results.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setEnvironmentFilter("all");
              setSortBy("newest");
            }}
            className="btn-primary"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Empty State - No Test Runs */}
      {testRuns.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl mb-6">
            <Play className="text-indigo-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No test runs yet
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start running your Playwright tests with Dashwright to see beautiful
            insights and analytics here.
          </p>
          <a
            href="https://github.com/CybeDefend/Dashwright"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-block"
          >
            View Documentation
          </a>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            type: null,
            runId: null,
            runName: "",
          })
        }
        onConfirm={handleConfirmAction}
        title={
          confirmModal.type === "delete"
            ? "Delete Test Run"
            : "Mark Test Run as Failed"
        }
        message={
          confirmModal.type === "delete"
            ? `Are you sure you want to permanently delete "${confirmModal.runName}"? This action cannot be undone.`
            : `Are you sure you want to mark "${confirmModal.runName}" as failed?`
        }
        confirmText={
          confirmModal.type === "delete" ? "Delete" : "Mark as Failed"
        }
        type={confirmModal.type === "delete" ? "danger" : "warning"}
      />
    </div>
  );
}
