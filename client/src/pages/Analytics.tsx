import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TopHeader from "@/components/TopHeader";
import PageLayout from "@/components/PageLayout";
import { useLocale } from "@/contexts/LocaleContext";

export default function Analytics() {
  const { t, formatCurrency } = useLocale();
  const [dateRange, setDateRange] = useState("30days");

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics", dateRange],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    retry: false,
  });

  // Calculate analytics from existing data
  const totalRevenue = (transactions as any[])
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const totalExpenses = (transactions as any[])
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

  const netProfit = totalRevenue - totalExpenses;

  const activeClients = (clients as any[]).filter((c: any) => c.isActive).length;
  const totalAppointments = (appointments as any[]).length;
  const completedAppointments = (appointments as any[]).filter((a: any) => a.status === 'completed').length;

  // Service popularity
  const serviceStats = (services as any[]).map((service: any) => {
    const serviceAppointments = (appointments as any[]).filter((a: any) => a.serviceId === service.id);
    return {
      name: service.name,
      appointments: serviceAppointments.length,
      revenue: serviceAppointments.reduce((sum: number, a: any) => {
        const transaction = (transactions as any[]).find((t: any) => t.appointmentId === a.id);
        return sum + (transaction ? parseFloat(transaction.amount || 0) : 0);
      }, 0)
    };
  }).sort((a: any, b: any) => b.appointments - a.appointments);

  const dateRanges = [
    { value: "7days", label: t("last_7_days") || "Últimos 7 dias" },
    { value: "30days", label: t("last_30_days") || "Últimos 30 dias" },
    { value: "90days", label: t("last_3_months") || "Últimos 3 meses" },
    { value: "1year", label: t("last_year") || "Último ano" },
  ];

  return (
    <PageLayout>
      <TopHeader title={t("business_analytics")} subtitle={t("analytics_subtitle")} />
      
      <div className="p-6 space-y-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="revenue">{t("revenue")}</TabsTrigger>
              <TabsTrigger value="clients">{t("clients_analytics")}</TabsTrigger>
              <TabsTrigger value="services">{t("services_analytics")}</TabsTrigger>
            </TabsList>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="border border-green-200 bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("total_revenue")}</p>
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                      <p className="text-xs text-green-600">+12% {t("from_last_month")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-yellow-200 bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("net_profit")}</p>
                      <div className="text-2xl font-bold text-yellow-600">{formatCurrency(netProfit)}</div>
                      <p className="text-xs text-yellow-600">+8% {t("from_last_month")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("active_clients")}</p>
                      <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                      <p className="text-xs text-green-600">+5 {t("new_this_month")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-yellow-200 bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="w-8 h-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">{t("appointments")}</p>
                      <div className="text-2xl font-bold text-yellow-600">{totalAppointments}</div>
                      <p className="text-xs text-yellow-600">{completedAppointments} {t("completed")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                    {t("revenue_vs_expenses")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{t("revenue")}</span>
                      <span className="font-medium text-green-600">{formatCurrency(totalRevenue)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${totalRevenue > 0 ? (totalRevenue / (totalRevenue + totalExpenses)) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{t("total_expenses")}</span>
                      <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${totalExpenses > 0 ? (totalExpenses / (totalRevenue + totalExpenses)) * 100 : 0}%` }}
                      ></div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-800">{t("net_profit")}</span>
                        <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 text-yellow-600 mr-2" />
                    {t("appointment_success_rate")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-600 mb-2">
                      {totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0}%
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      {completedAppointments} {t("out_of")} {totalAppointments} {t("appointments_completed")}
                    </p>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-yellow-600 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle>{t("revenue_breakdown")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border border-green-200 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-green-600">{t("total_income")}</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div className="text-center p-4 border border-red-200 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-red-600">{t("total_expenses")}</h3>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="text-center p-4 border border-yellow-200 rounded-lg">
                    <Target className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-yellow-600">{t("net_profit")}</h3>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle>{t("client_statistics")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">{t("client_activity")}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>{t("total_clients")}</span>
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          {(clients as any[]).length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("active_clients")}</span>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                          {activeClients}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("inactive_clients")}</span>
                        <Badge variant="outline" className="border-slate-400 text-slate-600">
                          {(clients as any[]).length - activeClients}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">{t("loyalty_points_distribution")}</h3>
                    <div className="space-y-3">
                      {(clients as any[]).slice(0, 5).map((client: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{client.name}</span>
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            {client.loyaltyPoints || 0} {t("points")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle>{t("service_performance")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceStats.map((service: any, index: number) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-slate-600">
                            {service.appointments} {t("appointments")} • {formatCurrency(service.revenue)} {t("revenue")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            {service.appointments} {t("bookings")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {serviceStats.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t("no_service_data")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}