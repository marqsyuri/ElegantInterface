import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart, Trash2, X, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocale } from "@/contexts/LocaleContext";
import { z } from "zod";
import { format } from "date-fns";

const saleFormSchema = z.object({
  saleDate: z.string().min(1, "Data é obrigatória"),
  discountPercent: z.number().min(0).max(100).default(0),
  paymentMethod: z.string().min(1, "Forma de pagamento é obrigatória"),
  notes: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleFormSchema> & { products?: SelectedProduct[] };

type SelectedProduct = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type DateFilterMode = 'none' | 'greater' | 'less' | 'range';

export default function Sales() {
  const { t, formatCurrency } = useLocale();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<number | undefined>(undefined);
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('none');
  const [dateFilterGreater, setDateFilterGreater] = useState("");
  const [dateFilterLess, setDateFilterLess] = useState("");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      saleDate: format(new Date(), "yyyy-MM-dd"),
      discountPercent: 0,
      paymentMethod: "",
      notes: "",
    },
  });

  // Construir query key com filtros de data
  const salesQueryKey = useMemo(() => {
    const params: any = {};
    if (dateFilterMode === 'greater' && dateFilterGreater) {
      params.startDate = dateFilterGreater;
    } else if (dateFilterMode === 'less' && dateFilterLess) {
      params.endDate = dateFilterLess;
    } else if (dateFilterMode === 'range' && dateFilterStart && dateFilterEnd) {
      params.startDate = dateFilterStart;
      params.endDate = dateFilterEnd;
    }
    return ["/api/sales", params];
  }, [dateFilterMode, dateFilterGreater, dateFilterLess, dateFilterStart, dateFilterEnd]);

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: salesQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFilterMode === 'greater' && dateFilterGreater) {
        params.append('startDate', dateFilterGreater);
      } else if (dateFilterMode === 'less' && dateFilterLess) {
        params.append('endDate', dateFilterLess);
      } else if (dateFilterMode === 'range' && dateFilterStart && dateFilterEnd) {
        params.append('startDate', dateFilterStart);
        params.append('endDate', dateFilterEnd);
      }
      
      const url = `/api/sales${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch sales');
      }
      return response.json();
    },
    retry: false,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    retry: false,
  });

  const filteredProducts = useMemo<any[]>(() => {
    if (!productSearch) return (products as any[]);
    const search = productSearch.toLowerCase();
    return (products as any[]).filter((p: any) =>
      p.name?.toLowerCase().includes(search) ||
      p.code?.toLowerCase().includes(search)
    );
  }, [products, productSearch]);

  const filteredClients = useMemo<any[]>(() => {
    if (!clientSearch) return (clients as any[]);
    const search = clientSearch.toLowerCase();
    return (clients as any[]).filter((c: any) =>
      c.name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.phone?.toLowerCase().includes(search)
    );
  }, [clients, clientSearch]);

  const addProduct = (product: any) => {
    const existingIndex = selectedProducts.findIndex(p => p.productId === product.id);
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setSelectedProducts(updated);
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: parseFloat(product.price || 0),
          subtotal: parseFloat(product.price || 0),
        },
      ]);
    }
    setProductSearch("");
  };

  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");

  const addCustomProduct = () => {
    if (!customItemName || !customItemPrice) return;
    
    setSelectedProducts([
      ...selectedProducts,
      {
        productId: 0, // 0 indicates custom item
        productName: customItemName,
        quantity: 1,
        unitPrice: parseFloat(customItemPrice),
        subtotal: parseFloat(customItemPrice),
      },
    ]);
    setCustomItemName("");
    setCustomItemPrice("");
  };

  const removeProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = [...selectedProducts];
    updated[index].quantity = quantity;
    updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    setSelectedProducts(updated);
  };

  const subtotal = useMemo(() => {
    return selectedProducts.reduce((sum, p) => sum + p.subtotal, 0);
  }, [selectedProducts]);

  const discountPercent = form.watch("discountPercent") || 0;
  const discountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  const createSaleMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      const saleData = {
        clientId: selectedClient || null,
        saleDate: new Date(data.saleDate).toISOString().split('T')[0],
        products: selectedProducts,
        subtotal: subtotal.toString(),
        discountPercent: (data.discountPercent || 0).toString(),
        discountAmount: discountAmount.toString(),
        total: total.toString(),
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      };
      await apiRequest('POST', '/api/sales', saleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      // Invalidar todas as queries de vendas para garantir que os filtros sejam atualizados
      queryClient.invalidateQueries({ queryKey: ["/api/sales", {}] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      setSelectedProducts([]);
      setSelectedClient(undefined);
      setProductSearch("");
      setClientSearch("");
      form.reset();
      toast({
        title: t('success'),
        description: "Venda registrada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || "Erro ao registrar venda",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaleFormData) => {
    if (selectedProducts.length === 0) {
      toast({
        title: t('error'),
        description: "Selecione pelo menos um produto",
        variant: "destructive",
      });
      return;
    }
    createSaleMutation.mutate({
      ...data,
      products: selectedProducts,
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Dinheiro",
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito",
      pix: "PIX",
      transfer: "Transferência",
      other: "Outro",
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-900">Vendas</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Venda
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Venda</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Cliente */}
                      <div className="space-y-2">
                        <Label>Cliente (Opcional)</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar cliente..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {clientSearch && filteredClients.length > 0 && (
                          <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {filteredClients.map((client: any) => (
                              <div
                                key={client.id}
                                onClick={() => {
                                  setSelectedClient(client.id);
                                  setClientSearch(client.name);
                                }}
                                className="p-2 hover:bg-slate-100 cursor-pointer"
                              >
                                <div className="font-medium">{client.name}</div>
                                <div className="text-sm text-slate-500">{client.email} • {client.phone}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedClient && (
                          <Badge className="mt-2">
                            Cliente selecionado
                            <X
                              className="w-3 h-3 ml-2 cursor-pointer"
                              onClick={() => {
                                setSelectedClient(undefined);
                                setClientSearch("");
                              }}
                            />
                          </Badge>
                        )}
                      </div>

                      {/* Data */}
                      <FormField
                        control={form.control}
                        name="saleDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Venda *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Produtos */}
                      <div className="space-y-2">
                        <Label>Produtos *</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <Input
                            placeholder="Buscar produtos..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {productSearch && filteredProducts.length > 0 && (
                          <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {filteredProducts.map((product: any) => (
                              <div
                                key={product.id}
                                onClick={() => addProduct(product)}
                                className="p-2 hover:bg-slate-100 cursor-pointer flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-slate-500">
                                    {formatCurrency(parseFloat(product.price || 0))} • Estoque: {product.currentStock || 0}
                                  </div>
                                </div>
                                <Button type="button" size="sm" variant="outline">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Custom Item Section */}
                        <div className="pt-4 border-t border-slate-100">
                          <Label className="mb-2 block text-sm font-medium text-slate-700">Adicionar Item Avulso</Label>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Input 
                                placeholder="Nome do item (ex: Taxa de Entrega)" 
                                value={customItemName}
                                onChange={(e) => setCustomItemName(e.target.value)}
                              />
                            </div>
                            <div className="w-32">
                              <Input 
                                type="number" 
                                placeholder="Preço" 
                                value={customItemPrice}
                                onChange={(e) => setCustomItemPrice(e.target.value)}
                              />
                            </div>
                            <Button type="button" onClick={addCustomProduct} variant="secondary">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Lista de produtos selecionados */}
                        {selectedProducts.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label>Produtos Selecionados</Label>
                            <div className="border rounded-lg">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Qtd</TableHead>
                                    <TableHead>Preço Unit.</TableHead>
                                    <TableHead>Subtotal</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedProducts.map((product, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{product.productName}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={product.quantity}
                                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                                          className="w-20"
                                        />
                                      </TableCell>
                                      <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                                      <TableCell>{formatCurrency(product.subtotal)}</TableCell>
                                      <TableCell>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeProduct(index)}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Resumo */}
                      {selectedProducts.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                          </div>
                          <FormField
                            control={form.control}
                            name="discountPercent"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex justify-between items-center">
                                  <FormLabel>Desconto (%):</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      className="w-24"
                                    />
                                  </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {discountPercent > 0 && (
                            <div className="flex justify-between text-red-600">
                              <span>Desconto:</span>
                              <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(total)}</span>
                          </div>
                        </div>
                      )}

                      {/* Forma de Pagamento */}
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Forma de Pagamento *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a forma de pagamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Dinheiro</SelectItem>
                                <SelectItem value="credit">Cartão de Crédito</SelectItem>
                                <SelectItem value="debit">Cartão de Débito</SelectItem>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="transfer">Transferência</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Observações */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Observações sobre a venda..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setSelectedProducts([]);
                            setSelectedClient(undefined);
                            form.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={createSaleMutation.isPending}>
                          {createSaleMutation.isPending ? "Salvando..." : "Registrar Venda"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              {/* Filtro de Data */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="flex-1">
                    <Label className="mb-2 block">Filtro de Data</Label>
                    <Select
                      value={dateFilterMode}
                      onValueChange={(value) => {
                        setDateFilterMode(value as DateFilterMode);
                        // Limpar campos ao mudar o modo
                        setDateFilterGreater("");
                        setDateFilterLess("");
                        setDateFilterStart("");
                        setDateFilterEnd("");
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Selecione o filtro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem filtro</SelectItem>
                        <SelectItem value="greater">Maior ou igual a</SelectItem>
                        <SelectItem value="less">Menor ou igual a</SelectItem>
                        <SelectItem value="range">Intervalo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Campo para "Maior ou igual a" */}
                  {dateFilterMode === 'greater' && (
                    <div className="flex-1">
                      <Label className="mb-2 block">Data</Label>
                      <Input
                        type="date"
                        value={dateFilterGreater}
                        onChange={(e) => setDateFilterGreater(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Campo para "Menor ou igual a" */}
                  {dateFilterMode === 'less' && (
                    <div className="flex-1">
                      <Label className="mb-2 block">Data</Label>
                      <Input
                        type="date"
                        value={dateFilterLess}
                        onChange={(e) => setDateFilterLess(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Campos para "Intervalo" */}
                  {dateFilterMode === 'range' && (
                    <>
                      <div className="flex-1">
                        <Label className="mb-2 block">Data Inicial</Label>
                        <Input
                          type="date"
                          value={dateFilterStart}
                          onChange={(e) => setDateFilterStart(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="mb-2 block">Data Final</Label>
                        <Input
                          type="date"
                          value={dateFilterEnd}
                          onChange={(e) => setDateFilterEnd(e.target.value)}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Botão para limpar filtro */}
                  {dateFilterMode !== 'none' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDateFilterMode('none');
                        setDateFilterGreater("");
                        setDateFilterLess("");
                        setDateFilterStart("");
                        setDateFilterEnd("");
                      }}
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>

              {salesLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : (sales as any[]).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  {dateFilterMode !== 'none' 
                    ? "Nenhuma venda encontrada com os filtros aplicados."
                    : "Nenhuma venda registrada ainda."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Produtos</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sales as any[]).map((sale: any) => (
                      <TableRow key={sale.id}>
                        <TableCell>{format(new Date(sale.saleDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{sale.client?.name || "Cliente não informado"}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {(sale.products || []).map((p: any, i: number) => (
                              <div key={i} className="text-sm">
                                {p.productName} x{p.quantity}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(sale.subtotal || 0))}</TableCell>
                        <TableCell>
                          {parseFloat(sale.discountPercent || 0) > 0 && (
                            <span className="text-red-600">
                              {sale.discountPercent}% ({formatCurrency(parseFloat(sale.discountAmount || 0))})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(parseFloat(sale.total || 0))}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getPaymentMethodLabel(sale.paymentMethod)}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
    </div>
  );
}

