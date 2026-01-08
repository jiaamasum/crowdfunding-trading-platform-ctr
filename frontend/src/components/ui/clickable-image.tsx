import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Lightbox } from './lightbox';
import { MediaImage } from '@/components/common/MediaImage';
import { cn } from '@/lib/utils';

interface ClickableImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  allImages?: string[]; // For gallery mode - all images in the collection
}

export function ClickableImage({
  src,
  alt = 'Image',
  className,
  containerClassName,
  allImages,
}: ClickableImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const images = allImages || [src];
  const currentIndex = images.indexOf(src);

  return (
    <>
      <div className={cn("relative group cursor-pointer", containerClassName)} onClick={() => setLightboxOpen(true)}>
        <MediaImage
          src={src}
          alt={alt}
          className={cn("transition-transform group-hover:scale-[1.02]", className)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-full p-2">
            <Maximize2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      <Lightbox
        images={images}
        initialIndex={currentIndex >= 0 ? currentIndex : 0}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}
