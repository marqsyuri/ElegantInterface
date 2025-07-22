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
import { z } from "zod";

const transactionFormSchema = insertTransactionSchema.extend({
  transactionDate: z.string().min(1, "Data é obrigatória"),
}).omit({ userId: true });

type TransactionFormData = z.infer<typeof transactionFormSchema>;

export default function Financial() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">("income");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "income",
      isPaid: true,
    },
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
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
        title: "Sucesso",
        description: "Transação adicionada com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar transação. Tente novamente.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      <Sidebar />
      
      <main className="ml-64">
        <TopHeader title="Gestão Financeira" subtitle="Controle suas receitas, despesas e relatórios" />
        
        <div className="p-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Controle Financeiro</CardTitle>
              <div className="flex space-x-3">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      onClick={() => setTransactionType("income")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Receita
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
                      Despesa
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Transações Recentes</h4>
                  <div className="space-y-3">
                    {transactionsLoading ? (
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
                                {new Date(transaction.transactionDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <span className={`font-semibold ${
                            transaction.type === 'income' 
                              ? 'text-emerald-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'} R$ {parseFloat(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">Nenhuma transação registrada</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-4">Resumo Financeiro</h4>
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                      <h5 className="font-medium text-slate-900 mb-3">Resumo do Mês</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Total Receitas</p>
                          <p className="text-xl font-bold text-emerald-600">
                            R$ {statsLoading ? "..." : parseFloat(stats?.monthlyRevenue || "0").toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Total Despesas</p>
                          <p className="text-xl font-bold text-red-600">
                            R$ {statsLoading ? "..." : parseFloat(stats?.monthlyExpenses || "0").toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/50">
                        <p className="text-sm text-slate-600">Lucro Líquido</p>
                        <p className="text-2xl font-bold text-slate-900">
                          R$ {statsLoading ? "..." : parseFloat(stats?.netProfit || "0").toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-slate-900 mb-3">Adicionar Transação</h5>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              Nova {transactionType === 'income' ? 'Receita' : 'Despesa'}
                            </DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: Limpeza facial - Cliente" {...field} />
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
                                      <FormLabel>Valor</FormLabel>
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
                                      <FormLabel>Data</FormLabel>
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
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {transactionType === 'income' ? (
                                          <>
                                            <SelectItem value="procedimento">Procedimento</SelectItem>
                                            <SelectItem value="consulta">Consulta</SelectItem>
                                            <SelectItem value="produto">Venda de Produto</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
                                          </>
                                        ) : (
                                          <>
                                            <SelectItem value="material">Material</SelectItem>
                                            <SelectItem value="equipamento">Equipamento</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                            <SelectItem value="aluguel">Aluguel</SelectItem>
                                            <SelectItem value="outros">Outros</SelectItem>
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
                                  {createTransactionMutation.isPending ? "Salvando..." : "Adicionar Transação"}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                  Cancelar
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
                        Adicionar Nova Transação
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
