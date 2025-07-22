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
import { z } from "zod";

const packageFormSchema = insertLoyaltyPackageSchema.omit({ userId: true });
type PackageFormData = z.infer<typeof packageFormSchema>;

export default function Loyalty() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const { toast } = useToast();
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

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const serviceData = selectedServices.map(serviceId => ({ serviceId, quantity: 1 }));
      await apiRequest('POST', '/api/loyalty-packages', {
        ...data,
        services: JSON.stringify(serviceData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty-packages"] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedServices([]);
      toast({
        title: "Sucesso",
        description: "Pacote de fidelização criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar pacote. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    if (selectedServices.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um serviço para o pacote.",
        variant: "destructive",
      });
      return;
    }
    createPackageMutation.mutate(data);
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
      
      <main className="ml-64">
        <TopHeader title="Fidelização" subtitle="Gerencie pacotes de serviços e programa de pontos" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">
                Planos de Recorrência e Fidelização
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Gift className="w-4 h-4 mr-2" />
                    Novo Plano
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Pacote</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Pacote</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Pacote Renovação" {...field} />
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
                            <FormLabel>Descrição</FormLabel>
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
                          Procedimentos Inclusos
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {services?.map((service: any) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox 
                                checked={selectedServices.includes(service.id)}
                                onCheckedChange={() => handleServiceToggle(service.id)}
                              />
                              <span className="text-slate-700">
                                {service.name} (R$ {parseFloat(service.price).toFixed(2)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço Original</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field} 
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
                              <FormLabel>Preço com Desconto</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Desconto (%)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="15"
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
                          name="validityDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Validade (dias)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="90"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createPackageMutation.isPending}>
                          {createPackageMutation.isPending ? "Criando..." : "Criar Pacote"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
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
                  <h4 className="font-medium text-slate-900 mb-4">Pacotes Disponíveis</h4>
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
                                Preço normal: <span className="line-through">
                                  R$ {parseFloat(pkg.originalPrice).toFixed(2)}
                                </span>
                              </p>
                              <p className="text-xl font-bold text-primary">
                                R$ {parseFloat(pkg.discountedPrice).toFixed(2)}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Gift className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum pacote criado</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Criar primeiro pacote
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Clientes Fidelizadas</h4>
                  <div className="space-y-4 mb-6">
                    {clients?.slice(0, 5).map((client: any) => {
                      const tier = getLoyaltyTier(client.loyaltyPoints || 0);
                      return (
                        <div key={client.id} className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src="" alt="Cliente fidelizada" />
                                <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <p className="font-medium text-slate-900">{client.name}</p>
                                <p className="text-sm text-slate-600">
                                  Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {client.loyaltyPoints || 0} pts
                              </p>
                              <p className="text-xs text-slate-500">Pontos acumulados</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className={`bg-gradient-to-r ${tier.color} text-white`}>
                              VIP {tier.name}
                            </Badge>
                            <p className="text-sm text-slate-600">
                              Próximo desconto: R$ {Math.floor((client.loyaltyPoints || 0) / 100) * 10}.00
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
                      <h5 className="font-semibold text-slate-900 mb-3">Como Funciona</h5>
                      <div className="space-y-2 text-sm text-slate-700">
                        <p>• 1 ponto = R$ 1,00 gasto</p>
                        <p>• 100 pontos = R$ 10,00 desconto</p>
                        <p>• Bônus aniversário: +50 pontos</p>
                        <p>• Indicação de amiga: +30 pontos</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-slate-900 mb-3">Níveis VIP</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                          <span className="font-medium text-slate-700">Bronze</span>
                          <span className="text-sm text-slate-600">0-299 pontos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-200 rounded-lg">
                          <span className="font-medium text-slate-700">Silver</span>
                          <span className="text-sm text-slate-600">300-599 pontos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
                          <span className="font-medium text-slate-900">Gold</span>
                          <span className="text-sm text-slate-700">600+ pontos</span>
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
