import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

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
  createdAt: string;
}

const TestRunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTestRun = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/test-runs/${id}`);
        setTestRun(response.data);
      } catch (err: any) {
        console.error('Failed to fetch test run:', err);
        setError(err.response?.data?.message || 'Failed to load test run');
      } finally {
        setLoading(false);
      }
    };

    fetchTestRun();
  }, [id]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
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

        {/* Artifacts */}
        {testRun.artifacts && testRun.artifacts.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
            <h2 className="text-2xl font-bold mb-6">Artifacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testRun.artifacts.map((artifact) => (
                <div
                  key={artifact.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{artifact.type}</span>
                    <span className="text-xs text-gray-500">
                      {(artifact.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {artifact.testName && (
                    <p className="text-sm text-gray-600 mb-2">{artifact.testName}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate">{artifact.filename}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Artifacts Message */}
        {(!testRun.artifacts || testRun.artifacts.length === 0) && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60 text-center">
            <p className="text-gray-500">Aucun artifact disponible pour ce test run</p>
            <p className="text-sm text-gray-400 mt-2">
              Les screenshots, vidéos et traces apparaîtront ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRunDetailPage;
