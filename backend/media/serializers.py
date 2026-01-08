from rest_framework import serializers


class MediaUploadRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
    bucket = serializers.CharField()
    folder = serializers.CharField(required=False, allow_blank=True)
    project_id = serializers.CharField(required=False, allow_blank=True)
    path = serializers.CharField(required=False, allow_blank=True)


class MediaUploadResponseSerializer(serializers.Serializer):
    bucket = serializers.CharField()
    path = serializers.CharField()
    storage_path = serializers.CharField()
    public_url = serializers.URLField()
    resolve_url = serializers.URLField()
