import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../services/apiClient";
import NativeTraceViewer from "../components/NativeTraceViewer";
import ConfirmModal from "../components/ConfirmModal";
import { wsService } from "../services/websocket";

interface TestRun {
  id: string;
  name: string;
  status: "running" | "passed" | "failed";
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  startedAt: string;
  finishedAt: string | null;
  environment?: string;
  branch?: string;
  commit?: string;
  createdAt: string;
  artifacts?: Artifact[];
  tests?: Test[];
}

interface Test {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped" | "flaky";
  duration: number;
  errorMessage?: string;
  errorStack?: string;
  retries: number;
  createdAt: string;
}

interface Artifact {
  id: string;
  type: string;
  filename: string;
  size: number;
  mimeType: string;
  testName?: string;
  storageKey: string;
  createdAt: string;
}

interface GroupedArtifacts {
  [testName: string]: Artifact[];
}

const TestRunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [traceToView, setTraceToView] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const wsConnected = useRef(false);
  const hasFetched = useRef(false);
  
  // Bulk deletion states
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    count: number;
  }>({
    isOpen: false,
    count: 0,
  });

  useEffect(() => {
    if (!id) return;

    const fetchTestRun = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/test-runs/${id}`);
        setTestRun(response.data);

        // Debug: Log artifacts to see if traces are present
        console.log("📊 Test Run Artifacts:", response.data.artifacts);
        console.log(
          "📊 Artifact types:",
          response.data.artifacts?.map((a: Artifact) => a.type)
        );
        console.log(
          "📊 Trace artifacts:",
          response.data.artifacts?.filter((a: Artifact) => a.type === "trace")
        );
        console.log(
          "📊 Log artifacts:",
          response.data.artifacts?.filter((a: Artifact) => a.type === "log")
        );
      } catch (err: any) {
        console.error("Failed to fetch test run:", err);
        setError(err.response?.data?.message || "Failed to load test run");
      } finally {
        setLoading(false);
      }
    };

    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTestRun();
    }

    // Connect WebSocket for real-time updates
    if (!wsConnected.current) {
      wsConnected.current = true;
      wsService.connect();

      wsService.on("test-run:updated", (updatedRun: TestRun) => {
        // Only update if this is the test run we're viewing
        if (updatedRun.id === id) {
          setTestRun((prev) => {
            if (!prev) return updatedRun;
            // Preserve artifacts if not included in the update
            return {
              ...updatedRun,
              artifacts: updatedRun.artifacts || prev.artifacts,
            };
          });
        }
      });
    }

    return () => {
      if (wsConnected.current) {
        wsService.disconnect();
        wsConnected.current = false;
      }
    };
  }, [id]);

  useEffect(() => {
    const fetchArtifactUrl = async () => {
      if (!selectedArtifact) {
        setArtifactUrl(null);
        return;
      }

      try {
        const response = await apiClient.get(
          `/artifacts/${selectedArtifact.id}/download-url`
        );
        setArtifactUrl(response.data.url);
      } catch (err) {
        console.error("Failed to fetch artifact URL:", err);
        setArtifactUrl(null);
      }
    };

    fetchArtifactUrl();
  }, [selectedArtifact]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupArtifactsByTest = (artifacts: Artifact[]): GroupedArtifacts => {
    return artifacts.reduce((acc, artifact) => {
      const testName = artifact.testName || "Unnamed test";
      if (!acc[testName]) {
        acc[testName] = [];
      }
      acc[testName].push(artifact);
      return acc;
    }, {} as GroupedArtifacts);
  };

  const openArtifactViewer = async (artifact: Artifact) => {
    // For traces, open the interactive viewer
    if (artifact.type === "trace") {
      try {
        const response = await apiClient.get(
          `/artifacts/${artifact.id}/download-url`
        );
        setTraceToView({
          url: response.data.url,
          filename: artifact.filename,
        });
      } catch (err) {
        console.error("Error fetching trace URL:", err);
      }
    } else {
      // For other artifacts, use the standard viewer
      setSelectedArtifact(artifact);
    }
  };

  const closeViewer = () => {
    setSelectedArtifact(null);
    setArtifactUrl(null);
  };

  const closeTraceViewer = () => {
    setTraceToView(null);
  };

  const toggleTest = (testName: string) => {
    setExpandedTest(expandedTest === testName ? null : testName);
  };

  // Bulk deletion functions
  const toggleTestSelection = (testId: string) => {
    setSelectedTestIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!testRun?.tests) return;
    
    const filteredTests = testRun.tests.filter((test) =>
      test.name.toLowerCase().includes(testSearchQuery.toLowerCase())
    );
    
    if (selectedTestIds.size === filteredTests.length && filteredTests.length > 0) {
      // Deselect all
      setSelectedTestIds(new Set());
    } else {
      // Select all filtered tests
      setSelectedTestIds(new Set(filteredTests.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    setDeleteConfirmModal({
      isOpen: true,
      count: selectedTestIds.size,
    });
  };

  const confirmDeleteTests = async () => {
    if (!id || selectedTestIds.size === 0) return;

    try {
      await apiClient.delete(`/test-runs/${id}/tests`, {
        data: { testIds: Array.from(selectedTestIds) },
      });
      
      // Clear selection
      setSelectedTestIds(new Set());
      setDeleteConfirmModal({ isOpen: false, count: 0 });
      
      // Refetch test run to update the list
      const response = await apiClient.get(`/test-runs/${id}`);
      setTestRun(response.data);
    } catch (err: any) {
      console.error("Failed to delete tests:", err);
      alert("Failed to delete tests. Please try again.");
    }
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case "screenshot":
        return "📸";
      case "video":
        return "🎥";
      case "log":
        return "📄";
      case "trace":
        return "📊";
      default:
        return "📎";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !testRun) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60 text-center">
            <p className="text-red-600 mb-4">{error || "Test run not found"}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    running: "bg-blue-100 text-blue-800",
    passed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  const successRate =
    testRun.totalTests > 0
      ? Math.round((testRun.passedTests / testRun.totalTests) * 100)
      : 0;

  const groupedArtifacts = testRun.artifacts
    ? groupArtifactsByTest(testRun.artifacts)
    : {};
  const testNames = Object.keys(groupedArtifacts).sort();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusColors[testRun.status]
            }`}
          >
            {testRun.status === "running"
              ? "⏳ Running"
              : testRun.status === "passed"
              ? "✅ Passed"
              : "❌ Failed"}
          </span>
        </div>

        {/* Main Info Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            {testRun.name}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Tests Summary */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Tests</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{testRun.totalTests}</span>
                <span className="text-sm text-gray-500">total</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">✓ {testRun.passedTests}</span>
                <span className="text-red-600">✗ {testRun.failedTests}</span>
                {testRun.skippedTests > 0 && (
                  <span className="text-gray-500">
                    ⊝ {testRun.skippedTests}
                  </span>
                )}
              </div>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Success Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{successRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Duration</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {formatDuration(testRun.duration)}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDate(testRun.startedAt)}
              </p>
            </div>
          </div>

          {/* Metadata */}
          {(testRun.environment || testRun.branch || testRun.commit) && (
            <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {testRun.environment && (
                <div>
                  <p className="text-sm text-gray-500">Environment</p>
                  <p className="font-medium">{testRun.environment}</p>
                </div>
              )}
              {testRun.branch && (
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="font-medium">{testRun.branch}</p>
                </div>
              )}
              {testRun.commit && (
                <div>
                  <p className="text-sm text-gray-500">Commit</p>
                  <p className="font-mono text-sm">
                    {testRun.commit.substring(0, 8)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Individual Tests Results */}
        {testRun.tests && testRun.tests.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Test Results ({testRun.tests.length})
              </h2>
              {selectedTestIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Selected ({selectedTestIds.size})
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tests by name..."
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedTestIds.size > 0 &&
                          selectedTestIds.size ===
                            testRun.tests.filter((test) =>
                              test.name.toLowerCase().includes(testSearchQuery.toLowerCase())
                            ).length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Test Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Duration
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testRun.tests
                    .filter((test) =>
                      test.name.toLowerCase().includes(testSearchQuery.toLowerCase())
                    )
                    .map((test) => (
                    <tr
                      key={test.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedTestIds.has(test.id)}
                          onChange={() => toggleTestSelection(test.id)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        {test.status === "passed" && (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <span className="text-lg">✓</span>
                            <span className="text-sm font-medium">
                              Passed
                            </span>
                          </span>
                        )}
                        {test.status === "failed" && (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <span className="text-lg">✗</span>
                            <span className="text-sm font-medium">
                              Failed
                            </span>
                          </span>
                        )}
                        {test.status === "skipped" && (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <span className="text-lg">○</span>
                            <span className="text-sm font-medium">
                              Skipped
                            </span>
                          </span>
                        )}
                        {test.status === "flaky" && (
                          <span className="inline-flex items-center gap-1 text-yellow-600">
                            <span className="text-lg">⚠</span>
                            <span className="text-sm font-medium">
                              Flaky
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">
                            {test.name}
                          </span>
                          {test.errorMessage && (
                            <span className="text-xs text-red-500 mt-1">
                              {test.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDuration(test.duration)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(test.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-400">
                          {test.id.substring(0, 8)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tests List - Accordion Style */}
        {testNames.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
            <h2 className="text-2xl font-bold mb-6">
              Test Artifacts ({testNames.length})
            </h2>
            <div className="space-y-2">
              {testNames.map((testName, index) => {
                const artifacts = groupedArtifacts[testName];
                const screenshots = artifacts.filter(
                  (a) => a.type === "screenshot"
                );
                const videos = artifacts.filter((a) => a.type === "video");
                const traces = artifacts.filter((a) => a.type === "trace");
                const others = artifacts.filter(
                  (a) => !["screenshot", "video", "trace"].includes(a.type)
                );
                const isExpanded = expandedTest === testName;
                const firstArtifact = artifacts[0];
                const testDate = firstArtifact
                  ? formatDate(firstArtifact.createdAt)
                  : "";

                return (
                  <div
                    key={testName}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors"
                  >
                    {/* Test Header - Clickable - More Compact */}
                    <button
                      onClick={() => toggleTest(testName)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors ${
                        isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Test Number */}
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">
                          #{index + 1}
                        </span>
                        {/* Test Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {testName}
                          </h3>
                          <p className="text-xs text-gray-500">{testDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Artifact Counts */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {screenshots.length > 0 && (
                            <span>📸 {screenshots.length}</span>
                          )}
                          {videos.length > 0 && <span>🎥 {videos.length}</span>}
                          {traces.length > 0 && (
                            <span className="font-semibold text-purple-600">
                              📊 {traces.length}
                            </span>
                          )}
                          {others.length > 0 && <span>📎 {others.length}</span>}
                        </div>
                        {/* Chevron Icon */}
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Test Details - Expandable - More Compact */}
                    {isExpanded && (
                      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                        <div className="space-y-3">
                          {/* Screenshots */}
                          {screenshots.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                📸 Screenshots ({screenshots.length})
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                {screenshots.map((artifact) => (
                                  <button
                                    key={artifact.id}
                                    onClick={() => openArtifactViewer(artifact)}
                                    className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                                      <span className="text-4xl">📸</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {formatFileSize(artifact.size)}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {videos.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                🎥 Videos ({videos.length})
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                                {videos.map((artifact) => (
                                  <button
                                    key={artifact.id}
                                    onClick={() => openArtifactViewer(artifact)}
                                    className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                      <span className="text-4xl">🎥</span>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {formatFileSize(artifact.size)}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Traces - Highlighted */}
                          {traces.length > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                              <p className="text-xs font-semibold text-purple-700 mb-2">
                                📊 Traces ({traces.length})
                              </p>
                              <div className="space-y-2">
                                {traces.map((artifact) => (
                                  <div
                                    key={artifact.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-purple-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">📊</span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">
                                          {artifact.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(artifact.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        openArtifactViewer(artifact)
                                      }
                                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded transition-colors font-medium"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other Artifacts */}
                          {others.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-2">
                                📎 Other ({others.length})
                              </p>
                              <div className="space-y-2">
                                {others.map((artifact) => (
                                  <div
                                    key={artifact.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">
                                        {getArtifactIcon(artifact.type)}
                                      </span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">
                                          {artifact.filename}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(artifact.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        openArtifactViewer(artifact)
                                      }
                                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    >
                                      View
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60 text-center">
            <p className="text-gray-500">
              No artifacts available for this test run
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Screenshots, videos and traces will appear here
            </p>
          </div>
        )}
      </div>

      {/* Artifact Viewer Modal */}
      {selectedArtifact && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeViewer}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {getArtifactIcon(selectedArtifact.type)}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedArtifact.filename}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedArtifact.testName} •{" "}
                    {formatFileSize(selectedArtifact.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeViewer}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {artifactUrl ? (
                selectedArtifact.type === "screenshot" ? (
                  <img
                    src={artifactUrl}
                    alt={selectedArtifact.filename}
                    className="w-full h-auto rounded-lg"
                  />
                ) : selectedArtifact.type === "video" ? (
                  <video
                    src={artifactUrl}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      Preview not available for this file type
                    </p>
                    {selectedArtifact.type === "trace" && (
                      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-left max-w-md mx-auto">
                        <p className="font-semibold text-purple-900 mb-2">
                          📊 How to open this trace:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-purple-800">
                          <li>Download the trace.zip file</li>
                          <li>Open a terminal</li>
                          <li>
                            Run:{" "}
                            <code className="bg-purple-100 px-2 py-0.5 rounded">
                              npx playwright show-trace trace.zip
                            </code>
                          </li>
                        </ol>
                        <p className="mt-2 text-purple-700 text-xs">
                          This will open an interactive interface to explore all
                          test execution details.
                        </p>
                      </div>
                    )}
                    <a
                      href={artifactUrl}
                      download={selectedArtifact.filename}
                      className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Download
                    </a>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Native Trace Viewer */}
      {traceToView && (
        <NativeTraceViewer
          traceUrl={traceToView.url}
          filename={traceToView.filename}
          onClose={closeTraceViewer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, count: 0 })}
        onConfirm={confirmDeleteTests}
        title="Delete Tests"
        message={`Are you sure you want to delete ${deleteConfirmModal.count} test${deleteConfirmModal.count > 1 ? "s" : ""}? This will also delete all associated artifacts from storage. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default TestRunDetailPage;
