import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, Minus, TrendingUp, TrendingDown, DollarSign, 
  Calendar as CalendarIcon, ShoppingBag, CreditCard, ArrowUpRight, ArrowDownRight, Filter, X
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, ReferenceLine, ComposedChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, subDays, startOfDay, isSameDay, parseISO } from "date-fns";
import { insertTransactionSchema, type Transaction } from "@shared/schema";
import Sales from "@/pages/Sales";

// Expense Form Schema (reused)
const transactionFormSchema = insertTransactionSchema.extend({
  transactionDate: z.string().min(1, "Data é obrigatória"),
}).omit({ userId: true });

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export default function FinancialDashboard() {
  const { t, formatCurrency } = useLocale();
  const { isExpanded } = useSidebar();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);

  // Queries
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ["/api/appointments/all"],
  });

  // Combined Transactions Logic (Unified Data Source)
  const combinedTransactions = useMemo(() => {
    // 1. Start with manual transactions
    const baseTransactions = transactions.map((t: any) => {
      // Determines if manually created or linked to appointment
      const isAppointmentLinked = t.appointmentId !== null && t.appointmentId !== undefined;
      return {
        ...t,
        originalSource: isAppointmentLinked ? 'appointment' : 'transaction', // can be 'sale' later if logic exists
      };
    });

    // 2. Identify Appointments that are PAID but don't have a linked transaction
    // First, find all appointmentIds that already exist in transactions
    const appointmentIdsWithTransactions = new Set(
      transactions
        .filter((t: any) => t.appointmentId)
        .map((t: any) => t.appointmentId)
    );

    // Filter "Orphan" Appointments (Paid, but no transaction record found)
    const orphanAppointments = appointments.filter((apt: any) => {
      const isPaid = parseFloat(apt.paidAmount || '0') > 0;
      const hasTransaction = appointmentIdsWithTransactions.has(apt.id);
      return isPaid && !hasTransaction;
    });

    // Transform orphans into transaction-like objects
    const appointmentTransactions = orphanAppointments.map((apt: any) => ({
      id: `apt-${apt.id}`, // Virtual ID
      type: 'income',
      description: `Agendamento - ${apt.client?.name || 'Cliente'} (${apt.service?.name || 'Serviço'})`, // Use available data
      amount: apt.paidAmount,
      transactionDate: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString() : new Date().toISOString(),
      category: 'consultation',
      status: 'completed',
      originalSource: 'appointment',
      isPaid: true
    }));

    // 3. Transform Sales into transaction-like objects
     // Since createSale does not automatically create a transaction (verified in storage.ts),
     // we must include them here to reflect revenue.
     const salesTransactions = sales.map((sale: any) => ({
       id: `sale-${sale.id}`, // Virtual ID
       type: 'income',
       description: `Venda - ${sale.client?.name || 'Cliente Balcão'}`,
       amount: sale.total,
       transactionDate: sale.saleDate ? new Date(sale.saleDate).toISOString() : new Date().toISOString(),
       category: 'sales',
       status: 'completed',
       originalSource: 'sale',
       isPaid: true
     }));

    return [...baseTransactions, ...appointmentTransactions, ...salesTransactions].sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
  }, [transactions, appointments, sales]);

  // Transaction Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'month'>('all'); 
  
  // Advanced Date Filter State
  const [filterOperator, setFilterOperator] = useState<'between' | 'equals' | 'greater' | 'less'>('between');
  const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: new Date(),
  });

  const filteredTransactions = useMemo(() => {
    let result = combinedTransactions;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Quick Filter (Month) - Overrides advanced config if active
    if (filterPeriod === 'month') {
      result = result.filter((t: any) => {
        const d = parseISO(t.transactionDate.toString());
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } 
    // 2. Advanced Operators
    else if (filterPeriod === 'all') {
       if (filterOperator === 'between' && dateRange?.from) {
         result = result.filter((t: any) => {
           const d = parseISO(t.transactionDate.toString());
           if (!dateRange.to) return d >= dateRange.from!;
           return d >= dateRange.from! && d <= dateRange.to;
         });
       } else if (singleDate) {
         const target = startOfDay(singleDate);
         result = result.filter((t: any) => {
           const d = parseISO(t.transactionDate.toString());
           if (filterOperator === 'equals') return isSameDay(d, target);
           if (filterOperator === 'greater') return d > target;
           if (filterOperator === 'less') return d < target;
           return true;
         });
       }
    }

    if (filterType !== 'all') {
      result = result.filter((t: any) => t.type === filterType);
    }

    return result.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [combinedTransactions, filterType, filterPeriod, dateRange, filterOperator, singleDate]);

  // Handle KPI Click
  const handleKpiClick = (type: 'income' | 'expense' | 'balance') => {
    setFilterPeriod('month'); 
    setDateRange(undefined); 
    if (type === 'balance') setFilterType('all');
    else setFilterType(type);
    setActiveTab('transactions');
  };

  // Calculate Financial Health (Last 30 Days)
  const financialData = useMemo(() => {
    const days = 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const data = [];

    // Use combinedTransactions for the chart
    const sourceData = combinedTransactions;

    for (let i = 0; i <= days; i++) {
      const currentDate = subDays(endDate, days - i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Expenses
      const dayExpenses = sourceData
        .filter((t) => 
          t.type === 'expense' && 
          isSameDay(parseISO(t.transactionDate.toString()), currentDate)
        )
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      // Income Breakdown
      const dayTransactions = sourceData.filter((t) => 
          t.type === 'income' && 
          isSameDay(parseISO(t.transactionDate.toString()), currentDate)
      );

      const incomeAppointments = dayTransactions
        .filter(t => t.originalSource === 'appointment')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const incomeSales = dayTransactions
        .filter(t => t.originalSource === 'sale' || t.category === 'sales') // Check both to be safe
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const incomeManual = dayTransactions
        .filter(t => t.originalSource !== 'appointment' && t.originalSource !== 'sale' && t.category !== 'sales')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

      const totalIncome = incomeAppointments + incomeSales + incomeManual;

      data.push({
        date: format(currentDate, 'dd/MM'),
        income: totalIncome,
        incomeAppointments,
        incomeSales,
        incomeManual,
        expense: -dayExpenses, // Negative for plotting downwards
        profit: totalIncome - dayExpenses
      });
    }
    return data;
  }, [combinedTransactions]);

  // KPIs
  const kpiStats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthTransactions = combinedTransactions.filter((t) => {
      const d = parseISO(t.transactionDate.toString());
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [combinedTransactions]);

  // Expense Form
  const expenseForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "expense",
      isPaid: true,
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Find the "income" payload which represents the total
      const totalIncomeEntry = payload.find((p: any) => p.dataKey === 'income');
      const totalValue = totalIncomeEntry ? totalIncomeEntry.value : 0;

      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900 mb-2 border-b pb-2 flex justify-between items-center gap-4">
            <span>{label}</span>
            <span className="text-emerald-600 font-bold">Total: {formatCurrency(totalValue)}</span>
          </p>
          {payload.map((entry: any, index: number) => {
             // Hide checking items with value 0 to keep tooltip clean, optional
             // Hide 'income' (Total) from the list since it's now in the header
             if ((Math.abs(entry.value) === 0 && entry.name !== 'Saldo') || entry.dataKey === 'income') return null;
             
             return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-600 capitalize">{entry.name}:</span>
                <span className="font-medium ml-auto">
                  {formatCurrency(Math.abs(entry.value))}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const createExpenseMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      await apiRequest('POST', '/api/transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsExpenseDialogOpen(false);
      expenseForm.reset();
      toast({ title: t('success'), description: "Despesa registrada com sucesso!" });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className={`${isExpanded ? 'lg:ml-72' : 'lg:ml-16'} transition-all duration-300`}>
        <TopHeader title="Gestão Financeira" subtitle="Controle completo do seu fluxo de caixa" />
        
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              className="border-emerald-100 bg-emerald-50/50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleKpiClick('income')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">Receita Mensal</p>
                    <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(kpiStats.income)}</h3>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xs text-emerald-600/60 mt-2">Clique para ver detalhes</p>
              </CardContent>
            </Card>

            <Card 
              className="border-rose-100 bg-rose-50/50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleKpiClick('expense')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-rose-600 mb-1">Despesa Mensal</p>
                    <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(kpiStats.expense)}</h3>
                  </div>
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  </div>
                </div>
                <p className="text-xs text-rose-600/60 mt-2">Clique para ver detalhes</p>
              </CardContent>
            </Card>

            <Card 
              className="border-blue-100 bg-blue-50/50 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleKpiClick('balance')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Saldo Líquido</p>
                    <h3 className={`text-3xl font-bold ${kpiStats.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                      {formatCurrency(kpiStats.balance)}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-blue-600/60 mt-2">Clique para ver detalhes</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-4">
             {/* New Sale Button */}
             <Button 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                onClick={() => {
                  setActiveTab("sales");
                }}
             >
                <Plus className="w-5 h-5 mr-2" />
                Nova Venda
             </Button>

             <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 shadow-sm"
                >
                  <Minus className="w-5 h-5 mr-2" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Registrar Nova Despesa</DialogTitle>
                </DialogHeader>
                <Form {...expenseForm}>
                  <form onSubmit={expenseForm.handleSubmit((data) => createExpenseMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={expenseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("description")}</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Conta de Luz, Aluguel..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={expenseForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("amount")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={expenseForm.control}
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
                      control={expenseForm.control}
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
                              <SelectItem value="marketing">{t("marketing")}</SelectItem>
                              <SelectItem value="rent">{t("rent")}</SelectItem>
                              <SelectItem value="utilities">{t("utilities")}</SelectItem>
                              <SelectItem value="supplies">{t("supplies")}</SelectItem>
                              <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
                              <SelectItem value="insurance">{t("insurance")}</SelectItem>
                              <SelectItem value="professional">{t("professional_services")}</SelectItem>
                              <SelectItem value="other">{t("other_category")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? t("saving") : "Confirmar Despesa"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto grid grid-cols-3 md:flex">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-lg">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-lg">
                Vendas
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 rounded-lg">
                Transações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
               <Card>
                 <CardHeader>
                   <CardTitle>Fluxo de Caixa (30 Dias)</CardTitle>
                   <CardDescription>
                     Receita detalhada por Agendamentos, Vendas e Outros
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={financialData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                         <defs>
                           <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                           </linearGradient>
                           <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                             <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                         <XAxis 
                           dataKey="date" 
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#64748b', fontSize: 12 }}
                           dy={10}
                         />
                         <YAxis 
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#64748b', fontSize: 12 }}
                           tickFormatter={(value) => formatCurrency(Math.abs(value))}
                         />
                         <Tooltip content={<CustomTooltip />} />
                         <Legend />
                         <ReferenceLine y={0} stroke="#94a3b8" />
                         
                         {/* Total Income Background Area */}
                         <Area 
                           type="monotone" 
                           dataKey="income" 
                           name="Total Receita"
                           stroke="#10b981" 
                           strokeWidth={1}
                           fillOpacity={1} 
                           fill="url(#colorIncome)" 
                         />

                         {/* Breakdown Lines */}
                         <Line 
                           type="monotone" 
                           dataKey="incomeAppointments" 
                           name="Agendamentos"
                           stroke="#059669" 
                           strokeWidth={2}
                           dot={{ r: 3, strokeWidth: 1 }}
                           activeDot={{ r: 5 }}
                         />
                         <Line 
                           type="monotone" 
                           dataKey="incomeSales" 
                           name="Vendas"
                           stroke="#8b5cf6" 
                           strokeWidth={2}
                           dot={{ r: 3, strokeWidth: 1 }}
                           activeDot={{ r: 5 }}
                         />
                          <Line 
                           type="monotone" 
                           dataKey="incomeManual" 
                           name="Outros"
                           stroke="#10b981" 
                           strokeWidth={2}
                           strokeDasharray="5 5"
                           dot={false}
                         />

                         {/* Expenses (Negative) */}
                         <Area 
                           type="monotone" 
                           dataKey="expense" 
                           name="Despesas"
                           stroke="#f43f5e" 
                           strokeWidth={2}
                           fillOpacity={1} 
                           fill="url(#colorExpense)" 
                         />
                       </ComposedChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

            <TabsContent value="sales">
              <Sales />
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Histórico de Transações
                    {filterPeriod === 'month' && <span className="text-sm font-normal text-slate-500 ml-2">(Este Mês)</span>}
                    {filterType !== 'all' && <span className="text-sm font-normal text-slate-500 ml-2">({filterType === 'income' ? 'Receitas' : 'Despesas'})</span>}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type Selector */}
                    <Select
                      value={filterType}
                      onValueChange={(val: 'all' | 'income' | 'expense') => setFilterType(val)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="income">Entradas (+)</SelectItem>
                        <SelectItem value="expense">Saídas (-)</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Operator Selector */}
                    <Select 
                      value={filterPeriod === 'month' ? 'month' : filterOperator} 
                      onValueChange={(val) => {
                        if (val === 'month') {
                          setFilterPeriod('month');
                        } else {
                          setFilterPeriod('all');
                          setFilterOperator(val as any);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo de Filtro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Este Mês (Rápido)</SelectItem>
                        <SelectItem value="between">Período (Entre)</SelectItem>
                        <SelectItem value="equals">Igual a</SelectItem>
                        <SelectItem value="greater">Maior que</SelectItem>
                        <SelectItem value="less">Menor que</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Conditional Date Picker */}
                    {filterPeriod !== 'month' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] justify-start text-left font-normal",
                              !dateRange && !singleDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterOperator === 'between' ? (
                              dateRange?.from ? (
                                dateRange.to ? (
                                  <>{format(dateRange.from, "dd/MM/y")} - {format(dateRange.to, "dd/MM/y")}</>
                                ) : (
                                  format(dateRange.from, "dd/MM/y")
                                )
                              ) : <span>Selecione período</span>
                            ) : (
                              singleDate ? format(singleDate, "dd/MM/y") : <span>Selecione uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            initialFocus
                            mode={filterOperator === 'between' ? "range" : "single"}
                            defaultMonth={filterOperator === 'between' ? dateRange?.from : singleDate}
                            selected={filterOperator === 'between' ? dateRange : singleDate}
                            onSelect={(val: any) => {
                               if (filterOperator === 'between') setDateRange(val);
                               else setSingleDate(val);
                            }}
                            numberOfMonths={filterOperator === 'between' ? 2 : 1}
                          />
                        </PopoverContent>
                      </Popover>
                    )}

                    {(filterPeriod !== 'all' || filterType !== 'all' || (filterOperator === 'between' ? dateRange?.from : singleDate)) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setFilterPeriod('all');
                          setFilterType('all');
                          setFilterOperator('between');
                          setDateRange({ from: startOfDay(subDays(new Date(), 30)), to: new Date() });
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Limpar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                             Nenhuma transação encontrada com os filtros selecionados.
                           </TableCell>
                         </TableRow>
                      ) : (
                        filteredTransactions.slice(0, 50).map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell>{format(parseISO(t.transactionDate), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <div>{t.description}</div>
                            {t.originalSource === 'appointment' && (
                              <Badge variant="secondary" className="mt-1 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
                                Agendamento
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{t.category}</Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'} {formatCurrency(parseFloat(t.amount))}
                          </TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
