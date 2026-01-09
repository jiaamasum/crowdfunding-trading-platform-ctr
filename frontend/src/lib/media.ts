import { mediaApi } from '@/lib/mediaApi';
import { getApiBaseUrl } from '@/lib/env';

const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');
const isDataUrl = (value: string) => value.startsWith('data:');
const isBlobUrl = (value: string) => value.startsWith('blob:');
const isAbsoluteUrl = (value: string) => isHttpUrl(value) || isDataUrl(value) || isBlobUrl(value);

const STORAGE_PUBLIC_PATH = '/storage/v1/object/public/';
const STORAGE_SIGNED_PATH = '/storage/v1/object/sign/';
const API_BASE_URL = getApiBaseUrl();

const BUCKET_ALIASES: Record<string, string> = {
  'users-profile': 'users-profile-image',
};

const resolveBucket = (bucket?: string | null) => {
  if (!bucket) return bucket;
  return BUCKET_ALIASES[bucket] || bucket;
};

const resolveMediaUrl = (bucket: string, path: string) =>
  `${API_BASE_URL}/media/resolve/?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;

type StorageReference = { bucket: string; path: string };

const parseStorageReference = (value?: string | null, bucketHint?: string): StorageReference | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || ['null', 'undefined', 'none'].includes(trimmed.toLowerCase())) return null;
  if (isDataUrl(trimmed) || isBlobUrl(trimmed)) return null;

  const withoutLeadingSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const normalizedStoragePath = withoutLeadingSlash.startsWith('storage/v1/object/')
    ? `/${withoutLeadingSlash}`
    : trimmed;

  const resolvedBucketHint = resolveBucket(bucketHint);
  const withAlias = (bucket: string, path: string) => ({ bucket: resolveBucket(bucket) as string, path });

  if (resolvedBucketHint) {
    if (withoutLeadingSlash.startsWith(`${resolvedBucketHint}/`)) {
      return withAlias(resolvedBucketHint, withoutLeadingSlash.slice(resolvedBucketHint.length + 1));
    }
    if (!isHttpUrl(trimmed) && !withoutLeadingSlash.startsWith('storage/')) {
      return withAlias(resolvedBucketHint, withoutLeadingSlash);
    }
  }

  if (isHttpUrl(trimmed)) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname;
      
      // Handle /api/media/resolve/ URLs (e.g., from backend responses)
      if (path.includes('/api/media/resolve')) {
        const bucket = url.searchParams.get('bucket');
        const pathParam = url.searchParams.get('path');
        if (bucket && pathParam) {
          return withAlias(bucket, decodeURIComponent(pathParam));
        }
      }
      
      if (path.includes(STORAGE_PUBLIC_PATH)) {
        const tail = path.split(STORAGE_PUBLIC_PATH)[1];
        const [bucket, ...rest] = tail.split('/');
        return bucket ? withAlias(bucket, rest.join('/')) : null;
      }
      if (path.includes(STORAGE_SIGNED_PATH)) {
        const tail = path.split(STORAGE_SIGNED_PATH)[1];
        const [bucket, ...rest] = tail.split('/');
        return bucket ? withAlias(bucket, rest.join('/')) : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  if (normalizedStoragePath.startsWith(STORAGE_PUBLIC_PATH)) {
    const tail = normalizedStoragePath.slice(STORAGE_PUBLIC_PATH.length);
    const [bucket, ...rest] = tail.split('/');
    return bucket ? withAlias(bucket, rest.join('/')) : null;
  }

  if (normalizedStoragePath.startsWith(STORAGE_SIGNED_PATH)) {
    const tail = normalizedStoragePath.slice(STORAGE_SIGNED_PATH.length);
    const [bucket, ...rest] = tail.split('/');
    return bucket ? withAlias(bucket, rest.join('/')) : null;
  }

  const parts = withoutLeadingSlash.split('/');
  if (parts.length > 1) {
    const [bucket, ...rest] = parts;
    return withAlias(bucket, rest.join('/'));
  }

  return null;
};

const signedUrlCache = new Map<string, string>();

export const getSignedMediaUrl = async (value?: string | null, bucketHint?: string) => {
  const reference = parseStorageReference(value, bucketHint);
  if (!reference) return undefined;

  const cacheKey = `${reference.bucket}/${reference.path}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached) return cached;

  try {
    const signedUrl = await mediaApi.getSignedUrl(reference.bucket, reference.path);
    if (!signedUrl) return undefined;
    signedUrlCache.set(cacheKey, signedUrl);
    return signedUrl;
  } catch {
    return undefined;
  }
};

export const normalizeMediaUrl = (value?: string | null, bucket?: string) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || ['null', 'undefined', 'none'].includes(trimmed.toLowerCase())) return undefined;
  if (isAbsoluteUrl(trimmed)) {
    if (isDataUrl(trimmed) || isBlobUrl(trimmed)) return trimmed;
    try {
      const url = new URL(trimmed);
      const path = url.pathname;
      if (path.includes(STORAGE_PUBLIC_PATH) || path.includes(STORAGE_SIGNED_PATH)) {
        return trimmed;
      }
    } catch {
      return trimmed;
    }
    const reference = parseStorageReference(trimmed, bucket);
    if (reference) {
      return resolveMediaUrl(reference.bucket, reference.path);
    }
    return trimmed;
  }

  const normalizedStoragePath = trimmed.startsWith('storage/v1/object/') ? `/${trimmed}` : trimmed;
  if (normalizedStoragePath.startsWith(STORAGE_PUBLIC_PATH) || normalizedStoragePath.startsWith(STORAGE_SIGNED_PATH)) {
    const tail = normalizedStoragePath.replace(STORAGE_PUBLIC_PATH, '').replace(STORAGE_SIGNED_PATH, '');
    const [bucket, ...rest] = tail.split('/');
    if (bucket && rest.length > 0) {
      return resolveMediaUrl(resolveBucket(bucket) as string, rest.join('/'));
    }
  }

  const resolvedBucket = resolveBucket(bucket);

  if (resolvedBucket) {
    const normalizedPath = trimmed.startsWith(`${resolvedBucket}/`) ? trimmed.slice(resolvedBucket.length + 1) : trimmed;
    const inferredBucket = trimmed.split('/')[0];
    const knownBuckets = new Set(['project-media', 'project-3d', 'user-avatars', 'users-profile', 'users-profile-image']);
    const resolvedInferred = resolveBucket(inferredBucket);
    if (knownBuckets.has(inferredBucket) && resolvedInferred !== resolvedBucket) {
      return resolveMediaUrl(resolvedInferred as string, trimmed.split('/').slice(1).join('/'));
    }
    return resolveMediaUrl(resolvedBucket, normalizedPath);
  }

  const parts = trimmed.split('/');
  if (parts.length > 1) {
    const inferredBucket = parts[0];
    const path = parts.slice(1).join('/');
    return resolveMediaUrl(resolveBucket(inferredBucket) as string, path);
  }

  return trimmed;
};

export const normalizeMediaList = (values: string[] | undefined, bucket?: string) => {
  if (!values) return [];
  return values.map((value) => normalizeMediaUrl(value, bucket)).filter(Boolean) as string[];
};
