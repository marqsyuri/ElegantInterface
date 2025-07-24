import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Target, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30days");
  const { isCollapsed } = useSidebar();

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
  const totalRevenue = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const totalExpenses = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  const netProfit = totalRevenue - totalExpenses;

  const activeClients = clients.filter((c: any) => c.isActive).length;
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a: any) => a.status === 'completed').length;

  // Service popularity
  const serviceStats = services.map((service: any) => {
    const serviceAppointments = appointments.filter((a: any) => a.serviceId === service.id);
    return {
      name: service.name,
      appointments: serviceAppointments.length,
      revenue: serviceAppointments.reduce((sum: number, a: any) => {
        const transaction = transactions.find((t: any) => t.appointmentId === a.id);
        return sum + (transaction ? parseFloat(transaction.amount) : 0);
      }, 0)
    };
  }).sort((a, b) => b.appointments - a.appointments);

  const dateRanges = [
    { value: "7days", label: "Last 7 days" },
    { value: "30days", label: "Last 30 days" },
    { value: "90days", label: "Last 3 months" },
    { value: "1year", label: "Last year" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <TopHeader title="Business Analytics" subtitle="Comprehensive insights into your business performance" />
        
        <div className="p-6 space-y-8">
          <section className="flex justify-end items-center">
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
          </section>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <DollarSign className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-green-600">+12% from last month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Net Profit</p>
                        <div className="text-2xl font-bold">${netProfit.toFixed(2)}</div>
                        <p className="text-xs text-emerald-600">+8% from last month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Active Clients</p>
                        <div className="text-2xl font-bold">{activeClients}</div>
                        <p className="text-xs text-blue-600">+5 new this month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-600">Appointments</p>
                        <div className="text-2xl font-bold">{totalAppointments}</div>
                        <p className="text-xs text-purple-600">{completedAppointments} completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue vs Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Revenue</span>
                        <span className="font-medium">${totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Expenses</span>
                        <span className="font-medium">${totalExpenses.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0}%` }}
                        ></div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">Net Profit</span>
                          <span className="font-bold text-emerald-600">${netProfit.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Appointment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['completed', 'confirmed', 'scheduled', 'cancelled'].map((status) => {
                        const count = appointments.filter((a: any) => a.status === status).length;
                        const percentage = totalAppointments > 0 ? (count / totalAppointments) * 100 : 0;
                        const colors = {
                          completed: 'bg-green-600',
                          confirmed: 'bg-blue-600',
                          scheduled: 'bg-yellow-600',
                          cancelled: 'bg-red-500'
                        };
                        
                        return (
                          <div key={status}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm text-slate-600 capitalize">{status}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`${colors[status as keyof typeof colors]} h-2 rounded-full`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Service Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceStats.slice(0, 5).map((service, index) => (
                      <div key={service.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-slate-900">{service.name}</p>
                            <p className="text-sm text-slate-600">{service.appointments} appointments</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">${service.revenue.toFixed(2)}</p>
                          <p className="text-sm text-slate-600">revenue</p>
                        </div>
                      </div>
                    ))}
                    {serviceStats.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No service data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Detailed revenue charts coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Client Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-slate-900 mb-4">Client Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Active Clients</span>
                          <span className="font-medium">{activeClients}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Inactive Clients</span>
                          <span className="font-medium">{clients.length - activeClients}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Clients</span>
                          <span className="font-medium">{clients.length}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 mb-4">Loyalty Points</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Total Points Issued</span>
                          <span className="font-medium">
                            {clients.reduce((sum: number, c: any) => sum + (c.loyaltyPoints || 0), 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Average Points per Client</span>
                          <span className="font-medium">
                            {clients.length > 0 
                              ? Math.round(clients.reduce((sum: number, c: any) => sum + (c.loyaltyPoints || 0), 0) / clients.length)
                              : 0
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {serviceStats.map((service, index) => (
                      <div key={service.name} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-slate-900">{service.name}</h3>
                          <Badge className="bg-primary/10 text-primary">
                            Rank #{index + 1}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">Appointments: </span>
                            <span className="font-medium">{service.appointments}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Revenue: </span>
                            <span className="font-medium">${service.revenue.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Business Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Trend analysis coming soon...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}