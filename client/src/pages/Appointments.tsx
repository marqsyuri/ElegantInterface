import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertAppointmentSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.string().min(1, "Data é obrigatória"),
  appointmentTime: z.string().min(1, "Horário é obrigatório"),
}).omit({ userId: true });

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      status: "scheduled",
    },
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", { date: selectedDate?.toISOString().split('T')[0] }],
    retry: false,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      const { appointmentDate, appointmentTime, ...appointmentData } = data;
      
      await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        appointmentDate: appointmentDateTime.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao criar agendamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", 
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const onSubmit = (data: AppointmentFormData) => {
    createAppointmentMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-64">
        <TopHeader title="Agendamentos" subtitle="Gerencie sua agenda e horários" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Agendamento Online</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma cliente" />
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
                        name="serviceId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedimento</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um procedimento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {services?.map((service: any) => (
                                  <SelectItem key={service.id} value={service.id.toString()}>
                                    {service.name} ({service.duration} min)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="appointmentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="appointmentTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horário</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um horário" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
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
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input placeholder="Observações adicionais..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex space-x-3">
                        <Button type="submit" disabled={createAppointmentMutation.isPending}>
                          {createAppointmentMutation.isPending ? "Salvando..." : "Confirmar Agendamento"}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">
                        {selectedDate?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </h4>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon">
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">
                      Agendamentos - {selectedDate?.toLocaleDateString('pt-BR')}
                    </h4>
                    <div className="space-y-3">
                      {appointmentsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse p-3 bg-slate-100 rounded-lg">
                              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : appointments?.length > 0 ? (
                        appointments.map((appointment: any) => (
                          <div key={appointment.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-900">
                                {new Date(appointment.appointmentDate).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                appointment.status === 'confirmed' 
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : appointment.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {appointment.status === 'confirmed' ? 'Confirmado' :
                                 appointment.status === 'scheduled' ? 'Agendado' : 'Pendente'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-900 font-medium">{appointment.client.name}</p>
                            <p className="text-sm text-slate-600">{appointment.service.name}</p>
                            <p className="text-xs text-slate-500">Duração: {appointment.service.duration} min</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500">Nenhum agendamento para esta data</p>
                        </div>
                      )}
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
