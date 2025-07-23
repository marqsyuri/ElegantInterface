import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, MessageCircle, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useAuth } from "@/hooks/useAuth";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const userFormSchema = insertUserSchema.omit({ id: true });
type UserFormData = z.infer<typeof userFormSchema>;

export default function Settings() {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      professionalRegistration: user?.professionalRegistration || "",
      specialties: user?.specialties || "",
      clinicName: user?.clinicName || "",
      clinicCnpj: user?.clinicCnpj || "",
      clinicAddress: user?.clinicAddress || "",
      clinicPhone: user?.clinicPhone || "",
      clinicWhatsapp: user?.clinicWhatsapp || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      await apiRequest('PUT', '/api/auth/user', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    updateProfileMutation.mutate(data);
  };

  const getInitials = () => {
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return "User";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-16 lg:ml-64 transition-all duration-300">
        <TopHeader title="Settings" subtitle="Manage your profile and system preferences" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Settings and Profile
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Professional Profile</h4>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="flex items-center space-x-4 mb-6">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={user?.profileImageUrl || ""} alt="Foto do perfil" />
                          <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Button type="button" variant="outline">
                            Alterar Foto
                          </Button>
                          <p className="text-sm text-slate-500 mt-1">JPG, PNG ou GIF (máx. 5MB)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="professionalRegistration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registro Profissional</FormLabel>
                              <FormControl>
                                <Input placeholder="CREF 123456-SP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="specialties"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especialidades</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva suas especialidades..."
                                className="h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-4">
                        <h5 className="font-medium text-slate-900 mb-4">Dados da Clínica</h5>
                        
                        <FormField
                          control={form.control}
                          name="clinicName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Clínica</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da clínica" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="clinicCnpj"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                  <Input placeholder="12.345.678/0001-90" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="clinicPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone Comercial</FormLabel>
                                <FormControl>
                                  <Input placeholder="(11) 3333-3333" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="clinicAddress"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>Endereço Completo</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Rua, número, bairro, cidade, CEP"
                                  className="h-20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicWhatsapp"
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>WhatsApp Business</FormLabel>
                              <FormControl>
                                <Input placeholder="(11) 99999-9999" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Notificações</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">E-mail</p>
                          <p className="text-sm text-slate-600">Receber notificações por e-mail</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, email: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">SMS</p>
                          <p className="text-sm text-slate-600">Receber notificações via SMS</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.sms}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, sms: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">Push Notifications</p>
                          <p className="text-sm text-slate-600">Notificações no navegador</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) => 
                            setNotificationSettings(prev => ({ ...prev, push: checked }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-900 mb-4">Suporte</h4>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <HelpCircle className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-slate-900">Central de Ajuda</p>
                          <p className="text-sm text-slate-600">Tutoriais e perguntas frequentes</p>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start">
                        <MessageCircle className="w-5 h-5 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-slate-900">Contato Suporte</p>
                          <p className="text-sm text-slate-600">Entre em contato conosco</p>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4">
                    <h5 className="font-semibold text-slate-900 mb-2">Plano Atual</h5>
                    <p className="text-sm text-slate-600 mb-3">Estética Pro - Gratuito</p>
                    <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                      Upgrade para Pro
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => window.location.href = "/api/logout"}
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sair da Conta
                    </Button>
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
