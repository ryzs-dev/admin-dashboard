"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface MediaPreviewProps {
  mediaId: string;
  onClose: () => void;
  mediaType?: string;
  fileName?: string;
}

export default function MediaPreview({ 
  mediaId, 
  onClose, 
//   mediaType = "image", 
  fileName 
}: MediaPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle escape key press
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchMedia = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`http://localhost:3001/api/whatsapp/media/${mediaId}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch media: ${res.status}`);
        }

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (err) {
        console.error("❌ Failed to load media:", err);
        setError(err instanceof Error ? err.message : "Failed to load media");
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [mediaId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownload = async () => {
    if (!url) return;
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `media-${mediaId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] min-w-[400px] text-white">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-white border-t-transparent"></div>
          </div>
          <p className="mt-4 text-sm opacity-75">Loading media...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] min-w-[400px] text-white">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">Failed to load media</h3>
            <p className="text-sm opacity-75 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (!url) return null;

    return (
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <div className="relative">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg min-h-[400px] min-w-[400px]">
              <div className="animate-pulse text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full"></div>
              </div>
            </div>
          )}
          <Image
            src={url}
            alt={fileName || "Media preview"}
            className={`object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            width={800}
            height={600}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto'
            }}
            priority
            onLoad={() => setImageLoaded(true)}
            onError={() => setError("Failed to display image")}
          />
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2 text-white">
          {fileName && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-sm font-medium truncate max-w-[200px]">{fileName}</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-lg p-2 transition-all duration-200 hover:scale-105"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="bg-black/50 backdrop-blur-sm hover:bg-red-500/80 text-white rounded-lg p-2 transition-all duration-200 hover:scale-105"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        {renderContent()}
      </div>

      {/* Footer Info */}
      {url && !loading && !error && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs opacity-75">
            Press <kbd className="bg-white/20 px-1 rounded">Esc</kbd> to close • Click outside to close
          </div>
        </div>
      )}
    </div>
  );
}