import { useEffect, useRef, useState } from 'react';
import type { ImgHTMLAttributes, SyntheticEvent } from 'react';
import { getSignedMediaUrl, normalizeMediaUrl } from '@/lib/media';

type MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  bucket?: string;
};

export function MediaImage({ src, bucket, onError, loading, decoding, ...props }: MediaImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() => normalizeMediaUrl(src, bucket));
  const attemptedSignedRef = useRef(false);
  const attemptedNormalizedRef = useRef(false);
  const attemptedPlaceholderRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    setResolvedSrc(normalizeMediaUrl(src, bucket));
    attemptedSignedRef.current = false;
    attemptedNormalizedRef.current = false;
    attemptedPlaceholderRef.current = false;
    pendingRef.current = false;
  }, [src, bucket]);

  const handleError = async (event: SyntheticEvent<HTMLImageElement, Event>) => {
    onError?.(event);
    if (pendingRef.current) return;

    if (!attemptedNormalizedRef.current) {
      attemptedNormalizedRef.current = true;
      const normalized = normalizeMediaUrl(src, bucket);
      if (normalized && normalized !== resolvedSrc) {
        setResolvedSrc(normalized);
        return;
      }
    }

    if (attemptedSignedRef.current) return;

    pendingRef.current = true;
    const signedUrl = await getSignedMediaUrl(src, bucket);
    pendingRef.current = false;
    attemptedSignedRef.current = true;

    if (signedUrl) {
      setResolvedSrc(signedUrl);
      return;
    }

    if (!attemptedPlaceholderRef.current) {
      attemptedPlaceholderRef.current = true;
      setResolvedSrc('/placeholder.svg');
    }
  };

  if (!resolvedSrc) return null;

  return (
    <img
      src={resolvedSrc}
      onError={handleError}
      loading={loading ?? 'lazy'}
      decoding={decoding ?? 'async'}
      {...props}
    />
  );
}
