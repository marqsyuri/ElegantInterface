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

const transactionFormSchema = insertTransactionSchema.extend({
  transactionDate: z.string().min(1, "Date is required"),
}).omit({ userId: true });

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export default function Financial() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const { toast } = useToast();
  const { isCollapsed } = useSidebar();
  const queryClient = useQueryClient();

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
        title: "Success",
        description: "Transaction added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
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
      
      <main className="lg:ml-72 pt-16 lg:pt-0">
        <TopHeader title="Financial Management" subtitle="Control income, expenses and cash flow" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Financial Control</CardTitle>
              <div className="flex space-x-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      onClick={() => setTransactionType("income")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Income
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-red-100 text-red-700 hover:bg-red-200"
                      onClick={() => setTransactionType("expense")}
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Expense
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Recent Transactions</h4>
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
                            {transaction.type === 'income' ? '+' : '-'} ${parseFloat(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">No transactions recorded</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Appointments Revenue Section */}
                  <div className="mt-8">
                    <h4 className="font-medium text-slate-900 mb-4">Appointments Revenue</h4>
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
                                  {appointment.service?.name || 'Service'} - {appointment.client?.name || 'Client'}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {new Date(appointment.appointmentDate).toLocaleDateString('en-NZ', {
                                    weekday: 'short',
                                    day: 'numeric', 
                                    month: 'short'
                                  })} • {appointment.status}
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
                              {appointment.status === 'completed' ? '+' : ''}${parseFloat(appointment.service?.price || 0).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-500">No appointments scheduled</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Financial Summary</h4>
                  <div className="space-y-6">
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <h5 className="font-medium text-slate-900 mb-3">Monthly Summary</h5>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-green-700 font-medium">Total Income</p>
                          <p className="text-xl font-bold text-emerald-600">
                            ${statsLoading ? "..." : parseFloat(stats?.monthlyRevenue || "0").toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600">From appointments & transactions</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                          <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                          <p className="text-xl font-bold text-red-600">
                            ${statsLoading ? "..." : parseFloat(stats?.monthlyExpenses || "0").toFixed(2)}
                          </p>
                          <p className="text-xs text-red-600">Operating costs & supplies</p>
                        </div>
                      </div>
                      
                      {/* Appointments Revenue Breakdown */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700 font-medium">Completed Revenue</p>
                          <p className="text-lg font-bold text-blue-600">
                            ${appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status === 'completed')
                                .reduce((sum: number, apt: any) => sum + parseFloat(apt.service?.price || 0), 0)
                                .toFixed(2)
                            }
                          </p>
                          <p className="text-xs text-blue-600">
                            {appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status === 'completed').length
                            } completed appointments
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                          <p className="text-sm text-yellow-700 font-medium">Pending Revenue</p>
                          <p className="text-lg font-bold text-yellow-600">
                            ${appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status !== 'completed' && apt.status !== 'cancelled')
                                .reduce((sum: number, apt: any) => sum + parseFloat(apt.service?.price || 0), 0)
                                .toFixed(2)
                            }
                          </p>
                          <p className="text-xs text-yellow-600">
                            {appointmentsLoading ? "..." : 
                              appointments.filter((apt: any) => apt.status !== 'completed' && apt.status !== 'cancelled').length
                            } scheduled appointments
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600">Net Profit</p>
                            <p className="text-2xl font-bold text-slate-900">
                              ${statsLoading ? "..." : parseFloat(stats?.netProfit || "0").toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Profit Margin</p>
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
                      <h5 className="font-medium text-slate-900 mb-3">Add Transaction</h5>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              New {transactionType === 'income' ? 'Income' : 'Expense'}
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g. Facial cleansing - Client" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="amount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Amount</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="0.01"
                                          placeholder="0,00" 
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
                                      <FormLabel>Date</FormLabel>
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
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {transactionType === 'income' ? (
                                          <>
                                            <SelectItem value="treatment">Treatment</SelectItem>
                                            <SelectItem value="consultation">Consultation</SelectItem>
                                            <SelectItem value="product">Product Sale</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                          </>
                                        ) : (
                                          <>
                                            <SelectItem value="materials">Materials</SelectItem>
                                            <SelectItem value="equipment">Equipment</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="rent">Rent</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
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
                                  {createTransactionMutation.isPending ? "Saving..." : "Add Transaction"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancel
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
                        Add New Transaction
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
