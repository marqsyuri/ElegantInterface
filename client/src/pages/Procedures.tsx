import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Package2, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageLayout from "@/components/PageLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const procedureFormSchema = z.object({
  name: z.string().min(1, "Procedure name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  materials: z.array(z.object({
    materialId: z.number(),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).default([]),
});

type ProcedureFormData = z.infer<typeof procedureFormSchema>;

export default function Procedures() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<any>(null);
  const [materialSelections, setMaterialSelections] = useState<{ materialId: number; quantity: number }[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      duration: 60,
      materials: [],
    },
  });

  const { data: procedures = [], isLoading: proceduresLoading } = useQuery({
    queryKey: ["/api/procedures"],
    retry: false,
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["/api/inventory"],
    retry: false,
  });

  const createProcedureMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      await apiRequest('POST', '/api/procedures', {
        ...data,
        materials: materialSelections,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      setIsDialogOpen(false);
      setEditingProcedure(null);
      setMaterialSelections([]);
      form.reset();
      toast({
        title: "Success",
        description: "Procedure created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create procedure",
        variant: "destructive",
      });
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      await apiRequest('PUT', `/api/procedures/${editingProcedure.id}`, {
        ...data,
        materials: materialSelections,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      setIsDialogOpen(false);
      setEditingProcedure(null);
      setMaterialSelections([]);
      form.reset();
      toast({
        title: "Success",
        description: "Procedure updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update procedure",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProcedureFormData) => {
    if (editingProcedure) {
      updateProcedureMutation.mutate(data);
    } else {
      createProcedureMutation.mutate(data);
    }
  };

  const handleEditProcedure = (procedure: any) => {
    setEditingProcedure(procedure);
    form.reset({
      name: procedure.name,
      description: procedure.description || "",
      category: procedure.category,
      duration: procedure.duration,
    });
    setMaterialSelections(procedure.materials || []);
    setIsDialogOpen(true);
  };

  const handleNewProcedure = () => {
    setEditingProcedure(null);
    form.reset();
    setMaterialSelections([]);
    setIsDialogOpen(true);
  };

  const addMaterial = () => {
    setMaterialSelections([...materialSelections, { materialId: 0, quantity: 1 }]);
  };

  const updateMaterialSelection = (index: number, field: 'materialId' | 'quantity', value: number) => {
    const updated = [...materialSelections];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialSelections(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterialSelections(materialSelections.filter((_, i) => i !== index));
  };

  const getMaterialName = (materialId: number) => {
    const material = materials.find((m: any) => m.id === materialId);
    return material?.itemName || 'Unknown Material';
  };

  const categories = [
    "Facial Treatment",
    "Body Treatment", 
    "Hair Treatment",
    "Nail Care",
    "Skin Care",
    "Anti-Aging",
    "Therapeutic",
    "Cosmetic",
  ];

  return (
    <PageLayout title="Procedures" subtitle="Manage treatment procedures and materials">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Treatment Procedures</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewProcedure}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Procedure
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProcedure ? "Edit Procedure" : "New Procedure"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedure Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Deep Cleansing Facial" {...field} />
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
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="15" 
                              step="15"
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the procedure steps and benefits..."
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Materials Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Required Materials</label>
                        <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add Material
                        </Button>
                      </div>

                      {materialSelections.map((selection, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Select
                              value={selection.materialId.toString()}
                              onValueChange={(value) => updateMaterialSelection(index, 'materialId', parseInt(value))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((material: any) => (
                                  <SelectItem key={material.id} value={material.id.toString()}>
                                    {material.itemName} ({material.currentStock} {material.unit} available)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              min="1"
                              value={selection.quantity}
                              onChange={(e) => updateMaterialSelection(index, 'quantity', parseInt(e.target.value) || 1)}
                              placeholder="Qty"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMaterial(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createProcedureMutation.isPending || updateProcedureMutation.isPending}
                      >
                        {editingProcedure ? "Update" : "Create"} Procedure
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {proceduresLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading procedures...</p>
              </div>
            ) : procedures.length === 0 ? (
              <div className="text-center py-8">
                <Package2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No procedures yet</h3>
                <p className="text-slate-600 mb-4">Create your first treatment procedure to get started.</p>
                <Button onClick={handleNewProcedure}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Procedure
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {procedures.map((procedure: any) => (
                  <Card key={procedure.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-slate-900">{procedure.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProcedure(procedure)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <Badge variant="secondary">{procedure.category}</Badge>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {procedure.duration} minutes
                        </div>

                        {procedure.description && (
                          <div className="flex items-start text-sm text-slate-600">
                            <FileText className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                            <p className="line-clamp-2">{procedure.description}</p>
                          </div>
                        )}
                      </div>

                      {procedure.materials && procedure.materials.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center">
                            <Package2 className="w-3 h-3 mr-1" />
                            Materials Required
                          </h4>
                          <div className="space-y-1">
                            {procedure.materials.map((material: any, index: number) => (
                              <div key={index} className="text-xs text-slate-600 flex justify-between">
                                <span>{getMaterialName(material.materialId)}</span>
                                <span className="font-medium">{material.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}