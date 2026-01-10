import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, differenceInDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Money } from '@/components/ui/money';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, DollarSign, Layers, Clock, Lock, FileText, Users, Scale, AlertTriangle, TrendingUp, Image, Upload, X, Box, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { projectsApi } from '@/lib/projectsApi';
import { mediaApi } from '@/lib/mediaApi';
import { useAuthStore } from '@/store/authStore';

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(2000),
  shortDescription: z.string().min(20, 'Short description must be at least 20 characters').max(200),
  category: z.string().min(1, 'Please select a category'),
  totalValue: z.number().min(10000, 'Minimum project value is $10,000').max(100000000),
  totalShares: z.number().min(100, 'Minimum shares is 100').max(1000000),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  hasRestrictedFields: z.boolean(),
  has3DModel: z.boolean(),
  is3DPublic: z.boolean(),
  // Restricted Fields (optional)
  financialProjections: z.string().max(5000).optional(),
  businessPlan: z.string().max(5000).optional(),
  teamDetails: z.string().max(3000).optional(),
  legalDocuments: z.string().max(5000).optional(),
  riskAssessment: z.string().max(3000).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const categories = [
  { value: 'TECHNOLOGY', label: 'Technology' },
  { value: 'REAL_ESTATE', label: 'Real Estate' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'ENERGY', label: 'Energy' },
  { value: 'AGRICULTURE', label: 'Agriculture' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateProject() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [model3D, setModel3D] = useState<File | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDragging3D, setIsDragging3D] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      shortDescription: '',
      category: '',
      totalValue: 100000,
      totalShares: 1000,
      startDate: undefined,
      endDate: undefined,
      hasRestrictedFields: false,
      has3DModel: false,
      is3DPublic: false,
      financialProjections: '',
      businessPlan: '',
      teamDetails: '',
      legalDocuments: '',
      riskAssessment: '',
    },
  });

  const hasRestrictedFields = form.watch('hasRestrictedFields');
  const has3DModel = form.watch('has3DModel');

  // Image handling
  const handleImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      if (images.length + newFiles.length >= MAX_IMAGES) {
        toast({ title: 'Maximum 3 images allowed', variant: 'destructive' });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: `${file.name} exceeds 5MB limit`, variant: 'destructive' });
        return;
      }
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
        toast({ title: `${file.name} is not a valid image type`, variant: 'destructive' });
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });
    
    setImages(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [images.length, toast]);

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 3D Model handling
  const handle3DSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File exceeds 5MB limit', variant: 'destructive' });
      return;
    }
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      toast({ title: 'Only GLB/GLTF files are allowed', variant: 'destructive' });
      return;
    }
    setModel3D(file);
    form.setValue('has3DModel', true);
  }, [toast, form]);

  const remove3DModel = () => {
    setModel3D(null);
    form.setValue('has3DModel', false);
  };

  const totalValue = form.watch('totalValue') || 0;
  const totalShares = form.watch('totalShares') || 1;
  const perSharePrice = totalShares > 0 ? totalValue / totalShares : 0;

  const uploadFile = async (file: File, projectId: string, bucket: string, folder: string) => {
    if (!user) {
      throw new Error('Please sign in to upload files');
    }
    const response = await mediaApi.upload({
      file,
      bucket,
      folder,
      projectId,
    });
    return response.resolve_url || response.public_url || response.storage_path;
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const durationDays = Math.max(1, differenceInDays(data.endDate, data.startDate));

      const created = await projectsApi.create({
        title: data.title,
        description: data.description,
        short_description: data.shortDescription,
        category: data.category,
        total_value: data.totalValue,
        total_shares: data.totalShares,
        duration_days: durationDays,
        thumbnail_url: null,
        images: [],
        has_3d_model: data.has3DModel,
        model_3d_url: null,
        is_3d_public: data.is3DPublic,
        has_restricted_fields: data.hasRestrictedFields,
        financial_projections: data.financialProjections || null,
        business_plan: data.businessPlan || null,
        team_details: data.teamDetails || null,
        legal_documents: data.legalDocuments || null,
        risk_assessment: data.riskAssessment || null,
      });

      let imageUrls: string[] = [];
      let modelUrl: string | null = null;
      let uploadFailed = false;

      try {
        for (const file of images) {
          const url = await uploadFile(file, created.id, 'project-media', 'images');
          imageUrls.push(url);
        }

        if (model3D) {
          modelUrl = await uploadFile(model3D, created.id, 'project-3d', 'models');
        }
      } catch (error) {
        uploadFailed = true;
        imageUrls = [];
        modelUrl = null;
      }

      if (imageUrls.length > 0 || modelUrl) {
        await projectsApi.update(created.id, {
          images: imageUrls,
          thumbnail_url: imageUrls[0] || null,
          has_3d_model: Boolean(modelUrl) || data.has3DModel,
          model_3d_url: modelUrl,
          is_3d_public: data.is3DPublic,
        });
      }

      if (uploadFailed) {
        toast({
          title: 'Project created with media pending',
          description: 'Project saved, but media upload failed. Check storage policies and try again from Media.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Project created!',
          description: 'Your project has been saved as a draft. Add media or submit for review when ready.',
        });
      }
      navigate(`/app/developer/projects/${created.id}`);
    } catch (error) {
      toast({
        title: 'Project creation failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/app/developer/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold">Create New Project</h1>
          <p className="text-muted-foreground mt-1">Fill in the details to create a new crowdfunding project</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the essential details about your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Solar Energy Innovation Hub" {...field} />
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
                      <Input placeholder="A brief one-liner about your project" {...field} />
                    </FormControl>
                    <FormDescription>This appears on project cards (max 200 characters)</FormDescription>
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
                        placeholder="Describe your project in detail. What problem does it solve? What makes it unique?" 
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
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Set your funding goal and share structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Project Value ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-9"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
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
                        <div className="relative">
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-9"
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Price Preview */}
              <div className="rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 p-6 border border-accent/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Calculated Per Share Price</p>
                    <Money amount={perSharePrice} className="text-3xl font-bold text-accent" />
                  </div>
                  <div className="text-left sm:text-right text-sm text-muted-foreground">
                    <p>Total Value: <Money amount={totalValue} className="font-medium text-foreground" /></p>
                    <p>Total Shares: <span className="font-medium text-foreground">{totalShares.toLocaleString()}</span></p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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

              {/* Duration Preview */}
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

          {/* Media Upload Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Project Media</CardTitle>
                  <CardDescription>Upload images and 3D models for your project</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-3">
                <FormLabel>Project Images (Max 3, 5MB each)</FormLabel>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDraggingImages ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
                  onDragLeave={() => setIsDraggingImages(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDraggingImages(false); handleImageSelect(e.dataTransfer.files); }}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Drag & drop images or click to browse</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => handleImageSelect(e.target.files)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('image-upload')?.click()}>
                    Select Images
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">{images.length}/3 images uploaded</p>
                </div>
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* 3D Model Upload */}
              <div className="space-y-3">
                <FormLabel>3D Model (GLB/GLTF, 5MB max)</FormLabel>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging3D ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging3D(true); }}
                  onDragLeave={() => setIsDragging3D(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging3D(false); handle3DSelect(e.dataTransfer.files); }}
                >
                  <Box className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Drag & drop 3D model or click to browse</p>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    id="model-upload"
                    onChange={(e) => handle3DSelect(e.target.files)}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('model-upload')?.click()}>
                    Select 3D Model
                  </Button>
                </div>

                {model3D && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Box className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{model3D.name}</span>
                      <span className="text-xs text-muted-foreground">({(model3D.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={remove3DModel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {has3DModel && (
                  <FormField
                    control={form.control}
                    name="is3DPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public 3D Model</FormLabel>
                          <FormDescription>Make 3D model viewable by all users</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Restricted Data Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Lock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Restricted Information</CardTitle>
                  <CardDescription>Confidential data only visible to approved investors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hasRestrictedFields"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Restricted Data</FormLabel>
                      <FormDescription>Add confidential information that requires investor approval to view</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {hasRestrictedFields && (
                <div className="space-y-4 pt-4">
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-warning-foreground">
                      The information below will be locked and only accessible to approved investors.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="financialProjections"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          Financial Projections
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Business Plan
                        </FormLabel>
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
                        <FormLabel className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Team Details
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Key team members and their experience..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="legalDocuments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-muted-foreground" />
                          Legal Documents Summary
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="Key contracts, IP rights, regulatory compliance..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskAssessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          Risk Assessment
                        </FormLabel>
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

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link to="/app/developer/projects">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Creating...' : 'Create Draft'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
