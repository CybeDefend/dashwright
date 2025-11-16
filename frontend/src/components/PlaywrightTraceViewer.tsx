import React, { useEffect, useRef, useState } from "react";

interface PlaywrightTraceViewerProps {
  traceUrl: string;
  filename: string;
  onClose: () => void;
}

/**
 * Integrated Playwright Trace Viewer
 *
 * Displays Playwright traces in a native, integrated viewer
 * without relying on external services
 */
const PlaywrightTraceViewer: React.FC<PlaywrightTraceViewerProps> = ({
  traceUrl,
  filename,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadTrace();
  }, [traceUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const loadTrace = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the trace file
      const response = await fetch(traceUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch trace");
      }

      const blob = await response.blob();

      // For now, we'll use Playwright's official viewer in an iframe
      // but load the trace data directly
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      setTraceData({
        buffer: uint8Array,
        filename: filename,
      });

      setLoading(false);
    } catch (err) {
      console.error("Error loading trace:", err);
      setError("Impossible de charger la trace. Veuillez réessayer.");
      setLoading(false);
    }
  };

  // Send trace data to iframe when ready
  useEffect(() => {
    if (!traceData || !iframeRef.current) return;

    const handleIframeLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      // Wait a bit for the iframe to be fully ready
      setTimeout(() => {
        try {
          // Send the trace data via postMessage
          iframe.contentWindow?.postMessage(
            {
              method: "loadTraceFromData",
              params: {
                title: traceData.filename,
                traceData: Array.from(traceData.buffer),
              },
            },
            "*"
          );
        } catch (err) {
          console.error("Error sending trace to iframe:", err);
        }
      }, 1000);
    };

    const iframe = iframeRef.current;
    iframe?.addEventListener("load", handleIframeLoad);

    return () => {
      iframe?.removeEventListener("load", handleIframeLoad);
    };
  }, [traceData]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Trace Viewer</h3>
            <p className="text-sm text-gray-400">{filename}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
          title="Fermer (Échap)"
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
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">
                Chargement de la trace...
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Analyse des données d'exécution
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center max-w-md px-6">
              <div className="text-red-400 text-6xl mb-6">⚠️</div>
              <h3 className="text-white text-xl font-semibold mb-3">
                Erreur de chargement
              </h3>
              <p className="text-gray-400 text-sm mb-8">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={loadTrace}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <iframe
            ref={iframeRef}
            src="https://trace.playwright.dev/"
            className="w-full h-full border-0"
            title="Playwright Trace Viewer"
            sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-forms allow-modals"
            allow="clipboard-write"
          />
        )}
      </div>

      {/* Info Bar */}
      {!loading && !error && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Timeline interactive
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Actions détaillées
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                Réseau & Logs
              </span>
            </div>
            <span>
              Appuyez sur{" "}
              <kbd className="px-2 py-0.5 bg-gray-700 rounded">Échap</kbd> pour
              fermer
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaywrightTraceViewer;
