import os
import uuid
from urllib.parse import quote

import requests
from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

ALLOWED_BUCKETS = {
    settings.SUPABASE_STORAGE_BUCKET_MEDIA,
    settings.SUPABASE_STORAGE_BUCKET_3D,
    settings.SUPABASE_STORAGE_BUCKET_PROFILE,
}

BUCKET_ALIASES = {
    'users-profile': settings.SUPABASE_STORAGE_BUCKET_PROFILE,
}


def _resolve_bucket(bucket: str) -> str:
    return BUCKET_ALIASES.get(bucket, bucket)


def _supabase_base_url() -> str:
    url = settings.SUPABASE_URL
    if not url:
        raise ValueError('SUPABASE_URL is not configured')
    return url.rstrip('/')


def _supabase_service_key() -> str:
    key = getattr(settings, 'SUPABASE_SERVICE_ROLE_KEY', '') or settings.SUPABASE_ANON_KEY
    if not key:
        raise ValueError('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is not configured')
    return key


def _storage_headers(content_type: str | None = None) -> dict:
    key = _supabase_service_key()
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'x-upsert': 'false',
    }
    if content_type:
        headers['Content-Type'] = content_type
    return headers


def _encode_path(path: str) -> str:
    return '/'.join(quote(part, safe='') for part in path.split('/'))


def _public_url(bucket: str, path: str) -> str:
    base = _supabase_base_url()
    return f"{base}/storage/v1/object/public/{bucket}/{_encode_path(path)}"


def _signed_url(bucket: str, path: str, expires_in: int = 3600) -> str | None:
    base = _supabase_base_url()
    url = f"{base}/storage/v1/object/sign/{bucket}/{_encode_path(path)}"
    response = requests.post(
        url,
        headers=_storage_headers(),
        json={'expiresIn': int(expires_in)},
        timeout=15,
    )
    if not response.ok:
        return None
    payload = response.json() or {}
    signed = payload.get('signedURL') or payload.get('signedUrl') or payload.get('signed_url')
    if not signed:
        return None
    if signed.startswith('http'):
        return signed
    if signed.startswith('/'):
        if signed.startswith('/storage/'):
            return f"{base}{signed}"
        return f"{base}/storage/v1{signed}"
    return f"{base}/{signed}"


class MediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        bucket = request.data.get('bucket') or ''
        bucket = _resolve_bucket(bucket)
        if bucket not in ALLOWED_BUCKETS:
            return Response({'error': 'Invalid bucket'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'file is required'}, status=status.HTTP_400_BAD_REQUEST)

        project_id = request.data.get('project_id')
        folder = request.data.get('folder') or 'uploads'
        path = request.data.get('path')

        if path:
            storage_path = str(path).lstrip('/')
        else:
            ext = os.path.splitext(uploaded_file.name)[1].lstrip('.')
            ext = ext or 'bin'
            segments = [str(request.user.id)]
            if project_id:
                segments.append(str(project_id))
            if folder:
                segments.append(str(folder))
            segments.append(f"{uuid.uuid4().hex}.{ext}")
            storage_path = '/'.join(segments)

        base = _supabase_base_url()
        upload_url = f"{base}/storage/v1/object/{bucket}/{_encode_path(storage_path)}"
        content_type = uploaded_file.content_type or 'application/octet-stream'
        try:
            response = requests.post(
                upload_url,
                headers=_storage_headers(content_type=content_type),
                data=uploaded_file.read(),
                timeout=30,
            )
        except requests.RequestException as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if not response.ok:
            return Response({'error': response.text}, status=status.HTTP_400_BAD_REQUEST)

        resolve_url = request.build_absolute_uri(
            f"/api/media/resolve/?bucket={bucket}&path={quote(storage_path, safe='')}"
        )
        return Response({
            'bucket': bucket,
            'path': storage_path,
            'storage_path': f"{bucket}/{storage_path}",
            'public_url': _public_url(bucket, storage_path),
            'resolve_url': resolve_url,
        })


class MediaSignedUrlView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        bucket = request.query_params.get('bucket') or ''
        path = request.query_params.get('path') or ''
        expires_in = request.query_params.get('expires_in', 3600)

        bucket = _resolve_bucket(bucket)
        if not bucket or not path:
            return Response({'error': 'bucket and path are required'}, status=status.HTTP_400_BAD_REQUEST)
        if bucket not in ALLOWED_BUCKETS:
            return Response({'error': 'Invalid bucket'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            signed = _signed_url(bucket, path, int(expires_in))
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not signed:
            return Response({'error': 'Unable to sign media URL'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'url': signed})


class MediaResolveView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        bucket = request.query_params.get('bucket') or ''
        path = request.query_params.get('path') or ''
        expires_in = request.query_params.get('expires_in', 3600)

        bucket = _resolve_bucket(bucket)
        if not bucket or not path:
            return Response({'error': 'bucket and path are required'}, status=status.HTTP_400_BAD_REQUEST)
        if bucket not in ALLOWED_BUCKETS:
            return Response({'error': 'Invalid bucket'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            signed = _signed_url(bucket, path, int(expires_in))
        except ValueError:
            signed = None

        target = signed or _public_url(bucket, path)
        return HttpResponseRedirect(target)
