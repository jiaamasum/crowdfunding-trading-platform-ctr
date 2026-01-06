import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  onImageClick?: (index: number) => void;
  className?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  showThumbnails?: boolean;
}

export function ImageCarousel({
  images,
  onImageClick,
  className,
  aspectRatio = 'video',
  showThumbnails = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images.length) {
    return (
      <div className={cn("bg-muted rounded-lg flex items-center justify-center text-muted-foreground", className)}>
        No images available
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
  }[aspectRatio];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Image */}
      <div className={cn("relative rounded-xl overflow-hidden bg-muted group", aspectClass)}>
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => onImageClick?.(currentIndex)}
        />

        {/* Expand button */}
        {onImageClick && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
            onClick={() => onImageClick(currentIndex)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentIndex === index 
                    ? "bg-white w-4" 
                    : "bg-white/50 hover:bg-white/75"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                currentIndex === index
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
