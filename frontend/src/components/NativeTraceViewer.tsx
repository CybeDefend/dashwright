import React, { useEffect, useState } from 'react';
import JSZip from 'jszip';

interface NativeTraceViewerProps {
  traceUrl: string;
  filename: string;
  onClose: () => void;
}

/**
 * Native Trace Viewer
 * 
 * A custom-built trace viewer that parses Playwright traces
 * and displays them without external dependencies
 */
const NativeTraceViewer: React.FC<NativeTraceViewerProps> = ({ 
  traceUrl, 
  filename, 
  onClose 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'actions' | 'network' | 'console' | 'metadata'>('actions');

  useEffect(() => {
    loadAndParseTrace();
  }, [traceUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadAndParseTrace = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the trace zip file
      const response = await fetch(traceUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch trace');
      }

      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);

      console.log('📊 Trace ZIP contents:', Object.keys(zip.files));

      const parsedTrace = {
        actions: [] as any[],
        network: [] as any[],
        console: [] as any[],
        metadata: {} as any,
        stacks: {} as any,
        resources: {} as any,
      };

      // Parse main trace file (actions + console)
      const mainTraceFile = zip.file('0-trace.trace') || zip.file('trace.trace');
      if (mainTraceFile) {
        const traceContent = await mainTraceFile.async('string');
        console.log('📊 Main trace preview:', traceContent.substring(0, 300));
        
        const traceLines = traceContent.split('\n').filter((line: string) => line.trim());
        for (const line of traceLines) {
          try {
            const entry = JSON.parse(line);
            
            // Separate console logs from actions
            if (entry.type === 'console') {
              parsedTrace.console.push(entry);
            } else if (entry.type === 'context-options' || entry.platform) {
              parsedTrace.metadata = entry;
            } else if (
              entry.type === 'frame-snapshot' || 
              entry.type === 'resource-snapshot' ||
              entry.type === 'screencast-frame' ||
              entry.type === 'log'
            ) {
              // Skip internal entries - not user actions
              continue;
            } else if (entry.type || entry.callId) {
              parsedTrace.actions.push(entry);
            }
          } catch (err) {
            console.warn('Failed to parse trace line:', err);
          }
        }
      }

      // Parse network trace
      const networkFile = zip.file('0-trace.network') || zip.file('trace.network');
      if (networkFile) {
        const networkContent = await networkFile.async('string');
        const networkLines = networkContent.split('\n').filter((line: string) => line.trim());
        for (const line of networkLines) {
          try {
            const entry = JSON.parse(line);
            if (entry.method || entry.url) {
              parsedTrace.network.push(entry);
            }
          } catch (err) {
            console.warn('Failed to parse network line:', err);
          }
        }
      }

      // Parse stacks file
      const stacksFile = zip.file('0-trace.stacks');
      if (stacksFile) {
        const stacksContent = await stacksFile.async('string');
        const stacksLines = stacksContent.split('\n').filter((line: string) => line.trim());
        for (const line of stacksLines) {
          try {
            const entry = JSON.parse(line);
            if (entry.id) {
              parsedTrace.stacks[entry.id] = entry.frames || [];
            }
          } catch (err) {
            console.warn('Failed to parse stack line:', err);
          }
        }
      }

      // Extract resources (screenshots)
      const resourceFiles = Object.keys(zip.files).filter(name => name.startsWith('resources/page@'));
      for (const resourceName of resourceFiles) {
        const file = zip.file(resourceName);
        if (file) {
          const blob = await file.async('blob');
          const url = URL.createObjectURL(blob);
          parsedTrace.resources[resourceName] = url;
        }
      }

      // Match stacks with actions
      parsedTrace.actions = parsedTrace.actions.map((action: any) => {
        if (action.stack && Array.isArray(action.stack) && action.stack.length > 0) {
          // If stack is just IDs, resolve them
          const stackId = action.stack[0];
          if (typeof stackId === 'number' && parsedTrace.stacks[stackId]) {
            return { ...action, stack: parsedTrace.stacks[stackId] };
          }
        }
        return action;
      });

      console.log('📊 Parsed trace:', {
        actions: parsedTrace.actions.length,
        network: parsedTrace.network.length,
        console: parsedTrace.console.length,
        stacks: Object.keys(parsedTrace.stacks).length,
        resources: Object.keys(parsedTrace.resources).length,
        metadata: parsedTrace.metadata
      });

      // Log samples for debugging
      if (parsedTrace.actions.length > 0) {
        console.log('📊 Sample action:', parsedTrace.actions[0]);
        // Check if there are console entries in actions
        const consoleInActions = parsedTrace.actions.filter((a: any) => 
          a.type === 'console' || a.method === 'console'
        );
        if (consoleInActions.length > 0) {
          console.log('⚠️ Console entries found in actions:', consoleInActions.length);
          console.log('⚠️ First console in actions:', consoleInActions[0]);
        }
      }
      if (parsedTrace.network.length > 0) {
        console.log('📊 Sample network:', parsedTrace.network[0]);
      }
      if (parsedTrace.console.length > 0) {
        console.log('📊 Sample console:', parsedTrace.console[0]);
        console.log('📊 All console entries:', parsedTrace.console);
      }

      setTrace(parsedTrace);
      setLoading(false);
    } catch (err) {
      console.error('Error loading trace:', err);
      setError(`Failed to load trace: ${err instanceof Error ? err.message : 'Invalid or corrupted file'}`);
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Native Trace Viewer</h3>
            <p className="text-sm text-gray-400">{filename}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          title="Close (Esc)"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading trace...</p>
              <p className="text-gray-400 text-sm mt-2">Extracting and analyzing data</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="text-red-400 text-6xl mb-6">⚠️</div>
              <h3 className="text-white text-xl font-semibold mb-3">Loading Error</h3>
              <p className="text-gray-400 text-sm mb-8">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={loadAndParseTrace}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && trace && (
          <>
            {/* Tabs */}
            <div className="w-full flex flex-col">
              <div className="flex border-b border-gray-700 bg-gray-800">
                {[
                  { key: 'actions', label: 'Actions', count: trace.actions.length },
                  { key: 'network', label: 'Network', count: trace.network.length },
                  { key: 'console', label: 'Console', count: trace.console.length },
                  { key: 'metadata', label: 'Metadata', count: null },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-white border-b-2 border-purple-500 bg-gray-750'
                        : 'text-gray-400 hover:text-white hover:bg-gray-750'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-700">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-6">
                {activeTab === 'actions' && (
                  <div className="space-y-3">
                    {trace.actions.length === 0 ? (
                      <p className="text-gray-400 text-center py-12">No actions recorded</p>
                    ) : (
                      trace.actions.map((action: any, index: number) => {
                        const isExpanded = selectedAction === index;
                        const actionName = action.apiName || action.method || action.type || 'Unknown';
                        
                        return (
                          <div
                            key={index}
                            className={`rounded-lg border transition-all ${
                              isExpanded
                                ? 'bg-purple-900/20 border-purple-500'
                                : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                            }`}
                          >
                            <div
                              className="p-4 cursor-pointer"
                              onClick={() => setSelectedAction(isExpanded ? -1 : index)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 text-xs rounded font-mono ${
                                    action.type === 'hook' ? 'bg-blue-900/30 text-blue-400' :
                                    action.type === 'fixture' ? 'bg-yellow-900/30 text-yellow-400' :
                                    action.apiName ? 'bg-green-900/30 text-green-400' :
                                    'bg-gray-700 text-gray-400'
                                  }`}>
                                    {action.type || 'action'}
                                  </span>
                                  <span className="text-white font-medium">
                                    {actionName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {action.startTime && (
                                    <span className="text-xs text-gray-500">
                                      {formatTimestamp(action.startTime)}
                                    </span>
                                  )}
                                  {action.duration && (
                                    <span className="text-xs text-gray-400">
                                      {formatDuration(action.duration)}
                                    </span>
                                  )}
                                  <svg 
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Quick preview when collapsed */}
                              {!isExpanded && action.params && Object.keys(action.params).length > 0 && (
                                <div className="mt-2 text-sm text-gray-500 font-mono truncate">
                                  {Object.entries(action.params).slice(0, 3).map(([key, value]) => (
                                    <span key={key} className="mr-3">
                                      {key}: {typeof value === 'string' ? `"${value.substring(0, 30)}"` : JSON.stringify(value).substring(0, 30)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50 pt-3">
                                {/* Screenshots */}
                                {action.afterSnapshot && trace.resources[action.afterSnapshot] && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Screenshot</h4>
                                    <img 
                                      src={trace.resources[action.afterSnapshot]} 
                                      alt="Action screenshot" 
                                      className="rounded border border-gray-700 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(trace.resources[action.afterSnapshot], '_blank')}
                                    />
                                  </div>
                                )}
                                
                                {action.params && Object.keys(action.params).length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Parameters</h4>
                                    <div className="bg-gray-900/50 rounded p-3 overflow-auto max-h-60">
                                      <pre className="text-xs text-gray-300 font-mono">
                                        {JSON.stringify(action.params, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {action.result && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Result</h4>
                                    <div className="bg-gray-900/50 rounded p-3 overflow-auto max-h-40">
                                      <pre className="text-xs text-gray-300 font-mono">
                                        {JSON.stringify(action.result, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {action.error && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-red-400 mb-2">Error</h4>
                                    <div className="bg-red-900/20 border border-red-800 rounded p-3">
                                      <pre className="text-xs text-red-300 font-mono">
                                        {JSON.stringify(action.error, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {action.stack && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Stack Trace</h4>
                                    <div className="bg-gray-900/50 rounded p-3 overflow-auto max-h-40">
                                      {typeof action.stack === 'string' ? (
                                        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                                          {action.stack}
                                        </pre>
                                      ) : Array.isArray(action.stack) && action.stack.length > 0 ? (
                                        <div className="space-y-1">
                                          {action.stack.map((frame: any, idx: number) => (
                                            <div key={idx} className="text-xs font-mono flex gap-2 hover:bg-gray-800/50 p-1 rounded">
                                              <span className="text-gray-600 w-6 text-right">{idx + 1}</span>
                                              <div className="flex-1">
                                                {frame.function && (
                                                  <span className="text-purple-400 font-semibold">{frame.function}</span>
                                                )}
                                                {frame.file && (
                                                  <div className="text-gray-500 mt-0.5">
                                                    {'at '}
                                                    <span className="text-blue-400">{frame.file.split('/').pop()}</span>
                                                    {frame.line && <span className="text-gray-600">:{frame.line}</span>}
                                                    {frame.column && <span className="text-gray-600">:{frame.column}</span>}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                                          {JSON.stringify(action.stack, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex gap-4 text-xs text-gray-500">
                                  {action.wallTime && (
                                    <span>Wall Time: {new Date(action.wallTime).toISOString()}</span>
                                  )}
                                  {action.pageId && (
                                    <span>Page: {action.pageId}</span>
                                  )}
                                  {action.frameId && (
                                    <span>Frame: {action.frameId}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === 'network' && (
                  <div className="space-y-2">
                    {trace.network.length === 0 ? (
                      <p className="text-gray-400 text-center py-12">No network requests recorded</p>
                    ) : (
                      trace.network.map((req: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-750 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                req.method === 'GET' ? 'bg-blue-900/30 text-blue-400' :
                                req.method === 'POST' ? 'bg-green-900/30 text-green-400' :
                                req.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                                req.method === 'DELETE' ? 'bg-red-900/30 text-red-400' :
                                'bg-gray-700 text-gray-400'
                              }`}>
                                {req.method || 'GET'}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded font-mono ${
                                req.status < 300 ? 'bg-green-900/30 text-green-400' :
                                req.status < 400 ? 'bg-yellow-900/30 text-yellow-400' :
                                req.status >= 400 ? 'bg-red-900/30 text-red-400' :
                                'bg-gray-700 text-gray-400'
                              }`}>
                                {req.status || '---'}
                              </span>
                            </div>
                            {req.timing?.responseEnd && req.timing?.requestStart && (
                              <span className="text-xs text-gray-500">
                                {Math.round(req.timing.responseEnd - req.timing.requestStart)}ms
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 font-mono break-all">
                            {req.url}
                          </div>
                          {req.resourceType && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-gray-500">Type: {req.resourceType}</span>
                              {req.sizes?.responseBodySize && (
                                <span className="text-xs text-gray-500">
                                  • Size: {(req.sizes.responseBodySize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'console' && (
                  <div className="space-y-2">
                    {trace.console.length === 0 ? (
                      <p className="text-gray-400 text-center py-12">No console logs recorded</p>
                    ) : (
                      trace.console.map((log: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded font-medium uppercase ${
                              log.messageType === 'error' ? 'bg-red-900/30 text-red-400' :
                              log.messageType === 'warning' || log.messageType === 'warn' ? 'bg-yellow-900/30 text-yellow-400' :
                              log.messageType === 'info' ? 'bg-blue-900/30 text-blue-400' :
                              log.messageType === 'debug' ? 'bg-purple-900/30 text-purple-400' :
                              'bg-gray-700 text-gray-400'
                            }`}>
                              {log.messageType || 'log'}
                            </span>
                            {log.time && (
                              <span className="text-xs text-gray-500">
                                {log.time.toFixed(2)}ms
                              </span>
                            )}
                            {log.location && (
                              <span className="text-xs text-gray-500 font-mono">
                                {log.location.url?.split('/').pop() || log.location.url}:{log.location.lineNumber}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-all">
                            {(() => {
                              const message = log.text || log.message;
                              if (typeof message === 'string') {
                                return message;
                              } else if (message !== undefined) {
                                return JSON.stringify(message, null, 2);
                              } else if (log.args) {
                                return Array.isArray(log.args) 
                                  ? log.args.map((arg: any) => 
                                      typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)
                                    ).join(' ')
                                  : JSON.stringify(log.args, null, 2);
                              }
                              return JSON.stringify(log, null, 2);
                            })()}
                          </div>
                          {log.stack && (
                            <div className="mt-2 text-xs text-gray-500 font-mono whitespace-pre-wrap">
                              {typeof log.stack === 'string' 
                                ? log.stack 
                                : JSON.stringify(log.stack, null, 2)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'metadata' && (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <pre className="text-sm text-gray-300 font-mono overflow-auto">
                      {JSON.stringify(trace.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Bar */}
      {!loading && !error && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-6">
              <span>Dashwright Native Viewer</span>
              <span className="text-gray-600">|</span>
              <span>Format: Playwright Trace v1</span>
            </div>
            <span>Press <kbd className="px-2 py-0.5 bg-gray-700 rounded">Esc</kbd> to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NativeTraceViewer;
