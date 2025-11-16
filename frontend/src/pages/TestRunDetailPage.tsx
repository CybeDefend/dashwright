import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import NativeTraceViewer from '../components/NativeTraceViewer';

interface TestRun {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed';
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
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [artifactUrl, setArtifactUrl] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [traceToView, setTraceToView] = useState<{ url: string; filename: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTestRun = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/test-runs/${id}`);
        setTestRun(response.data);
        
        // Debug: Log artifacts to see if traces are present
        console.log('📊 Test Run Artifacts:', response.data.artifacts);
        console.log('📊 Trace artifacts:', response.data.artifacts?.filter((a: Artifact) => a.type === 'trace'));
        
        // Auto-expand first test if available
        if (response.data.artifacts && response.data.artifacts.length > 0) {
          const firstTestName = response.data.artifacts[0].testName;
          if (firstTestName) {
            setExpandedTest(firstTestName);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch test run:', err);
        setError(err.response?.data?.message || 'Failed to load test run');
      } finally {
        setLoading(false);
      }
    };

    fetchTestRun();
  }, [id]);

  useEffect(() => {
    const fetchArtifactUrl = async () => {
      if (!selectedArtifact) {
        setArtifactUrl(null);
        return;
      }

      try {
        const response = await apiClient.get(`/artifacts/${selectedArtifact.id}/download-url`);
        setArtifactUrl(response.data.url);
      } catch (err) {
        console.error('Failed to fetch artifact URL:', err);
        setArtifactUrl(null);
      }
    };

    fetchArtifactUrl();
  }, [selectedArtifact]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupArtifactsByTest = (artifacts: Artifact[]): GroupedArtifacts => {
    return artifacts.reduce((acc, artifact) => {
      const testName = artifact.testName || 'Sans nom de test';
      if (!acc[testName]) {
        acc[testName] = [];
      }
      acc[testName].push(artifact);
      return acc;
    }, {} as GroupedArtifacts);
  };

  const openArtifactViewer = async (artifact: Artifact) => {
    // For traces, open the interactive viewer
    if (artifact.type === 'trace') {
      try {
        const response = await apiClient.get(`/artifacts/${artifact.id}/download-url`);
        setTraceToView({
          url: response.data.url,
          filename: artifact.filename,
        });
      } catch (err) {
        console.error('Error fetching trace URL:', err);
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

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'screenshot':
        return '📸';
      case 'video':
        return '🎥';
      case 'log':
        return '📄';
      case 'trace':
        return '📊';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !testRun) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60 text-center">
            <p className="text-red-600 mb-4">{error || 'Test run not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    running: 'bg-blue-100 text-blue-800',
    passed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const successRate = testRun.totalTests > 0 
    ? Math.round((testRun.passedTests / testRun.totalTests) * 100) 
    : 0;

  const groupedArtifacts = testRun.artifacts ? groupArtifactsByTest(testRun.artifacts) : {};
  const testNames = Object.keys(groupedArtifacts).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[testRun.status]}`}>
            {testRun.status === 'running' ? '⏳ En cours' : testRun.status === 'passed' ? '✅ Réussi' : '❌ Échoué'}
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
                  <span className="text-gray-500">⊝ {testRun.skippedTests}</span>
                )}
              </div>
            </div>

            {/* Success Rate */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Taux de réussite</p>
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
              <p className="text-sm text-gray-500">Durée</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{formatDuration(testRun.duration)}</span>
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
                  <p className="text-sm text-gray-500">Environnement</p>
                  <p className="font-medium">{testRun.environment}</p>
                </div>
              )}
              {testRun.branch && (
                <div>
                  <p className="text-sm text-gray-500">Branche</p>
                  <p className="font-medium">{testRun.branch}</p>
                </div>
              )}
              {testRun.commit && (
                <div>
                  <p className="text-sm text-gray-500">Commit</p>
                  <p className="font-mono text-sm">{testRun.commit.substring(0, 8)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tests List - Accordion Style */}
        {testNames.length > 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
            <h2 className="text-2xl font-bold mb-6">Tests exécutés ({testNames.length})</h2>
            <div className="space-y-3">
              {testNames.map((testName) => {
                const artifacts = groupedArtifacts[testName];
                const screenshots = artifacts.filter(a => a.type === 'screenshot');
                const videos = artifacts.filter(a => a.type === 'video');
                const traces = artifacts.filter(a => a.type === 'trace');
                const others = artifacts.filter(a => !['screenshot', 'video', 'trace'].includes(a.type));
                const isExpanded = expandedTest === testName;

                return (
                  <div key={testName} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Test Header - Clickable */}
                    <button
                      onClick={() => toggleTest(testName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <span className="text-xl text-green-500">✓</span>
                        {/* Test Name */}
                        <h3 className="text-lg font-semibold text-gray-800 text-left">{testName}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Artifact Counts */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {screenshots.length > 0 && <span>📸 {screenshots.length}</span>}
                          {videos.length > 0 && <span>🎥 {videos.length}</span>}
                          {traces.length > 0 && <span className="font-semibold text-purple-600">📊 {traces.length}</span>}
                          {others.length > 0 && <span>📎 {others.length}</span>}
                        </div>
                        {/* Chevron Icon */}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Test Details - Expandable */}
                    {isExpanded && (
                      <div className="p-6 pt-2 border-t border-gray-200 bg-gray-50/50">
                        <div className="space-y-4">
                          {/* Screenshots */}
                          {screenshots.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">📸 Screenshots ({screenshots.length})</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                              <p className="text-sm font-medium text-gray-600 mb-2">🎥 Vidéos ({videos.length})</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <p className="text-sm font-semibold text-purple-700 mb-2">📊 Traces ({traces.length})</p>
                              <div className="space-y-2">
                                {traces.map((artifact) => (
                                  <div
                                    key={artifact.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-purple-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">📊</span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{artifact.filename}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(artifact.size)}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => openArtifactViewer(artifact)}
                                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded transition-colors font-medium"
                                    >
                                      Voir
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other Artifacts */}
                          {others.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-600 mb-2">📎 Autres ({others.length})</p>
                              <div className="space-y-2">
                                {others.map((artifact) => (
                                  <div
                                    key={artifact.id}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{getArtifactIcon(artifact.type)}</span>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">{artifact.filename}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(artifact.size)}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => openArtifactViewer(artifact)}
                                      className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    >
                                      Voir
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
            <p className="text-gray-500">Aucun artifact disponible pour ce test run</p>
            <p className="text-sm text-gray-400 mt-2">
              Les screenshots, vidéos et traces apparaîtront ici
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
                <span className="text-2xl">{getArtifactIcon(selectedArtifact.type)}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedArtifact.filename}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedArtifact.testName} • {formatFileSize(selectedArtifact.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeViewer}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {artifactUrl ? (
                selectedArtifact.type === 'screenshot' ? (
                  <img
                    src={artifactUrl}
                    alt={selectedArtifact.filename}
                    className="w-full h-auto rounded-lg"
                  />
                ) : selectedArtifact.type === 'video' ? (
                  <video
                    src={artifactUrl}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Aperçu non disponible pour ce type de fichier</p>
                    {selectedArtifact.type === 'trace' && (
                      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg text-sm text-left max-w-md mx-auto">
                        <p className="font-semibold text-purple-900 mb-2">📊 Comment ouvrir cette trace :</p>
                        <ol className="list-decimal list-inside space-y-1 text-purple-800">
                          <li>Téléchargez le fichier trace.zip</li>
                          <li>Ouvrez un terminal</li>
                          <li>Exécutez : <code className="bg-purple-100 px-2 py-0.5 rounded">npx playwright show-trace trace.zip</code></li>
                        </ol>
                        <p className="mt-2 text-purple-700 text-xs">
                          Cela ouvrira une interface interactive pour explorer tous les détails de l'exécution du test.
                        </p>
                      </div>
                    )}
                    <a
                      href={artifactUrl}
                      download={selectedArtifact.filename}
                      className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Télécharger
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
    </div>
  );
};

export default TestRunDetailPage;
