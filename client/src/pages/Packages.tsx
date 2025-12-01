import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Package2, Trash2, Calendar, DollarSign, ShoppingCart, Scissors, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import PageLayout from "@/components/PageLayout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { useLocale } from "@/contexts/LocaleContext";

const packageFormSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
  name: z.string().min(1, "Package name is required"),
  description: z.string().optional(),
  validityStartDate: z.string().min(1, "Start date is required"),
  validityEndDate: z.string().min(1, "End date is required"),
  totalPrice: z.number().min(0, "Total price must be positive"),
}).refine((data) => {
  const start = new Date(data.validityStartDate);
  const end = new Date(data.validityEndDate);
  return end >= start;
}, {
  message: "End date must be after start date",
  path: ["validityEndDate"],
});

type PackageFormData = z.infer<typeof packageFormSchema>;

interface ServiceSelection {
  procedureId: number;
  quantity: number;
  price: number;
}

interface ProductSelection {
  productId: number;
  quantity: number;
  price: number;
}

export default function Packages() {
  const { t, formatCurrency } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<ServiceSelection[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductSelection[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      clientId: 0,
      name: "",
      description: "",
      validityStartDate: "",
      validityEndDate: "",
      totalPrice: 0,
    },
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/packages"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["/api/procedures"],
    retry: false,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Calculate total price in real-time
  useEffect(() => {
    const servicesTotal = selectedServices.reduce((sum, s) => {
      const price = parseFloat(s.price?.toString() || '0');
      return sum + (price * s.quantity);
    }, 0);

    const productsTotal = selectedProducts.reduce((sum, p) => {
      const price = parseFloat(p.price?.toString() || '0');
      return sum + (price * p.quantity);
    }, 0);

    const total = servicesTotal + productsTotal;
    setTotalPrice(total);
    form.setValue("totalPrice", total);
  }, [selectedServices, selectedProducts, form]);

  // Reset form when editing
  useEffect(() => {
    if (editingPackage) {
      form.reset({
        clientId: editingPackage.clientId,
        name: editingPackage.name || "",
        description: editingPackage.description || "",
        validityStartDate: editingPackage.validityStartDate || "",
        validityEndDate: editingPackage.validityEndDate || "",
        totalPrice: parseFloat(editingPackage.totalPrice || '0'),
      });
      setSelectedServices(editingPackage.services || []);
      setSelectedProducts(editingPackage.products || []);
    } else {
      form.reset({
        clientId: 0,
        name: "",
        description: "",
        validityStartDate: "",
        validityEndDate: "",
        totalPrice: 0,
      });
      setSelectedServices([]);
      setSelectedProducts([]);
    }
  }, [editingPackage, form]);

  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      await apiRequest('POST', '/api/packages', {
        ...data,
        services: selectedServices,
        products: selectedProducts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setIsDialogOpen(false);
      setEditingPackage(null);
      form.reset();
      setSelectedServices([]);
      setSelectedProducts([]);
      toast({
        title: t("success"),
        description: t("created_successfully"),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      await apiRequest('PUT', `/api/packages/${editingPackage.id}`, {
        ...data,
        services: selectedServices,
        products: selectedProducts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      setIsDialogOpen(false);
      setEditingPackage(null);
      form.reset();
      setSelectedServices([]);
      setSelectedProducts([]);
      toast({
        title: t("success"),
        description: t("updated_successfully"),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packages"] });
      toast({
        title: t("success"),
        description: t("deleted_successfully"),
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const handleServiceToggle = (procedureId: number) => {
    const procedure = procedures.find((p: any) => p.id === procedureId);
    if (!procedure) return;

    const existing = selectedServices.find(s => s.procedureId === procedureId);
    if (existing) {
      setSelectedServices(selectedServices.filter(s => s.procedureId !== procedureId));
    } else {
      setSelectedServices([...selectedServices, {
        procedureId,
        quantity: 1,
        price: parseFloat(procedure.price || '0'),
      }]);
    }
  };

  const handleServiceQuantityChange = (procedureId: number, quantity: number) => {
    setSelectedServices(selectedServices.map(s => 
      s.procedureId === procedureId ? { ...s, quantity: Math.max(1, quantity) } : s
    ));
  };

  const handleProductToggle = (productId: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;

    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
    } else {
      setSelectedProducts([...selectedProducts, {
        productId,
        quantity: 1,
        price: parseFloat(product.price || '0'),
      }]);
    }
  };

  const handleProductQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
    ));
  };

  const onSubmit = (data: PackageFormData) => {
    if (editingPackage) {
      updatePackageMutation.mutate(data);
    } else {
      createPackageMutation.mutate(data);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t("confirm") + "?")) {
      deletePackageMutation.mutate(id);
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("packages_title")}</h1>
            <p className="text-muted-foreground">{t("packages_subtitle")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingPackage(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                {t("new_package")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? t("edit_package") : t("create_new_package")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select
                          value={field.value?.toString() || ""}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_client")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map((client: any) => (
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("package_name_label")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("package_name_label")} {...field} />
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
                        <FormLabel>{t("description_optional")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("description_optional")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Services Selection */}
                  <div className="space-y-4">
                    <FormLabel>{t("services")}</FormLabel>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {procedures.map((procedure: any) => {
                            const isSelected = selectedServices.some(s => s.procedureId === procedure.id);
                            const selection = selectedServices.find(s => s.procedureId === procedure.id);
                            return (
                              <div key={procedure.id} className="flex items-center gap-4 p-2 border rounded">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleServiceToggle(procedure.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{procedure.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ${parseFloat(procedure.price || '0').toFixed(2)}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={selection?.quantity || 1}
                                      onChange={(e) => handleServiceQuantityChange(procedure.id, parseInt(e.target.value) || 1)}
                                      className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      = ${((selection?.quantity || 1) * parseFloat(procedure.price || '0')).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Products Selection */}
                  <div className="space-y-4">
                    <FormLabel>{t("products")}</FormLabel>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {products.filter((p: any) => p.isActive).map((product: any) => {
                            const isSelected = selectedProducts.some(p => p.productId === product.id);
                            const selection = selectedProducts.find(p => p.productId === product.id);
                            return (
                              <div key={product.id} className="flex items-center gap-4 p-2 border rounded">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleProductToggle(product.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    ${parseFloat(product.price || '0').toFixed(2)}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={selection?.quantity || 1}
                                      onChange={(e) => handleProductQuantityChange(product.id, parseInt(e.target.value) || 1)}
                                      className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">
                                      = ${((selection?.quantity || 1) * parseFloat(product.price || '0')).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Total Price Display */}
                  <Card className="bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{t("total_price_label")}</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(totalPrice)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validity Period */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validityStartDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("validity_start_date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="validityEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("validity_end_date")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                    >
                      {editingPackage ? t("update_package") : t("create_package_button")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Packages List */}
        {packagesLoading ? (
          <div className="text-center py-8">{t("loading_packages")}</div>
        ) : packages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("no_packages_found")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {packages.map((pkg: any) => (
              <Card key={pkg.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{pkg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Client: {pkg.client?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                        {pkg.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{t("total_price_label")}</div>
                      <div className="text-lg font-semibold">{formatCurrency(parseFloat(pkg.totalPrice || '0'))}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t("service_balance")}</div>
                      <div className="text-lg font-semibold">{pkg.serviceBalance || 0}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t("money_balance")}</div>
                      <div className="text-lg font-semibold">{formatCurrency(parseFloat(pkg.moneyBalance || '0'))}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{t("validity")}</div>
                      <div className="text-sm">
                        {pkg.validityStartDate && format(new Date(pkg.validityStartDate), 'dd/MM/yyyy')} - {' '}
                        {pkg.validityEndDate && format(new Date(pkg.validityEndDate), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                  {(pkg.services?.length > 0 || pkg.products?.length > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">{t("contents")}</div>
                      <div className="flex flex-wrap gap-2">
                        {pkg.services?.map((s: any, idx: number) => {
                          const procedure = procedures.find((p: any) => p.id === s.procedureId);
                          return procedure ? (
                            <Badge key={idx} variant="outline">
                              <Scissors className="w-3 h-3 mr-1" />
                              {procedure.name} x{s.quantity}
                            </Badge>
                          ) : null;
                        })}
                        {pkg.products?.map((p: any, idx: number) => {
                          const product = products.find((pr: any) => pr.id === p.productId);
                          return product ? (
                            <Badge key={idx} variant="outline">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              {product.name} x{p.quantity}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

