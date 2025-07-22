import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Search, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertClientSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const clientFormSchema = insertClientSchema.extend({
  birthDate: z.string().optional(),
}).omit({ userId: true });

type ClientFormData = z.infer<typeof clientFormSchema>;

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      isActive: true,
      loyaltyPoints: 0,
    },
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const clientData = {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : null,
      };
      await apiRequest('POST', '/api/clients', clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Cliente cadastrada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao cadastrar cliente. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormData) => {
    createClientMutation.mutate(data);
  };

  const filteredClients = clients?.filter((client: any) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-64">
        <TopHeader title="Clientes" subtitle="Gerencie o cadastro e prontuários das suas clientes" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Cadastro de Clientes</CardTitle>
              <div className="flex space-x-3">
                <div className="relative">
                  <Input 
                    placeholder="Buscar clientes..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nova Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Nova Cliente</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome da cliente" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="cpf"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl>
                                  <Input placeholder="000.000.000-00" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input placeholder="(11) 99999-9999" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Nascimento</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="cliente@email.com" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="healthHistory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Histórico de Saúde</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Alergias, medicamentos, condições relevantes..." 
                                  className="h-20"
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex space-x-3">
                          <Button type="submit" disabled={createClientMutation.isPending}>
                            {createClientMutation.isPending ? "Salvando..." : "Salvar Cliente"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {clientsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client: any) => (
                    <div key={client.id} className="flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="" alt="Foto do cliente" />
                        <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 flex-1">
                        <p className="font-medium text-slate-900">{client.name}</p>
                        <p className="text-sm text-slate-600">{client.phone}</p>
                        <p className="text-xs text-slate-500">
                          {client.email && `${client.email} • `}
                          {client.loyaltyPoints} pontos
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={client.isActive ? "default" : "secondary"}>
                          {client.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      {searchQuery ? "Nenhuma cliente encontrada" : "Nenhuma cliente cadastrada"}
                    </p>
                    {!searchQuery && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Cadastrar primeira cliente
                      </Button>
                    )}
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
