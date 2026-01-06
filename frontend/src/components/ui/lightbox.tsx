import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Lightbox({ images, initialIndex = 0, open, onOpenChange }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoom(1);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoom(1);
  }, [images.length]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onOpenChange(false);
  }, [handlePrevious, handleNext, onOpenChange]);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Zoom controls */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-[85vh] overflow-auto">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-lg max-w-[80vw] overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                }}
                className={cn(
                  "w-12 h-12 rounded overflow-hidden flex-shrink-0 border-2 transition-all",
                  currentIndex === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook for easy usage
export function useLightbox() {
  const [state, setState] = useState<{ open: boolean; images: string[]; index: number }>({
    open: false,
    images: [],
    index: 0,
  });

  const openLightbox = useCallback((images: string[], index = 0) => {
    setState({ open: true, images, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    ...state,
    openLightbox,
    closeLightbox,
    setOpen: (open: boolean) => setState((prev) => ({ ...prev, open })),
  };
}
