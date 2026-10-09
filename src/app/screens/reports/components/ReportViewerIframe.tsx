"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Printer,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  Download,
} from "lucide-react";

interface ReportViewerIframeProps {
  blob: Blob | null;
  reportName: string;
  fileType: "pdf" | "xlsx";
  onClose: () => void;
}

export default function ReportViewerIframe({
  blob,
  reportName,
  fileType,
  onClose,
}: ReportViewerIframeProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setObjectUrl(null);
    }
  }, [blob]);

  if (!blob || !objectUrl) return null;

  const handleOpenNewTab = () => {
    if (objectUrl) {
      window.open(objectUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (!objectUrl) return;
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${reportName.replace(/\s+/g, "_")}.${fileType}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 transition-all duration-200 animate-in fade-in ${
        isFullScreen ? "p-0" : "p-4 sm:p-6"
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col w-full border border-slate-200 transition-all ${
          isFullScreen ? "h-full rounded-none" : "max-w-5xl h-[85vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{reportName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 uppercase font-semibold">
                  {fileType} Preview
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Interactive Viewer • {fileType.toUpperCase()} Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5 px-2.5"
              title="Download File"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5 px-2.5"
              title="Open in New Tab"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">New Tab</span>
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-600/80 transition-colors ml-1"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF/Excel Iframe Display Container per PDF Section 8 */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe
            src={objectUrl}
            title={reportName}
            className="w-full h-full border-0"
            style={{ width: "100%", height: "100%", minHeight: "500px" }}
          />
        </div>
      </div>
    </div>
  );
}
