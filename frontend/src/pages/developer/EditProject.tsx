import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, Loader2, CalendarIcon, Clock, Upload, X, Image as ImageIcon } from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import type { Project } from '@/types';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mediaApi } from '@/lib/mediaApi';
import { MediaImage } from '@/components/common/MediaImage';

const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(150, 'Max 150 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.enum(['REAL_ESTATE', 'TECHNOLOGY', 'ENERGY', 'HEALTHCARE', 'MANUFACTURING', 'OTHER']),
  totalValue: z.coerce.number().min(10000, 'Minimum value is $10,000'),
  totalShares: z.coerce.number().min(100, 'Minimum 100 shares'),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  hasRestrictedFields: z.boolean(),
  has3DModel: z.boolean(),
  is3DPublic: z.boolean(),
  financialProjections: z.string().optional(),
  businessPlan: z.string().optional(),
  teamDetails: z.string().optional(),
  riskAssessment: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

type MediaFile = {
  file: File;
  preview: string;
};

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<MediaFile[]>([]);
  const [mediaDirty, setMediaDirty] = useState(false);

  const getDefaultValues = (data?: Project | null) => ({
    title: data?.title || '',
    shortDescription: data?.shortDescription || '',
    description: data?.description || '',
    category: (data?.category as any) || 'OTHER',
    totalValue: data?.totalValue || 100000,
    totalShares: data?.totalShares || 1000,
    startDate: data?.startDate ? new Date(data.startDate) : new Date(),
    endDate: data?.endDate ? new Date(data.endDate) : addDays(new Date(), 90),
    hasRestrictedFields: data?.hasRestrictedFields || false,
    has3DModel: data?.has3DModel || false,
    is3DPublic: data?.is3DPublic || false,
    financialProjections: data?.restrictedFields?.financialProjections || '',
    businessPlan: data?.restrictedFields?.businessPlan || '',
    teamDetails: data?.restrictedFields?.teamDetails || '',
    riskAssessment: data?.restrictedFields?.riskAssessment || '',
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    const loadProject = async () => {
      if (!id) return;
      const data = await projectsApi.getById(id);
      setProject(data);
      form.reset(getDefaultValues(data));
      setExistingImages(data?.images || []);
      setNewImages([]);
      setMediaDirty(false);
    };

    loadProject();
  }, [id, form]);

  const hasRestrictedFields = form.watch('hasRestrictedFields');
  const has3DModel = form.watch('has3DModel');

  const validateImageFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only PNG and JPEG images are allowed';
    }
    return null;
  };

  const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const remaining = MAX_IMAGES - existingImages.length - newImages.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const accepted: MediaFile[] = [];
    for (const file of files.slice(0, remaining)) {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        continue;
      }
      accepted.push({ file, preview: URL.createObjectURL(file) });
    }

    if (accepted.length > 0) {
      setNewImages((prev) => [...prev, ...accepted]);
      setMediaDirty(true);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setMediaDirty(true);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
    setMediaDirty(true);
  };


  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      let mediaPayload: { images?: string[]; thumbnail_url?: string | null } = {};
      if (mediaDirty) {
        const uploadedImages: string[] = [];
        for (const item of newImages) {
          const response = await mediaApi.upload({
            file: item.file,
            bucket: 'project-media',
            folder: 'images',
            projectId: id,
          });
          uploadedImages.push(response.resolve_url || response.public_url || response.storage_path);
        }

        const combinedImages = [...existingImages, ...uploadedImages];
        mediaPayload = {
          images: combinedImages,
          thumbnail_url: combinedImages[0] || null,
        };
      }

      const payload = {
        title: data.title,
        description: data.description,
        short_description: data.shortDescription,
        category: data.category,
        total_value: data.totalValue,
        total_shares: data.totalShares,
        duration_days: differenceInDays(data.endDate, data.startDate),
        has_restricted_fields: data.hasRestrictedFields,
        financial_projections: data.financialProjections || null,
        business_plan: data.businessPlan || null,
        team_details: data.teamDetails || null,
        risk_assessment: data.riskAssessment || null,
        has_3d_model: data.has3DModel,
        is_3d_public: data.is3DPublic,
        ...mediaPayload,
      };

      if (project?.status === 'APPROVED') {
        await projectsApi.createEditRequest(String(id), payload);
        toast.success('Edit request submitted for approval');
      } else {
        await apiClient.patch(`/projects/${id}/`, payload);
        toast.success('Project saved successfully');
      }
      setNewImages([]);
      setMediaDirty(false);
      setIsSubmitting(false);
      navigate(`/app/developer/projects/${id}`);
    } catch (error) {
      toast.error('Save failed', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const canEdit = ['DRAFT', 'NEEDS_CHANGES', 'REJECTED', 'APPROVED'].includes(project.status);

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">This project cannot be edited in its current status</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold">Edit Project</h1>
          <p className="text-muted-foreground mt-1">{project.title}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief tagline for your project" {...field} />
                      </FormControl>
                      <FormDescription>Max 150 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of your project" 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="REAL_ESTATE">Real Estate</SelectItem>
                          <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                          <SelectItem value="ENERGY">Energy</SelectItem>
                          <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
                          <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Media */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle>Project Media</CardTitle>
                <CardDescription>Manage up to {MAX_IMAGES} project images</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {existingImages.length === 0 && newImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    <p className="text-sm">No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((img, index) => (
                      <div key={`existing-${index}`} className="relative group rounded-lg overflow-hidden border bg-muted/20">
                        <MediaImage src={img} alt={`Project image ${index + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 rounded-full bg-background/90 p-1 text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {newImages.map((img, index) => (
                      <div key={`new-${index}`} className="relative group rounded-lg overflow-hidden border bg-muted/20">
                        <img src={img.preview} alt={`New upload ${index + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 rounded-full bg-background/90 p-1 text-muted-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="project-media-upload"
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    multiple
                    className="hidden"
                    onChange={handleAddImages}
                  />
                  <Label
                    htmlFor="project-media-upload"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted cursor-pointer",
                      existingImages.length + newImages.length >= MAX_IMAGES && "pointer-events-none opacity-50"
                    )}
                  >
                    <Upload className="h-4 w-4" /> Add Images
                  </Label>
                  <p className="text-xs text-muted-foreground">PNG or JPEG, up to 5MB each.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Investment and shares information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Project Value ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalShares"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Shares</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick start date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick end date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const startDate = form.watch('startDate');
                                return startDate ? date < startDate : false;
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('startDate') && form.watch('endDate') && (
                  <div className="rounded-lg bg-muted/50 p-4 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{differenceInDays(form.watch('endDate')!, form.watch('startDate')!)}</span>
                      <span className="text-muted-foreground"> days campaign duration</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Restricted Data */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Restricted Information</CardTitle>
                <CardDescription>Confidential data only visible to approved investors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasRestrictedFields"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Restricted Data</FormLabel>
                        <FormDescription>
                          Add confidential information that requires investor approval to view
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {hasRestrictedFields && (
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="financialProjections"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Projections</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Revenue forecasts, profit margins, etc." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Plan</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Strategy, milestones, execution plan..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="teamDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Details</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Key team members and their experience..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskAssessment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Assessment</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Potential risks and mitigation strategies..." {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* 3D Model Settings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>3D Model</CardTitle>
                <CardDescription>Configure 3D model visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="has3DModel"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Has 3D Model</FormLabel>
                        <FormDescription>Does this project include a 3D model?</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {has3DModel && (
                  <FormField
                    control={form.control}
                    name="is3DPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public 3D Model</FormLabel>
                          <FormDescription>
                            Make the 3D model viewable by all users (not just approved investors)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
