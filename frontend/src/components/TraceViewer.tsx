import React from "react";

interface TraceViewerProps {
  traceUrl: string;
  filename: string;
  onClose: () => void;
}

/**
 * Interactive Playwright Trace Viewer
 *
 * Embeds trace.playwright.dev in an iframe for interactive trace viewing
 */
const TraceViewer: React.FC<TraceViewerProps> = ({
  traceUrl,
  filename,
  onClose,
}) => {
  const handleDownloadAndView = async () => {
    try {
      // Download the trace file
      const response = await fetch(traceUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch trace");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Open trace viewer in new tab
      window.open(
        "https://trace.playwright.dev/",
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-semibold text-white">
              Playwright Trace Viewer
            </h3>
            <p className="text-sm text-gray-400">{filename}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
          title="Fermer"
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
      <div className="flex-1 relative flex items-center justify-center bg-gray-900">
        <div className="max-w-4xl w-full px-6">
          {/* Embedded iframe */}
          <div
            className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
            style={{ height: "70vh" }}
          >
            <iframe
              src="https://trace.playwright.dev/"
              className="w-full h-full border-0"
              title="Playwright Trace Viewer"
              sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-forms allow-modals"
              allow="clipboard-write"
            />
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
            <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <span>💡</span>
              Comment visualiser la trace :
            </h4>
            <ol className="text-gray-300 space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  1
                </span>
                <span>
                  Cliquez sur le bouton ci-dessous pour télécharger la trace et
                  ouvrir le viewer
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  2
                </span>
                <span>
                  Dans la nouvelle fenêtre, glissez-déposez le fichier
                  téléchargé dans la zone prévue
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  3
                </span>
                <span>
                  Explorez la timeline, les actions, les screenshots, et les
                  requêtes réseau !
                </span>
              </li>
            </ol>
            <button
              onClick={handleDownloadAndView}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-purple-500/50"
            >
              📥 Télécharger la trace et ouvrir le viewer
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-gray-900 border-t border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          💡 Explorez la timeline, les actions, les screenshots, le réseau, et
          plus encore de manière interactive
        </p>
      </div>
    </div>
  );
};

export default TraceViewer;
