import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize, Minimize } from 'lucide-react';

interface ProductImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  productTitle?: string;
  onIndexChange?: (index: number) => void;
}

export default function ProductImageLightbox({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  productTitle = 'Product Image',
  onIndexChange,
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync index when modal opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, images.length - 1)));
      setZoomLevel(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Track native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    if (onIndexChange) onIndexChange(nextIndex);
  }, [currentIndex, images.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    if (onIndexChange) onIndexChange(prevIndex);
  }, [currentIndex, images.length, onIndexChange]);

  const handleSelectImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    if (onIndexChange) onIndexChange(index);
  }, [onIndexChange]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Native fullscreen not available:', err);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(prev + 0.25, 3));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageDoubleClick = () => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2);
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fadeIn transition-opacity duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-600/90 text-white tracking-wider">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-md lg:max-w-xl">
            {productTitle}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            title="Zoom In (+)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Zoom Out (-)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Reset Zoom */}
          {zoomLevel > 1 && (
            <button
              onClick={handleResetZoom}
              title="Reset Zoom (0)"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{Math.round(zoomLevel * 100)}%</span>
            </button>
          )}

          {/* Native Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-red-600 transition-all ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={imageContainerRef}
        className="relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8"
        onWheel={handleWheel}
        onClick={(e) => {
          // Close if clicking outside the image container
          if (e.target === imageContainerRef.current && zoomLevel === 1) {
            onClose();
          }
        }}
      >
        {/* Navigation Prev Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous Image (Left Arrow)"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/60 shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Active Product Image */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform ${
            isDragging ? 'cursor-grabbing' : zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'
          }`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleImageDoubleClick}
        >
          <img
            src={currentImage}
            alt={`${productTitle} - Image ${currentIndex + 1}`}
            className="max-h-[72vh] sm:max-h-[76vh] max-w-[90vw] sm:max-w-[85vw] object-contain rounded-2xl drop-shadow-2xl pointer-events-auto bg-white/5 p-2 sm:p-4 border border-white/10"
            draggable={false}
          />
        </div>

        {/* Navigation Next Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next Image (Right Arrow)"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/80 hover:bg-red-600 text-white border border-slate-700/60 shadow-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Bar: Thumbnails & Hints */}
      <div className="px-4 sm:px-6 py-4 bg-slate-900/70 border-t border-slate-800/80 flex flex-col items-center gap-2 z-20">
        {/* Thumbnails Row */}
        {images.length > 1 && (
          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto max-w-full px-2 py-1 custom-scrollbar">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectImage(idx)}
                className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-white/10 p-1 transition-all ${
                  currentIndex === idx
                    ? 'ring-2 ring-red-500 scale-105 shadow-lg shadow-red-500/20'
                    : 'opacity-60 hover:opacity-100 hover:scale-100 border border-slate-700/60'
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain mix-blend-normal"
                />
              </button>
            ))}
          </div>
        )}

        {/* Bottom Shortcut Hints */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <span>Double-click or scroll to zoom</span>
          <span>•</span>
          <span>Arrow keys (← / →) to navigate</span>
          <span>•</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
