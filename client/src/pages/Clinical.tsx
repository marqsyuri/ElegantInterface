import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePlus, Camera, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertClinicalRecordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { z } from "zod";

const clinicalFormSchema = insertClinicalRecordSchema.extend({
  procedureDate: z.string().min(1, "Date is required"),
}).omit({ userId: true });

type ClinicalFormData = z.infer<typeof clinicalFormSchema>;

export default function Clinical() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const queryClient = useQueryClient();

  const form = useForm<ClinicalFormData>({
    resolver: zodResolver(clinicalFormSchema),
  });

  const { data: clinicalRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/clinical-records"],
    retry: false,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createClinicalRecordMutation = useMutation({
    mutationFn: async (data: ClinicalFormData) => {
      const recordData = {
        ...data,
        procedureDate: new Date(data.procedureDate).toISOString().split('T')[0],
        resultRating: selectedRating || undefined,
        nextAppointment: data.nextAppointment ? new Date(data.nextAppointment).toISOString().split('T')[0] : undefined,
        beforeImages: beforeImages,
        afterImages: afterImages,
      };
      await apiRequest('POST', '/api/clinical-records', recordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinical-records"] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedRating(0);
      setBeforeImages([]);
      setAfterImages([]);
      toast({
        title: "Success",
        description: "Clinical record created successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create clinical record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClinicalFormData) => {
    createClinicalRecordMutation.mutate(data);
  };

  // Image compression and upload functions
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const MAX_WIDTH = 600;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressedDataUrl);
      };
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (files: FileList | null, type: 'before' | 'after') => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file (PNG or JPG).",
        variant: "destructive",
      });
      return;
    }

    try {
      const compressedImage = await compressImage(file);
      
      if (type === 'before') {
        setBeforeImages(prev => [...prev, compressedImage]);
      } else {
        setAfterImages(prev => [...prev, compressedImage]);
      }
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const procedures = [
    "Deep Cleansing Facial",
    "Microdermabrasion",
    "Chemical Peel",
    "Radio Frequency Treatment", 
    "Microneedling",
    "Hydrating Facial",
    "Lymphatic Drainage Massage",
    "Anti-Aging Facial Treatment",
    "Acne Treatment",
    "Skin Brightening Treatment",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <TopHeader title="Clinical Records" subtitle="Record and track treatments performed" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Electronic Clinical Record</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <FilePlus className="w-4 h-4 mr-2" />
                    New Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>New Clinical Record</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {clients?.map((client: any) => (
                                      <SelectItem key={client.id} value={client.id.toString()}>
                                        {client.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="procedure"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Procedure Performed</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a procedure" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {procedures.map((procedure) => (
                                      <SelectItem key={procedure} value={procedure}>
                                        {procedure}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="procedureDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data do Procedimento</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Procedure Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Procedure details, reactions, observed results..." 
                                    className="h-24"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Result Assessment
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-600">Poor</span>
                              <div className="flex space-x-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    type="button"
                                    variant={selectedRating >= rating ? "default" : "outline"}
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={() => setSelectedRating(rating)}
                                  >
                                    {rating}
                                  </Button>
                                ))}
                              </div>
                              <span className="text-sm text-slate-600">Excellent</span>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name="nextAppointment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Next Appointment</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Before/After Photos
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                              {/* Before Photos */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Before</label>
                                <div 
                                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                                  onClick={() => document.getElementById('before-upload')?.click()}
                                >
                                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">Click to add photo</p>
                                  <input
                                    id="before-upload"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e.target.files, 'before')}
                                  />
                                </div>
                                {beforeImages.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {beforeImages.map((image, index) => (
                                      <div key={index} className="relative">
                                        <img 
                                          src={image} 
                                          alt={`Before ${index + 1}`}
                                          className="w-full h-20 object-cover rounded border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeImage(index, 'before')}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* After Photos */}
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">After</label>
                                <div 
                                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
                                  onClick={() => document.getElementById('after-upload')?.click()}
                                >
                                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">Click to add photo</p>
                                  <input
                                    id="after-upload"
                                    type="file"
                                    accept="image/png,image/jpeg"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(e.target.files, 'after')}
                                  />
                                </div>
                                {afterImages.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {afterImages.map((image, index) => (
                                      <div key={index} className="relative">
                                        <img 
                                          src={image} 
                                          alt={`After ${index + 1}`}
                                          className="w-full h-20 object-cover rounded border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeImage(index, 'after')}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createClinicalRecordMutation.isPending}>
                          {createClinicalRecordMutation.isPending ? "Saving..." : "Save Clinical Record"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 mb-4">Clinical Records</h4>
                {recordsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-200 rounded w-20"></div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : clinicalRecords?.length > 0 ? (
                  clinicalRecords.map((record: any) => (
                    <div key={record.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-slate-900">{record.procedure}</h5>
                        <span className="text-sm text-slate-500">
                          {new Date(record.procedureDate).toLocaleDateString('en-NZ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-900 font-medium mb-1">{record.client.name}</p>
                      {record.observations && (
                        <p className="text-sm text-slate-600 mb-2">{record.observations}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {record.resultRating && (
                          <div className="flex items-center">
                            <span className="text-xs text-slate-500 mr-2">Result:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3 h-3 ${
                                    i < record.resultRating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-slate-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {record.nextAppointment && (
                          <Badge variant="outline" className="text-xs">
                            Next: {new Date(record.nextAppointment).toLocaleDateString('en-NZ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FilePlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No clinical records registered</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setIsDialogOpen(true)}
                    >
                      Create first clinical record
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
