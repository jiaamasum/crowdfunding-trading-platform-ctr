import apiClient from '@/lib/apiClient';

type UploadResponse = {
  bucket: string;
  path: string;
  storage_path: string;
  public_url: string;
  resolve_url?: string;
};

export const mediaApi = {
  async upload(params: {
    file: File;
    bucket: string;
    folder?: string;
    projectId?: string;
    path?: string;
  }): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('bucket', params.bucket);
    if (params.folder) formData.append('folder', params.folder);
    if (params.projectId) formData.append('project_id', params.projectId);
    if (params.path) formData.append('path', params.path);

    const response = await apiClient.post('/media/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getSignedUrl(bucket: string, path: string): Promise<string | undefined> {
    const response = await apiClient.get('/media/signed-url/', {
      params: { bucket, path },
    });
    return response.data?.url;
  },
};
