import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Star, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertLoyaltyPackageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { z } from "zod";
import { useLocale } from "@/contexts/LocaleContext";

const { formatCurrency } = useLocale();

const packageFormSchema = insertLoyaltyPackageSchema.omit({ userId: true });
type PackageFormData = z.infer<typeof packageFormSchema>;

export default function Loyalty() {
  const { t } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      isActive: true,
      validityDays: 90,
    },
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ["/api/loyalty-packages"],
    retry: false,
  });

  const { data: clientPackages = [], isLoading: clientPackagesLoading } = useQuery({
    queryKey: ["/api/client-packages"],
    retry: false,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: loyaltySettings } = useQuery({
    queryKey: ["/api/loyalty-settings"],
    retry: false,
  });

  // Calculate loyalty points for each client
  const { data: calculatedPoints = {} } = useQuery({
    queryKey: ["/api/loyalty-points", clients.map((c: any) => c.id)],
    queryFn: async () => {
      const pointsMap: Record<number, number> = {};
      for (const client of clients) {
        try {
          const response = await fetch(`/api/loyalty-points/${client.id}`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            pointsMap[client.id] = data.points || 0;
          }
        } catch (error) {
          console.error(`Error calculating points for client ${client.id}:`, error);
        }
      }
      return pointsMap;
    },
    enabled: clients.length > 0,
    retry: false,
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const serviceData = selectedServices.map(serviceId => ({ serviceId, quantity: 1 }));
      const payload: any = {
        ...data,
        services: serviceData, // Send as array, backend will handle JSONB conversion
      };
      
      // Convert decimal fields to strings (Zod expects strings for decimal types)
      if (data.originalPrice !== undefined && data.originalPrice !== null && data.originalPrice !== '') {
        payload.originalPrice = typeof data.originalPrice === 'number' 
          ? data.originalPrice.toString() 
          : String(data.originalPrice);
      } else {
        delete payload.originalPrice;
      }
      
      if (data.discountedPrice !== undefined && data.discountedPrice !== null && data.discountedPrice !== '') {
        payload.discountedPrice = typeof data.discountedPrice === 'number' 
          ? data.discountedPrice.toString() 
          : String(data.discountedPrice);
      } else {
        delete payload.discountedPrice;
      }
      
      // Convert discountPercentage to number (it's an integer in schema)
      if (data.discountPercentage !== undefined && data.discountPercentage !== null && data.discountPercentage !== '') {
        payload.discountPercentage = typeof data.discountPercentage === 'string' 
          ? parseInt(data.discountPercentage) 
          : Number(data.discountPercentage);
      } else {
        delete payload.discountPercentage;
      }
      
      // Convert validityDays to number (it's an integer in schema)
      if (data.validityDays !== undefined && data.validityDays !== null && data.validityDays !== '') {
        payload.validityDays = typeof data.validityDays === 'string' 
          ? parseInt(data.validityDays) 
          : Number(data.validityDays);
      } else {
        delete payload.validityDays;
      }
      
      console.log("Sending payload:", payload);
      await apiRequest('POST', '/api/loyalty-packages', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-packages"] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedServices([]);
      toast({
        title: t('success'),
        description: t('created_successfully'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('failed_to_create'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Selected services:", selectedServices);
    
    if (selectedServices.length === 0) {
      toast({
        title: t('error'),
        description: t('please_select_procedure'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      createPackageMutation.mutate(data);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create package. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    toast({
      title: "Validation Error",
      description: "Please check all required fields are filled.",
      variant: "destructive",
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getLoyaltyTier = (points: number) => {
    if (points >= 600) return { name: "Gold", color: "from-primary-600 to-secondary-600" };
    if (points >= 300) return { name: "Silver", color: "from-secondary-600 to-emerald-600" };
    return { name: "Bronze", color: "from-slate-400 to-slate-600" };
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 transition-all duration-300`}>
        <TopHeader title={t('loyalty_programs')} subtitle={t('manage_packages_points') || 'Gerencie pacotes de serviços e pontos de fidelidade'} />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">
                {t('loyalty_programs')}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Gift className="w-4 h-4 mr-2" />
                    {t('create')} {t('packages_menu')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('create')} {t('packages_menu')}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("package_name")}</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Pacote Renovação" {...field} />
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
                            <FormLabel>{t("description") || "Descrição"}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrição detalhada do pacote..."
                                className="h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          {t("included_services")}
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {services?.map((service: any) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={() => handleServiceToggle(service.id)}
                              />
                              <span className="text-slate-700">
                                {service.name} (${parseFloat(service.price).toFixed(2)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("original_price")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="discountedPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("discounted_price")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <FormField
                          control={form.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("discount_percent")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="15"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="validityDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("validity_days")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="90"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createPackageMutation.isPending}>
                          {createPackageMutation.isPending ? t("creating") : t("create_package")}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">{t("available_packages")}</h4>
                  <div className="space-y-4">
                    {packagesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse p-6 border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="h-5 bg-slate-200 rounded w-32"></div>
                              <div className="h-6 bg-slate-200 rounded w-16"></div>
                            </div>
                            <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
                            <div className="flex items-center justify-between">
                              <div className="h-6 bg-slate-200 rounded w-24"></div>
                              <div className="h-8 bg-slate-200 rounded w-20"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : packages?.length > 0 ? (
                      packages.map((pkg: any) => (
                        <div key={pkg.id} className="p-6 border border-slate-200 rounded-lg hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-lg font-semibold text-slate-900">{pkg.name}</h5>
                            <Badge className="bg-primary/10 text-primary">
                              {pkg.discountPercentage}% OFF
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-4">{pkg.description}</p>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-slate-500">
                                {t("normal_price")} <span className="line-through">
                                  {formatCurrency(parseFloat(pkg.originalPrice))}
                                </span>
                              </p>
                              <p className="text-xl font-bold text-primary">
                                {formatCurrency(parseFloat(pkg.discountedPrice))}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              {t("details")}
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">{t("no_packages_created")}</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          {t("create_first_package")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">{t("loyalty_clients")}</h4>
                  <div className="space-y-4 mb-6">
                    {clients?.slice(0, 5).map((client: any) => {
                      // Use calculated points from API or fallback to stored points
                      const calculatedPointsValue = calculatedPoints[client.id] ?? client.loyaltyPoints ?? 0;
                      const tier = getLoyaltyTier(calculatedPointsValue);
                      const discountPerHundred = parseFloat(loyaltySettings?.discountPerHundredPoints?.toString() || '10.00');
                      const nextDiscount = Math.floor(calculatedPointsValue / 100) * discountPerHundred;
                      
                      return (
                        <div key={client.id} className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src="" alt="Loyalty client" />
                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <p className="font-medium text-slate-900">{client.name}</p>
                                <p className="text-sm text-slate-600">
                                  {t("client_since")} {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {calculatedPointsValue} {t("points")}
                              </p>
                              <p className="text-xs text-slate-500">{t("accumulated_points")}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className={`bg-gradient-to-r ${tier.color} text-white`}>
                              VIP {tier.name === "Gold" ? t("gold") : tier.name === "Silver" ? t("silver") : t("bronze")}
                            </Badge>
                            <p className="text-sm text-slate-600">
                              {t("next_discount")} {formatCurrency(nextDiscount)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
                      <h5 className="font-semibold text-slate-900 mb-3">{t("how_it_works")}</h5>
                      <div className="space-y-2 text-sm text-slate-700">
                        <p>• {parseFloat(loyaltySettings?.pointsPerDollar?.toString() || '1.00').toFixed(2)} {t("points_per_dollar")}</p>
                        <p>• 100 {t("points")} = {formatCurrency(parseFloat(loyaltySettings?.discountPerHundredPoints?.toString() || '10.00'))} {t("points_equals_discount")}</p>
                        <p>• {t("birthday_bonus")} {loyaltySettings?.birthdayBonusPoints || 50} {t("points")}</p>
                        <p>• {t("friend_referral")} {loyaltySettings?.referralBonusPoints || 30} {t("points")}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">{t("vip_levels")}</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                          <span className="font-medium text-slate-700">{t("bronze")}</span>
                          <span className="text-sm text-slate-600">
                            {loyaltySettings?.bronzeThreshold || 0}-{(loyaltySettings?.silverThreshold || 300) - 1} {t("points")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-200 rounded-lg">
                          <span className="font-medium text-slate-700">{t("silver")}</span>
                          <span className="text-sm text-slate-600">
                            {loyaltySettings?.silverThreshold || 300}-{(loyaltySettings?.goldThreshold || 600) - 1} {t("points")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
                          <span className="font-medium text-slate-900">{t("gold")}</span>
                          <span className="text-sm text-slate-700">
                            {loyaltySettings?.goldThreshold || 600}+ {t("points")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
