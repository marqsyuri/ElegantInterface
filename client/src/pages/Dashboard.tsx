import { useQuery } from "@tanstack/react-query";
import { Calendar, DollarSign, Users, Star, ArrowUp, ArrowDown, Check, Phone, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você precisa fazer login para acessar esta página.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments", { date: new Date().toISOString().split('T')[0] }],
    retry: false,
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-64">
        <TopHeader 
          title="Dashboard" 
          subtitle="Bem-vinda de volta! Aqui está um resumo do seu dia."
        />
        
        <div className="p-6 space-y-8">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Hoje</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {statsLoading ? "..." : (stats as any)?.todayAppointments || 0}
                    </p>
                    <p className="text-xs text-emerald-600">Agendamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Receita do Dia</p>
                    <p className="text-2xl font-bold text-slate-900">
                      R$ {statsLoading ? "..." : parseFloat((stats as any)?.dailyRevenue || "0").toFixed(2)}
                    </p>
                    <p className="text-xs text-emerald-600">vs ontem</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Clientes Ativas</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {statsLoading ? "..." : (stats as any)?.activeClients || 0}
                    </p>
                    <p className="text-xs text-emerald-600">total cadastradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Star className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-slate-600">Satisfação</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {statsLoading ? "..." : (stats as any)?.satisfaction || "0.0"}
                    </p>
                    <p className="text-xs text-emerald-600">média geral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Today's Schedule and Financial Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Agenda de Hoje</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center p-4 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                          <div className="ml-4 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(todayAppointments as any)?.length > 0 ? (
                      (todayAppointments as any).slice(0, 3).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center p-4 bg-slate-50 rounded-lg">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {new Date(appointment.appointmentDate).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="font-medium text-slate-900">{appointment.client.name}</p>
                            <p className="text-sm text-slate-600">{appointment.service.name}</p>
                            <p className="text-xs text-slate-500">
                              Duração: {appointment.service.duration} min
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="icon" variant="ghost" className="text-emerald-600 hover:bg-emerald-100">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-slate-400 hover:bg-slate-100">
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhum agendamento para hoje</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-900">Resumo Financeiro</CardTitle>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-1">
                  <option>Este mês</option>
                  <option>Últimos 7 dias</option>
                </select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <ArrowUp className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Receitas</p>
                        <p className="text-xs text-slate-500">Procedimentos realizados</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">
                      R$ {statsLoading ? "..." : parseFloat((stats as any)?.monthlyRevenue || "0").toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <ArrowDown className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">Despesas</p>
                        <p className="text-xs text-slate-500">Materiais e custos</p>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">
                      R$ {statsLoading ? "..." : parseFloat((stats as any)?.monthlyExpenses || "0").toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">Lucro Líquido</span>
                      <span className="font-bold text-xl text-emerald-600">
                        R$ {statsLoading ? "..." : parseFloat((stats as any)?.netProfit || "0").toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Este mês</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
