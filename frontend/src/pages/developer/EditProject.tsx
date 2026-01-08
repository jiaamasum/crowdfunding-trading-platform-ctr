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
import { ArrowLeft, Save, Loader2, CalendarIcon, Clock } from 'lucide-react';
import { projectsApi } from '@/lib/projectsApi';
import type { Project } from '@/types';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export default function EditProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

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
    };

    loadProject();
  }, [id, form]);

  const hasRestrictedFields = form.watch('hasRestrictedFields');
  const has3DModel = form.watch('has3DModel');

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
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
      };

      if (project?.status === 'APPROVED') {
        await projectsApi.createEditRequest(String(id), payload);
        toast.success('Edit request submitted for approval');
      } else {
        await apiClient.patch(`/projects/${id}/`, payload);
        toast.success('Project saved successfully');
      }
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
