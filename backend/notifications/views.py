import json
import time

from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework import renderers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import Notification
from .serializers import NotificationSerializer


class ServerSentEventRenderer(renderers.BaseRenderer):
    media_type = 'text/event-stream'
    format = 'event-stream'
    charset = None
    render_style = 'binary'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class NotificationListView(generics.ListAPIView):
    """List notifications for the authenticated user."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    """Mark a notification as read."""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
        
        notification.is_read = True
        notification.save()
        
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    """Mark all notifications as read."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read'})


class UnreadCountView(APIView):
    """Get unread notification count."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationStreamView(APIView):
    """Stream notifications over Server-Sent Events (SSE)."""
    authentication_classes = []
    permission_classes = []
    renderer_classes = [ServerSentEventRenderer]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': 'token is required'}, status=status.HTTP_401_UNAUTHORIZED)

        user = None
        auth = JWTAuthentication()
        try:
            validated_token = auth.get_validated_token(token)
            user = auth.get_user(validated_token)
        except Exception:
            user = None

        if not user:
            try:
                from config.supabase_auth import SupabaseJWTAuthentication
                supabase_auth = SupabaseJWTAuthentication()
                original_header = request.META.get('HTTP_AUTHORIZATION')
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
                try:
                    auth_result = supabase_auth.authenticate(request)
                    if auth_result:
                        user = auth_result[0]
                finally:
                    if original_header is None:
                        request.META.pop('HTTP_AUTHORIZATION', None)
                    else:
                        request.META['HTTP_AUTHORIZATION'] = original_header
            except Exception:
                user = None

        if not user:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        def event_stream():
            last_seen = timezone.now()
            heartbeat_at = time.time()
            yield "retry: 10000\n\n"
            try:
                while True:
                    new_items = Notification.objects.filter(
                        user=user,
                        created_at__gt=last_seen,
                    ).order_by('created_at')
                    for notification in new_items:
                        payload = NotificationSerializer(notification).data
                        yield f"data: {json.dumps(payload)}\n\n"
                        if notification.created_at and notification.created_at > last_seen:
                            last_seen = notification.created_at

                    if time.time() - heartbeat_at > 15:
                        heartbeat_at = time.time()
                        yield ": heartbeat\n\n"

                    time.sleep(2)
            except GeneratorExit:
                return

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response
