import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, XCircle, Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertInventorySchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocale } from "@/contexts/LocaleContext";
import { z } from "zod";

const inventoryFormSchema = insertInventorySchema.omit({ userId: true });
type InventoryFormData = z.infer<typeof inventoryFormSchema>;

export default function Materials() {
  const { t } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      category: "epi",
      currentStock: 0,
      minStock: 0,
    },
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    retry: false,
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (data: InventoryFormData) => {
      await apiRequest('POST', '/api/inventory', {
        ...data,
        lastRestocked: data.lastRestocked ? new Date(data.lastRestocked).toISOString().split('T')[0] : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: t("success"),
        description: t("created_successfully"),
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

  const onSubmit = (data: InventoryFormData) => {
    createInventoryMutation.mutate(data);
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) return { status: "out", color: "red", text: t("out_of_stock") };
    if (currentStock <= minStock) return { status: "low", color: "amber", text: t("low_stock") };
    return { status: "ok", color: "emerald", text: t("stock_ok") };
  };

  // PPE checklist removed as per requirements

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 transition-all duration-300`}>
        <TopHeader title={t("inventory_control")} subtitle={t("inventory_subtitle")} />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">
                {t("personal_protection_equipment")}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    {t("add_item")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t("add_item_to_inventory")}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="itemName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("item_name")}</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Luvas descartáveis" {...field} />
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
                            <FormLabel>{t("category")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_category")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ppe">EPI</SelectItem>
                                <SelectItem value="materials">{t("materials")}</SelectItem>
                                <SelectItem value="products">{t("products_menu")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="currentStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("current_stock")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0"
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
                          name="minStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("minimum_stock")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="5"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("unit") || "Unidade"}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t("select_unit")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="units">{t("units")}</SelectItem>
                                <SelectItem value="boxes">{t("boxes")}</SelectItem>
                                <SelectItem value="packets">{t("packets")}</SelectItem>
                                <SelectItem value="bottles">{t("bottles")}</SelectItem>
                                <SelectItem value="litres">{t("litres")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastRestocked"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("last_restocked")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createInventoryMutation.isPending}>
                          {createInventoryMutation.isPending ? t("saving") : t("add_to_inventory")}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          {t("cancel")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900 mb-4">{t("inventory_management")}</h4>
                  <div className="space-y-4">
                    {inventoryLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse p-4 border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                                <div className="ml-4">
                                  <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="h-4 bg-slate-200 rounded w-16 mb-1"></div>
                                <div className="h-3 bg-slate-200 rounded w-20"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : inventory?.length > 0 ? (
                      inventory.map((item: any) => {
                        const stockStatus = getStockStatus(item.currentStock, item.minStock);
                        return (
                          <div 
                            key={item.id} 
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              stockStatus.status === "out" 
                                ? "border-red-200 bg-red-50"
                                : stockStatus.status === "low"
                                ? "border-amber-200 bg-amber-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                stockStatus.status === "out"
                                  ? "bg-red-100"
                                  : stockStatus.status === "low"
                                  ? "bg-amber-100"
                                  : "bg-slate-100"
                              }`}>
                                {stockStatus.status === "out" ? (
                                  <XCircle className="w-6 h-6 text-red-600" />
                                ) : stockStatus.status === "low" ? (
                                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                                ) : (
                                  <Package className="w-6 h-6 text-slate-600" />
                                )}
                              </div>
                              <div className="ml-4">
                                <p className="font-medium text-slate-900">{item.itemName}</p>
                                <p className="text-sm text-slate-600 capitalize">
                                  {item.category} • {item.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">
                                {item.currentStock} {item.unit}
                              </p>
                              <Badge 
                                variant={stockStatus.status === "ok" ? "default" : "destructive"}
                                className={stockStatus.status === "low" ? "bg-amber-100 text-amber-700" : ""}
                              >
                                {stockStatus.text}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">{t("no_items_in_stock")}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          {t("add_first_item")}
                        </Button>
                      </div>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
