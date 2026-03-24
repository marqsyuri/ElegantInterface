import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Search, Edit, Trash2, Grid3x3, List, Filter, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertProductSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocale } from "@/contexts/LocaleContext";
import { z } from "zod";

// Product categories for better organization
const PRODUCT_CATEGORIES = [
  { id: "all", name: "All Products", color: "slate" },
  { id: "skincare", name: "Skincare", color: "pink" },
  { id: "haircare", name: "Hair Care", color: "purple" },
  { id: "makeup", name: "Makeup", color: "rose" },
  { id: "tools", name: "Tools & Equipment", color: "blue" },
  { id: "supplies", name: "Supplies & Materials", color: "green" },
  { id: "supplements", name: "Supplements", color: "orange" },
  { id: "other", name: "Other", color: "gray" },
] as const;

const productFormSchema = insertProductSchema.omit({ userId: true });

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Products() {
  const { t, formatCurrency } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLowStockDialogOpen, setIsLowStockDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Default to list for better UX
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      price: "",
      costPrice: "",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: "un",
      isActive: true,
      tags: [],
    },
  });

  const { data: productsList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (editingProduct) {
        await apiRequest('PUT', `/api/products/${editingProduct.id}`, data);
      } else {
        await apiRequest('POST', '/api/products', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      toast({
        title: t("success"),
        description: editingProduct ? t("updated_successfully") : t("created_successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("failed_to_create"),
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t("success"),
        description: t("deleted_successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: t("failed_to_create"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      code: product.code,
      description: product.description || "",
      price: product.price,
      costPrice: product.costPrice || "",
      currentStock: product.currentStock || 0,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      unit: product.unit || "un",
      barcode: product.barcode || "",
      location: product.location || "",
      tags: product.tags || [],
      isActive: product.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(t("confirm") + ` "${name}"?`)) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset({
      name: "",
      code: "",
      description: "",
      price: "",
      costPrice: "",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      unit: "un",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const filteredProducts = Array.isArray(productsList) ? productsList.filter((product: any) => {
    // Filter by search term
    const matchesSearch = searchTerm === "" || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category (using tags as category for now)
    const matchesCategory = selectedCategory === "all" || 
      (Array.isArray(product.tags) && product.tags.includes(selectedCategory));
    
    return matchesSearch && matchesCategory;
  }) : [];

  // Calculate summary statistics using useMemo for performance
  const summaryStats = useMemo(() => {
    const allProducts = Array.isArray(productsList) ? productsList : [];
    
    const totalProducts = allProducts.length;
    const totalValue = allProducts.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.price || 0) * (p.currentStock || 0)), 0
    );
    const lowStock = allProducts.filter((p: any) => 
      (p.currentStock || 0) <= (p.minStock || 0)
    ).length;
    const activeProducts = allProducts.filter((p: any) => p.isActive !== false).length;
    
    return { totalProducts, totalValue, lowStock, activeProducts };
  }, [productsList]);

  // Calculate low stock products list
  const lowStockProducts = useMemo(() => {
    const allProducts = Array.isArray(productsList) ? productsList : [];
    return allProducts.filter((p: any) => 
      (p.currentStock || 0) <= (p.minStock || 0)
    ).sort((a: any, b: any) => {
      // Sort by stock level (lowest first)
      const stockA = (a.currentStock || 0) / Math.max(a.minStock || 1, 1);
      const stockB = (b.currentStock || 0) / Math.max(b.minStock || 1, 1);
      return stockA - stockB;
    });
  }, [productsList]);

  // Group products by name and count quantities
  const productsByType = useMemo(() => {
    const allProducts = Array.isArray(productsList) ? productsList : [];
    const grouped: Record<string, { count: number; totalStock: number; items: any[] }> = {};
    
    allProducts.forEach((product: any) => {
      // Extract base name (remove variations like "Shampoo Professional", "Shampoo Regular" -> "Shampoo")
      const baseName = product.name?.split(' ')[0] || product.name || 'Unknown';
      
      if (!grouped[baseName]) {
        grouped[baseName] = { count: 0, totalStock: 0, items: [] };
      }
      
      grouped[baseName].count += 1;
      grouped[baseName].totalStock += product.currentStock || 0;
      grouped[baseName].items.push(product);
    });
    
    // Convert to array and sort by count (descending)
    return Object.entries(grouped)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [productsList]);

  // Debug: log to console
  if (Array.isArray(productsList) && productsList.length > 0) {
  } else if (!isLoading) {
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 transition-all duration-300`}>
        <TopHeader title={t("products_management")} subtitle={t("products_subtitle")} />
        
        <div className="p-6 space-y-6">
          {/* Summary Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 mb-1">{t("total_products")}</p>
                    <p className="text-2xl font-bold text-blue-600">{summaryStats.totalProducts}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">{t("total_value")}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summaryStats.totalValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="border-yellow-200 bg-yellow-50/50 cursor-pointer hover:shadow-lg transition-all duration-200 hover:bg-yellow-100/50"
              onClick={() => {
                if (summaryStats.lowStock > 0) {
                  setIsLowStockDialogOpen(true);
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 mb-1">{t("low_stock")}</p>
                    <p className="text-2xl font-bold text-yellow-600">{summaryStats.lowStock}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                {summaryStats.lowStock > 0 && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">{t("click_to_view_details")}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 mb-1">{t("active_products")}</p>
                    <p className="text-2xl font-bold text-purple-600">{summaryStats.activeProducts}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products by Type Summary */}
          {productsByType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">{t("products_summary_by_type")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {productsByType.map(({ name, count, totalStock }) => (
                    <div 
                      key={name}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-900 capitalize">{name}</p>
                        <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                          {count}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {t("current_stock_label")}: <span className="font-medium text-slate-900">{totalStock}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">{t("products_catalog")}</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleAddNew}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("add_product")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 m-2 sm:m-0 top-[50%] sm:top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                  <DialogHeader className="pb-3 sm:pb-4">
                    <DialogTitle className="text-base sm:text-lg">{editingProduct ? t("edit_product") : t("add_new_product")}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("product_name")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Shampoo Profissional" className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("product_code")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., SHMP001" className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">{t("description") || "Descrição"}</FormLabel>
                            <FormControl>
                              <Textarea {...field} value={field.value || ""} placeholder="Descrição do produto..." rows={3} className="text-sm sm:text-base resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">{t("category")}</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange([value])} 
                              value={Array.isArray(field.value) && field.value.length > 0 ? field.value[0] : ""}
                            >
                              <FormControl>
                                <SelectTrigger className="h-10 sm:h-10 text-sm sm:text-base">
                                  <SelectValue placeholder={t("select_category")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-[200px] sm:max-h-[300px]">
                                {PRODUCT_CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
                                  <SelectItem key={category.id} value={category.id} className="text-sm sm:text-base">
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("sale_price_nzd")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ""} className="text-sm sm:text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="costPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("cost_price_nzd")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ""} className="text-sm sm:text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2 lg:col-span-1">
                              <FormLabel className="text-sm sm:text-base">{t("unit") || "Unidade"} *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="un, caixa, frasco" className="text-sm sm:text-base" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="currentStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("current_stock")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value) || 0)} value={field.value ?? 0} className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="minStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("min_stock_alert")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value) || 0)} value={field.value ?? 0} className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("max_stock")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value) || 0)} value={field.value ?? 0} className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="barcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("barcode") || "Código de Barras"}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t("optional") || "Opcional"} value={field.value || ""} className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">{t("storage_location")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Prateleira A1" value={field.value || ""} className="text-sm sm:text-base h-10 sm:h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" className="w-full text-sm sm:text-base py-2 sm:py-2.5 mt-2 sm:mt-4">
                        {editingProduct ? t("update_product") : t("create_product")}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {/* Search Bar and View Toggle */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder={t("search_products")}
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "grid" | "list")}>
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                      <Grid3x3 className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_CATEGORIES.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                      {category.id !== "all" && (
                        <Badge variant="secondary" className="ml-2">
                          {productsList.filter((p: any) => 
                            Array.isArray(p.tags) && p.tags.includes(category.id)
                          ).length}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Products View */}
              {isLoading ? (
                viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-slate-100 rounded-lg p-4 h-48"></div>
                    ))}
                  </div>
                ) : (
                  <div className="animate-pulse space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-slate-100 rounded-lg h-16"></div>
                    ))}
                  </div>
                )
              ) : (filteredProducts && filteredProducts.length > 0) ? (
                viewMode === "grid" ? (
                  // GRID VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product: any) => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-pink-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{product.name}</h3>
                              <p className="text-xs text-slate-500">{product.code}</p>
                            </div>
                          </div>
                          {!product.isActive && (
                            <Badge variant="outline" className="text-xs">Inactive</Badge>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">{t("sale_price_nzd")}</span>
                            <span className="font-bold text-pink-600">
                              {formatCurrency(parseFloat(product.price || 0))}
                            </span>
                          </div>
                          {product.costPrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">{t("cost_price_nzd")}</span>
                              <span className="text-sm text-slate-500">
                                {formatCurrency(parseFloat(product.costPrice))}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">{t("current_stock")}</span>
                            <span className={`text-sm font-medium ${
                              (product.currentStock || 0) <= (product.minStock || 0)
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}>
                              {product.currentStock || 0} {product.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                ) : (
                  // LIST VIEW (Table)
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">{t("name")}</TableHead>
                          <TableHead>{t("product_code")}</TableHead>
                          <TableHead>{t("category")}</TableHead>
                          <TableHead className="text-right">{t("price") || "Preço"}</TableHead>
                          <TableHead className="text-right">{t("current_stock")}</TableHead>
                          <TableHead className="text-right">{t("status")}</TableHead>
                          <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product: any) => {
                          const category = PRODUCT_CATEGORIES.find(cat => 
                            Array.isArray(product.tags) && product.tags.includes(cat.id)
                          );
                          
                          return (
                            <TableRow key={product.id} className="hover:bg-slate-50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-pink-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{product.name}</p>
                                    {product.description && (
                                      <p className="text-xs text-slate-500 line-clamp-1">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-slate-600">
                                {product.code}
                              </TableCell>
                              <TableCell>
                                {category ? (
                                  <Badge variant="outline" className="text-xs">
                                    {category.name}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-pink-600">
                                {formatCurrency(parseFloat(product.price || 0))}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${
                                  (product.currentStock || 0) <= (product.minStock || 0)
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}>
                                  {product.currentStock || 0} {product.unit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {product.isActive !== false ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {t("active")}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                    {t("inactive")}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(product)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(product.id, product.name)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("no_products_found")}</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm ? t("try_different_search") : t("start_adding_product")}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleAddNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t("add_product")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products Dialog */}
          <Dialog open={isLowStockDialogOpen} onOpenChange={setIsLowStockDialogOpen}>
            <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  {t("products_low_stock")} ({lowStockProducts.length})
                </DialogTitle>
              </DialogHeader>
              
              {lowStockProducts.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("all_products_well_stocked")}</h3>
                  <p className="text-slate-500">{t("no_products_below_minimum")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">{t("name")}</TableHead>
                          <TableHead>{t("product_code")}</TableHead>
                          <TableHead className="text-right">{t("current_stock_label")}</TableHead>
                          <TableHead className="text-right">{t("min_stock_label")}</TableHead>
                          <TableHead className="text-right">{t("difference")}</TableHead>
                          <TableHead className="text-right">{t("unit") || "Unidade"}</TableHead>
                          <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockProducts.map((product: any) => {
                          const currentStock = product.currentStock || 0;
                          const minStock = product.minStock || 0;
                          const difference = currentStock - minStock;
                          const stockPercentage = minStock > 0 ? (currentStock / minStock) * 100 : 0;
                          
                          return (
                            <TableRow key={product.id} className="hover:bg-red-50/50">
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-900">{product.name}</p>
                                    {product.description && (
                                      <p className="text-xs text-slate-500 line-clamp-1">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-slate-600">
                                {product.code}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-bold ${
                                  currentStock === 0 
                                    ? 'text-red-600' 
                                    : currentStock <= minStock / 2 
                                    ? 'text-orange-600' 
                                    : 'text-yellow-600'
                                }`}>
                                  {currentStock}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-slate-600">
                                {minStock}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-semibold ${
                                  difference < 0 ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {difference >= 0 ? '+' : ''}{difference}
                                </span>
                                <div className="w-20 h-2 bg-slate-200 rounded-full mt-1 ml-auto">
                                  <div 
                                    className={`h-full rounded-full ${
                                      stockPercentage === 0 
                                        ? 'bg-red-600' 
                                        : stockPercentage < 50 
                                        ? 'bg-orange-500' 
                                        : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${Math.min(Math.max(stockPercentage, 0), 100)}%` }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-slate-600">
                                {product.unit || 'un'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      handleEdit(product);
                                      setIsLowStockDialogOpen(false);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">{t("low_stock_alert")}</p>
                        <p>
                          {t("reorder_message")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

