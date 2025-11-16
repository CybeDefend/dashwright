import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import apiClient from '../services/api';
import { wsService } from '../services/websocket';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchTestRuns();
    }

    // Connect WebSocket for real-time updates
    if (!wsConnected.current) {
      wsConnected.current = true;
      wsService.connect();
      
      wsService.on('test-run:created', (newRun: TestRun) => {
        setTestRuns((prev) => [newRun, ...prev]);
      });

      wsService.on('test-run:updated', (updatedRun: TestRun) => {
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
      const response = await apiClient.get('/test-runs');
      setTestRuns(response.data);
    } catch (error) {
      console.error('Failed to fetch test runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'running':
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      default:
        return <Play className="text-gray-500" size={20} />;
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading test runs...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Stats */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Test Runs</h1>
          <p className="text-gray-600">Monitor your Playwright test executions in real-time</p>
        </div>

        {/* Quick Stats */}
        {testRuns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Runs</p>
                  <p className="text-2xl font-bold text-emerald-900">{testRuns.length}</p>
                </div>
                <CheckCircle className="text-emerald-500" size={32} />
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Running</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {testRuns.filter(r => r.status === 'running').length}
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
                    {testRuns.filter(r => r.status === 'passed').length}
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
                    {testRuns.filter(r => r.status === 'failed').length}
                  </p>
                </div>
                <XCircle className="text-red-500" size={32} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Runs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testRuns.map((run, index) => (
          <Link
            key={run.id}
            to={`/runs/${run.id}`}
            className="card hover:scale-[1.02] transition-all duration-200 cursor-pointer group animate-scale-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(run.status)}
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {run.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {format(new Date(run.createdAt), 'MMM d, yyyy • HH:mm')}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {run.totalTests > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                    style={{ width: `${(run.passedTests / run.totalTests) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-600 mb-1">Total Tests</p>
                <p className="text-xl font-bold text-gray-900">{run.totalTests}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">Passed</p>
                <p className="text-xl font-bold text-emerald-900">{run.passedTests}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-3 border border-red-100">
                <p className="text-xs text-red-600 mb-1">Failed</p>
                <p className="text-xl font-bold text-red-900">{run.failedTests}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-3 border border-amber-100">
                <p className="text-xs text-amber-600 mb-1">Duration</p>
                <p className="text-xl font-bold text-amber-900">
                  {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : 'N/A'}
                </p>
              </div>
            </div>

            {(run.branch || run.environment) && (
              <div className="flex gap-2 flex-wrap">
                {run.branch && (
                  <span className="badge badge-info">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {run.branch}
                  </span>
                )}
                {run.environment && (
                  <span className="badge bg-slate-100 text-slate-700 border-slate-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    {run.environment}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {testRuns.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl mb-6">
            <Play className="text-indigo-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No test runs yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start running your Playwright tests with Dashwright to see beautiful insights and analytics here.
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
    </div>
  );
}
