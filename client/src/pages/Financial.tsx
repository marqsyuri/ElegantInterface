import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { insertTransactionSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { z } from "zod";
import { useLocale } from "@/contexts/LocaleContext";

const transactionFormSchema = insertTransactionSchema.extend({
  transactionDate: z.string().min(1, "Date is required"),
}).omit({ userId: true });

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export default function Financial() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const { toast } = useToast();
  const { isExpanded } = useSidebar();
  const queryClient = useQueryClient();
  const { formatCurrency, t } = useLocale();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "income",
      isPaid: true,
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    retry: false,
  });

  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const transactionData = {
        ...data,
        transactionDate: new Date(data.transactionDate).toISOString().split('T')[0],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : undefined,
      };
      await apiRequest('POST', '/api/transactions', transactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: t('success'),
        description: t('transaction_added'),
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

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate({
      ...data,
      type: transactionType,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} pt-16 lg:pt-0 transition-all duration-300`}>
        <TopHeader title={t('financial_management')} subtitle={t('control_revenue_expenses')} />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">{t("financial_control")}</CardTitle>
              <div className="flex space-x-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:shadow-xl hover:shadow-pink-500/25 relative overflow-hidden group"
                      onClick={() => setTransactionType("income")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm"></div>
                      <Plus className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">{t("income") || "Receita"}</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 hover:shadow-xl hover:shadow-pink-500/25 relative overflow-hidden group"
                      onClick={() => setTransactionType("expense")}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 backdrop-blur-sm"></div>
                      <Minus className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">{t("expense") || "Despesa"}</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">{t("recent_transactions")}</h4>
                  <div className="space-y-3">
                    {(transactionsLoading || appointmentsLoading) ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                                <div className="ml-4">
                                  <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                                </div>
                              </div>
                              <div className="h-4 bg-slate-200 rounded w-20"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : transactions?.length > 0 ? (
                      transactions.slice(0, 10).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'income' 
                                ? 'bg-emerald-100' 
                                : 'bg-red-100'
                            }`}>
                              {transaction.type === 'income' ? (
                                <ArrowUp className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <ArrowDown className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-slate-900">{transaction.description}</p>
                              <p className="text-sm text-slate-500">
                                {new Date(transaction.transactionDate).toLocaleDateString('en-NZ')}
                              </p>
                            </div>
                          </div>
                          <span className={`font-semibold ${
                            transaction.type === 'income' 
                              ? 'text-emerald-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(transaction.amount))}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">{t("no_transactions_recorded")}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Appointments Revenue Section */}
                  <div className="mt-8">
                    <h4 className="font-medium text-slate-900 mb-4">{t("appointment_revenue")}</h4>
                    <div className="space-y-3">
                      {appointmentsLoading ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse p-4 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-200 rounded-full"></div>
                                  <div className="ml-4">
                                    <div className="h-4 bg-blue-200 rounded w-32 mb-1"></div>
                                    <div className="h-3 bg-blue-200 rounded w-20"></div>
                                  </div>
                                </div>
                                <div className="h-4 bg-blue-200 rounded w-20"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : appointments?.length > 0 ? (
                        appointments.slice(0, 8).map((appointment: any) => (
                          <div key={appointment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                appointment.status === 'completed' 
                                  ? 'bg-green-100' 
                                  : appointment.status === 'confirmed'
                                  ? 'bg-blue-100'
                                  : 'bg-yellow-100'
                              }`}>
                                <ArrowUp className={`w-5 h-5 ${
                                  appointment.status === 'completed' 
                                    ? 'text-green-600' 
                                    : appointment.status === 'confirmed'
                                    ? 'text-blue-600'
                                    : 'text-yellow-600'
                                }`} />
                              </div>
                              <div className="ml-4">
                                <p className="font-medium text-slate-900">
                                  {appointment.allProcedures && appointment.allProcedures.length > 0 
                                    ? appointment.allProcedures.map((p: any) => p.name).join(', ')
                                    : appointment.service?.name || 'Service'
                                  } - {appointment.client?.name || 'Client'}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {new Date(appointment.appointmentDate).toLocaleDateString('en-NZ', {
                                    weekday: 'short',
                                    day: 'numeric', 
                                    month: 'short'
                                  })} • {appointment.status}
                                  {appointment.allProcedures && appointment.allProcedures.length > 1 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                      {appointment.allProcedures.length} services
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className={`font-semibold ${
                              appointment.status === 'completed' 
                                ? 'text-green-600' 
                                : appointment.status === 'confirmed'
                                ? 'text-blue-600'
                                : 'text-yellow-600'
                            }`}>
                              {appointment.status === 'completed' ? '+' : ''}{formatCurrency(parseFloat(appointment.totalAmount || appointment.service?.price || 0))}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500">{t("no_appointments_scheduled")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">{t("financial_summary")}</h4>
                  <div className="space-y-6">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-medium text-slate-900 mb-3">{t("monthly_summary")}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-green-700 font-medium">{t("total_revenue")}</p>
                          <p className="text-xl font-bold text-emerald-600">
                            {statsLoading ? "..." : formatCurrency(parseFloat(stats?.monthlyRevenue || "0"))}
                          </p>
                          <p className="text-xs text-green-600">{t("from_appointments_transactions")}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-red-700 font-medium">{t("total_expenses")}</p>
                          <p className="text-xl font-bold text-red-600">
                            {statsLoading ? "..." : formatCurrency(parseFloat(stats?.monthlyExpenses || "0"))}
                          </p>
                          <p className="text-xs text-red-600">{t("operating_costs_supplies")}</p>
                        </div>
                      </div>
                      
                      {/* Appointments Revenue Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700 font-medium">{t("completed_revenue")}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {appointmentsLoading ? "..." : formatCurrency(
                              appointments.filter((apt: any) => apt.status === 'completed')
                                .reduce((sum: number, apt: any) => sum + parseFloat(apt.totalAmount || apt.service?.price || 0), 0)
                            )}
                          </p>
                          <p className="text-xs text-blue-600">
                            {appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status === 'completed').length
                            } {t("completed_appointments")}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <p className="text-sm text-yellow-700 font-medium">{t("pending_revenue")}</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {appointmentsLoading ? "..." : formatCurrency(
                              appointments.filter((apt: any) => apt.status !== 'completed' && apt.status !== 'cancelled')
                                .reduce((sum: number, apt: any) => sum + parseFloat(apt.totalAmount || apt.service?.price || 0), 0)
                            )}
                          </p>
                          <p className="text-xs text-yellow-600">
                            {appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status !== 'completed' && apt.status !== 'cancelled').length
                            } {t("scheduled_appointments")}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">{t("net_profit")}</p>
                            <p className="text-2xl font-bold text-slate-900">
                              {statsLoading ? "..." : formatCurrency(parseFloat(stats?.netProfit || "0"))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">{t("profit_margin")}</p>
                            <p className="text-lg font-semibold text-slate-700">
                              {statsLoading ? "..." : 
                                parseFloat(stats?.monthlyRevenue || "0") > 0 ? 
                                  `${((parseFloat(stats?.netProfit || "0") / parseFloat(stats?.monthlyRevenue || "0")) * 100).toFixed(1)}%`
                                  : "0%"
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-3">{t("add_transaction")}</h5>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              {transactionType === 'income' ? t("new_income") : t("new_expense")}
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("description") || "Descrição"}</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Tratamento facial - Cliente" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <FormField
                                  control={form.control}
                                  name="amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("amount")}</FormLabel>
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
                                  name="transactionDate"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("transaction_date")}</FormLabel>
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
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("category")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={t("select_category")} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {transactionType === 'income' ? (
                                          <>
                                            <SelectItem value="treatment">{t("treatment")}</SelectItem>
                                            <SelectItem value="consultation">{t("consultation")}</SelectItem>
                                            <SelectItem value="product">{t("product_sale")}</SelectItem>
                                            <SelectItem value="other">{t("other_category")}</SelectItem>
                                          </>
                                        ) : (
                                          <>
                                            <SelectItem value="materials">{t("materials")}</SelectItem>
                                            <SelectItem value="equipment">{t("equipment")}</SelectItem>
                                            <SelectItem value="marketing">{t("marketing")}</SelectItem>
                                            <SelectItem value="rent">{t("rent")}</SelectItem>
                                            <SelectItem value="utilities">{t("utilities")}</SelectItem>
                                            <SelectItem value="supplies">{t("supplies")}</SelectItem>
                                            <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
                                            <SelectItem value="insurance">{t("insurance")}</SelectItem>
                                            <SelectItem value="professional">{t("professional_services")}</SelectItem>
                                            <SelectItem value="other">{t("other_category")}</SelectItem>
                                          </>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="flex space-x-3">
                                <Button type="submit" disabled={createTransactionMutation.isPending}>
                                  {createTransactionMutation.isPending ? t("saving") : t("add_transaction")}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  {t("cancel")}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        {t("add_new_transaction")}
                      </Button>
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
