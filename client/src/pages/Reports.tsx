import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TrendingUp, Scissors, ShoppingBag, Calendar, DollarSign,
  Users, XCircle, Clock, Download, ChevronDown, ChevronUp
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

const fmtCurrency = (v: number) => `R$ ${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtNum = (v: number) => (v || 0).toLocaleString('pt-BR');

const PERIOD_OPTIONS = [
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
  { label: 'Personalizado', value: 'custom' },
];

function useDateRange(period: string, customStart: string, customEnd: string) {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (period === '7d')  return { startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'), endDate: today };
  if (period === '30d') return { startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), endDate: today };
  if (period === '90d') return { startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'), endDate: today };
  return { startDate: customStart || format(subDays(new Date(), 30), 'yyyy-MM-dd'), endDate: customEnd || today };
}

// ── Aba: Resumo ──────────────────────────────────────────────────────────────
function SummaryTab({ period }: { period: string }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['/api/reports/summary', period],
    queryFn: () => apiRequest('GET', `/api/reports/summary?period=${period}`).then(r => r.json()),
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!data) return null;

  const { daily = [], totals = {} } = data;

  const chartData = daily.map((d: any) => ({
    day: format(new Date(d.day + 'T12:00:00'), 'dd/MM', { locale: ptBR }),
    Receita: parseFloat(d.revenue || 0),
    Agendamentos: parseInt(d.appointments),
    Concluídos: parseInt(d.completed),
    Cancelados: parseInt(d.cancelled),
  }));

  const kpis = [
    { label: 'Receita total', value: fmtCurrency(parseFloat(totals.revenue || 0)), icon: DollarSign, color: 'text-green-600' },
    { label: 'Agendamentos', value: fmtNum(parseInt(totals.appointments || 0)), icon: Calendar, color: 'text-blue-600' },
    { label: 'Concluídos', value: fmtNum(parseInt(totals.completed || 0)), icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Cancelamentos', value: fmtNum(parseInt(totals.cancelled || 0)), icon: XCircle, color: 'text-red-500' },
    { label: 'Faltas (no-show)', value: fmtNum(parseInt(totals.no_show || 0)), icon: Clock, color: 'text-orange-500' },
    { label: 'Clientes únicos', value: fmtNum(parseInt(totals.unique_clients || 0)), icon: Users, color: 'text-purple-600' },
  ];

  const completionRate = totals.appointments > 0
    ? ((totals.completed / totals.appointments) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <k.icon className={`w-5 h-5 mb-2 ${k.color}`} />
              <div className="text-xl font-bold">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Taxa de conclusão */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-4xl font-bold text-emerald-600">{completionRate}%</div>
          <div>
            <div className="font-semibold">Taxa de conclusão</div>
            <div className="text-sm text-muted-foreground">{totals.completed} concluídos de {totals.appointments} agendamentos</div>
          </div>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden ml-4">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Gráfico receita */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold">Receita por dia</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: any) => fmtCurrency(v)} />
              <Area type="monotone" dataKey="Receita" stroke="#ec4899" fill="url(#colorReceita)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico agendamentos */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-semibold">Agendamentos por dia</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Concluídos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Cancelados" fill="#f87171" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Aba: Serviços ────────────────────────────────────────────────────────────
function ServicesTab({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [sortField, setSortField] = useState<'quantity_sold' | 'total_revenue'>('quantity_sold');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['/api/reports/services-sold', startDate, endDate],
    queryFn: () => apiRequest('GET', `/api/reports/services-sold?startDate=${startDate}&endDate=${endDate}`).then(r => r.json()),
    enabled: !!startDate && !!endDate,
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!data) return null;

  const { items = [], summary = {} } = data;
  const sorted = [...items].sort((a: any, b: any) => {
    const va = parseFloat(a[sortField]); const vb = parseFloat(b[sortField]);
    return sortAsc ? va - vb : vb - va;
  });

  const top5 = sorted.slice(0, 5).map((i: any) => ({
    name: i.procedure_name.length > 18 ? i.procedure_name.slice(0,18)+'…' : i.procedure_name,
    Qtd: parseInt(i.quantity_sold),
    Receita: parseFloat(i.total_revenue),
  }));

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <Scissors className="w-5 h-5 text-pink-500 mb-2" />
          <div className="text-2xl font-bold">{fmtNum(parseInt(summary.total_procedures || 0))}</div>
          <div className="text-xs text-muted-foreground">Procedimentos realizados</div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <DollarSign className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold">{fmtCurrency(parseFloat(summary.total_revenue || 0))}</div>
          <div className="text-xs text-muted-foreground">Receita de serviços</div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
          <div className="text-2xl font-bold">{fmtNum(parseInt(summary.unique_services || 0))}</div>
          <div className="text-xs text-muted-foreground">Tipos de serviço</div>
        </CardContent></Card>
      </div>

      {/* Gráfico top 5 */}
      {top5.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-0"><CardTitle className="text-sm font-semibold">Top 5 serviços mais realizados</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={top5} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="Qtd" fill="#ec4899" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Serviço</th>
                  <th className="text-left px-4 py-3 font-semibold">Profissional</th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer hover:text-primary" onClick={() => toggleSort('quantity_sold')}>
                    <span className="flex items-center justify-end gap-1">Qtd {sortField==='quantity_sold' ? (sortAsc ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>) : null}</span>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Preço unit.</th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer hover:text-primary" onClick={() => toggleSort('total_revenue')}>
                    <span className="flex items-center justify-end gap-1">Receita {sortField==='total_revenue' ? (sortAsc ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>) : null}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">Sem dados no período</td></tr>
                ) : sorted.map((s: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{s.procedure_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{s.staff_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{s.quantity_sold}x</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmtCurrency(parseFloat(s.unit_price || 0))}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{fmtCurrency(parseFloat(s.total_revenue || 0))}</td>
                  </tr>
                ))}
              </tbody>
              {sorted.length > 0 && (
                <tfoot className="bg-muted/30 border-t">
                  <tr>
                    <td className="px-4 py-3 font-bold" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-right font-bold">{summary.total_procedures}x</td>
                    <td />
                    <td className="px-4 py-3 text-right font-bold text-green-600">{fmtCurrency(parseFloat(summary.total_revenue || 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Aba: Produtos ────────────────────────────────────────────────────────────
function ProductsTab({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['/api/reports/products-sold', startDate, endDate],
    queryFn: () => apiRequest('GET', `/api/reports/products-sold?startDate=${startDate}&endDate=${endDate}`).then(r => r.json()),
    enabled: !!startDate && !!endDate,
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!data) return null;

  const { items = [], summary = {} } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Unidades vendidas', value: fmtNum(parseInt(summary.total_items_sold || 0)), icon: ShoppingBag, color: 'text-blue-500' },
          { label: 'Receita de produtos', value: fmtCurrency(parseFloat(summary.total_revenue || 0)), icon: DollarSign, color: 'text-green-500' },
          { label: 'Desconto concedido', value: fmtCurrency(parseFloat(summary.total_discount || 0)), icon: TrendingUp, color: 'text-orange-500' },
          { label: 'Produtos distintos', value: fmtNum(parseInt(summary.unique_products || 0)), icon: ShoppingBag, color: 'text-purple-500' },
        ].map(k => (
          <Card key={k.label} className="border-0 shadow-sm"><CardContent className="p-4">
            <k.icon className={`w-5 h-5 mb-2 ${k.color}`} />
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Produto</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoria</th>
                  <th className="text-right px-4 py-3 font-semibold">Unid.</th>
                  <th className="text-right px-4 py-3 font-semibold">Preço médio</th>
                  <th className="text-right px-4 py-3 font-semibold">Desconto</th>
                  <th className="text-right px-4 py-3 font-semibold">Receita</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Sem produtos vendidos no período</td></tr>
                ) : items.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.product_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right">{p.total_units_sold} {p.unit}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmtCurrency(parseFloat(p.avg_sale_price || 0))}</td>
                    <td className="px-4 py-3 text-right text-orange-500">
                      {parseFloat(p.total_discount_given || 0) > 0 ? `-${fmtCurrency(parseFloat(p.total_discount_given))}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{fmtCurrency(parseFloat(p.total_revenue || 0))}</td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-muted/30 border-t">
                  <tr>
                    <td className="px-4 py-3 font-bold" colSpan={2}>Total</td>
                    <td className="px-4 py-3 text-right font-bold">{summary.total_items_sold}</td>
                    <td />
                    <td className="px-4 py-3 text-right font-bold text-orange-500">
                      {parseFloat(summary.total_discount || 0) > 0 ? `-${fmtCurrency(parseFloat(summary.total_discount))}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{fmtCurrency(parseFloat(summary.total_revenue || 0))}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function Reports() {
  const [period, setPeriod] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const { startDate, endDate } = useDateRange(period, customStart, customEnd);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise de desempenho do seu negócio</p>
          </div>
        </div>

        {/* Filtro de período */}
        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_OPTIONS.map(opt => (
            <Button
              key={opt.value}
              variant={period === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className="text-xs"
            >
              {opt.label}
            </Button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-8 text-xs w-36" />
              <span className="text-muted-foreground text-xs">até</span>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-8 text-xs w-36" />
            </div>
          )}
        </div>
      </div>

      {/* Período exibido */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>
          {format(new Date(startDate + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
          {' '}→{' '}
          {format(new Date(endDate + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary">
        <TabsList className="mb-6">
          <TabsTrigger value="summary" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Resumo geral
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Scissors className="w-4 h-4" /> Serviços
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <ShoppingBag className="w-4 h-4" /> Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <SummaryTab period={period === 'custom' ? '30d' : period} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesTab startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
