import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Upload, X, Image as ImageIcon, Box, AlertCircle, Check, Loader2 
} from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import type { Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
const ALLOWED_3D_TYPES = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
  error?: string;
}

export default function ProjectMediaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      const data = await projectsApi.getById(id);
      setProject(data);
    };

    loadProject();
  }, [id]);
  
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [model3D, setModel3D] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDragging3D, setIsDragging3D] = useState(false);

  // Helper to process dropped/selected image files
  const processImageFiles = useCallback((files: File[]) => {
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const newImages: UploadedFile[] = [];
    
    for (const file of files) {
      const error = validateFile(file, 'image');
      if (error) {
        toast.error(error);
        continue;
      }
      
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      });
    }
    
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  // Helper to process dropped/selected 3D files
  const process3DFile = useCallback((file: File) => {
    const error = validateFile(file, '3d');
    if (error) {
      toast.error(error);
      return;
    }
    
    setModel3D({
      file,
      preview: '',
      progress: 0,
      status: 'pending',
    });
  }, []);

  const validateFile = (file: File, type: 'image' | '3d'): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    
    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only PNG and JPEG images are allowed';
    }
    
    if (type === '3d') {
      const ext = file.name.toLowerCase().split('.').pop();
      if (!['glb', 'gltf'].includes(ext || '')) {
        return 'Only GLB and GLTF 3D models are allowed';
      }
    }
    
    return null;
  };

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processImageFiles(files);
    e.target.value = '';
  }, [processImageFiles]);

  const handleModel3DSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      process3DFile(file);
    }
    e.target.value = '';
  }, [process3DFile]);

  // Drag and drop handlers for images
  const handleImageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(true);
  }, []);

  const handleImageDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    const files = Array.from(e.dataTransfer.files).filter(f => ALLOWED_IMAGE_TYPES.includes(f.type));
    processImageFiles(files);
  }, [processImageFiles]);

  // Drag and drop handlers for 3D
  const handle3DDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging3D(true);
  }, []);

  const handle3DDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging3D(false);
  }, []);

  const handle3DDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging3D(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      process3DFile(file);
    }
  }, [process3DFile]);

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const removeModel3D = () => {
    setModel3D(null);
  };

  const uploadFile = async (
    uploadedFile: UploadedFile, 
    bucket: string,
    folder: string,
    onProgress: (progress: number) => void
  ): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    
    const ext = uploadedFile.file.name.split('.').pop();
    const fileName = `${user.id}/${id}/${folder}/${Date.now()}.${ext}`;
    
    // Simulate progress for now (Supabase doesn't provide upload progress)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) onProgress(progress);
    }, 100);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, uploadedFile.file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    clearInterval(progressInterval);
    onProgress(100);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleUploadAll = async () => {
    if (!user) {
      toast.error('Please sign in to upload files');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload images
      const uploadedImages: string[] = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i].status === 'complete') continue;
        
        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i], status: 'uploading' };
          return newImages;
        });
        
        try {
          const url = await uploadFile(images[i], 'project-media', 'images', (progress) => {
            setImages(prev => {
              const newImages = [...prev];
              newImages[i] = { ...newImages[i], progress };
              return newImages;
            });
          });
          
          setImages(prev => {
            const newImages = [...prev];
            newImages[i] = { ...newImages[i], status: 'complete', url };
            return newImages;
          });
          uploadedImages.push(url);
        } catch (error: any) {
          setImages(prev => {
            const newImages = [...prev];
            newImages[i] = { ...newImages[i], status: 'error', error: error.message };
            return newImages;
          });
        }
      }
      
      // Upload 3D model
      let modelUrl: string | null = null;
      if (model3D && model3D.status !== 'complete') {
        setModel3D(prev => prev ? { ...prev, status: 'uploading' } : null);
        
        try {
          const url = await uploadFile(model3D, 'project-3d', 'models', (progress) => {
            setModel3D(prev => prev ? { ...prev, progress } : null);
          });
          
          setModel3D(prev => prev ? { ...prev, status: 'complete', url } : null);
          modelUrl = url;
        } catch (error: any) {
          setModel3D(prev => prev ? { ...prev, status: 'error', error: error.message } : null);
        }
      }

      if (uploadedImages.length > 0 || modelUrl) {
        const updated = await projectsApi.update(String(id), {
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
          thumbnail_url: uploadedImages[0] || project?.thumbnailUrl || null,
          has_3d_model: Boolean(modelUrl) || project?.has3DModel,
          model_3d_url: modelUrl,
          is_3d_public: project?.is3DPublic,
        });
        setProject(updated);
      }

      toast.success('Files uploaded successfully');
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const pendingUploads = images.filter(i => i.status === 'pending').length + (model3D?.status === 'pending' ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Project Media</h1>
          <p className="text-muted-foreground mt-1">{project ? project.title : 'Loading project...'}</p>
        </div>
      </div>

      {!project ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
        {/* Image Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Project Images
              </CardTitle>
              <CardDescription>
                Upload up to {MAX_IMAGES} PNG or JPEG images (max 5MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              {images.length < MAX_IMAGES && (
                <label 
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDraggingImages 
                      ? "border-accent bg-accent/10" 
                      : "border-muted-foreground/25 hover:bg-muted/50"
                  )}
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={cn("h-8 w-8 mb-2", isDraggingImages ? "text-accent" : "text-muted-foreground")} />
                    <p className={cn("text-sm", isDraggingImages ? "text-accent" : "text-muted-foreground")}>
                      {isDraggingImages ? "Drop images here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPEG up to 5MB ({images.length}/{MAX_IMAGES})
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isUploading}
                  />
                </label>
              )}

              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      
                      {/* Status overlay */}
                      {img.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                          <Progress value={img.progress} className="w-3/4 h-1" />
                        </div>
                      )}
                      
                      {img.status === 'complete' && (
                        <div className="absolute top-2 right-2 bg-success text-success-foreground rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      
                      {img.status === 'error' && (
                        <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-white" />
                        </div>
                      )}
                      
                      {/* Remove button */}
                      {img.status !== 'uploading' && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 3D Model Upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" /> 3D Model
              </CardTitle>
              <CardDescription>
                Upload one GLB or GLTF 3D model (max 5MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload area */}
              {!model3D && (
                <label 
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                    isDragging3D 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:bg-muted/50"
                  )}
                  onDragOver={handle3DDragOver}
                  onDragLeave={handle3DDragLeave}
                  onDrop={handle3DDrop}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Box className={cn("h-8 w-8 mb-2", isDragging3D ? "text-primary" : "text-muted-foreground")} />
                    <p className={cn("text-sm", isDragging3D ? "text-primary" : "text-muted-foreground")}>
                      {isDragging3D ? "Drop 3D model here" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      GLB, GLTF up to 5MB
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={handleModel3DSelect}
                    disabled={isUploading}
                  />
                </label>
              )}

              {/* 3D Model preview */}
              {model3D && (
                <div className="relative p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Box className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{model3D.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(model3D.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {model3D.status === 'uploading' && (
                        <Progress value={model3D.progress} className="h-1 mt-2" />
                      )}
                    </div>
                    
                    {model3D.status === 'complete' && (
                      <div className="bg-success text-success-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    
                    {model3D.status === 'error' && (
                      <div className="bg-destructive text-destructive-foreground rounded-full p-1">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    )}
                    
                    {model3D.status !== 'uploading' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={removeModel3D}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {model3D.error && (
                    <p className="text-xs text-destructive mt-2">{model3D.error}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        </div>
      )}

      {/* Upload Button */}
      {(images.length > 0 || model3D) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadAll} 
            disabled={isUploading || pendingUploads === 0}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {pendingUploads} file{pendingUploads !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
