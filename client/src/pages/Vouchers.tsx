import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tag, Plus, Trash2, Edit, CheckCircle, XCircle, Copy, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Voucher {
  id: number;
  code: string;
  description: string | null;
  type: 'fixed' | 'percentage';
  value: string;
  min_purchase: string;
  max_uses: number | null;
  used_count: number;
  used_count_real: string;
  valid_from: string | null;
  valid_until: string | null;
  applicable_to: string;
  is_active: boolean;
  created_at: string;
}

const empty = (): Partial<Voucher> & { code: string; type: 'fixed' | 'percentage'; value: string } => ({
  code: '', description: '', type: 'fixed', value: '', min_purchase: '0',
  max_uses: undefined, valid_from: '', valid_until: '', applicable_to: 'all', is_active: true,
});

export default function Vouchers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usesDialogOpen, setUsesDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState(empty());
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');

  const { data: vouchers = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ['/api/vouchers'],
    queryFn: () => apiRequest('GET', '/api/vouchers').then(r => r.json()),
  });

  const { data: voucherUses = [] } = useQuery({
    queryKey: ['/api/vouchers', selectedVoucher?.id, 'uses'],
    queryFn: () => apiRequest('GET', `/api/vouchers/${selectedVoucher!.id}/uses`).then(r => r.json()),
    enabled: !!selectedVoucher && usesDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/vouchers', data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/vouchers'] }); toast({ title: "Voucher criado!" }); setDialogOpen(false); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PUT', `/api/vouchers/${id}`, data).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/vouchers'] }); toast({ title: "Voucher atualizado!" }); setDialogOpen(false); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/vouchers/${id}`).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/vouchers'] }); toast({ title: "Voucher removido" }); },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      apiRequest('PUT', `/api/vouchers/${id}`, { is_active }).then(r => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/vouchers'] }),
  });

  const openNew = () => { setForm(empty()); setIsEditing(false); setDialogOpen(true); };
  const openEdit = (v: Voucher) => {
    setForm({
      ...v,
      valid_from: v.valid_from ? v.valid_from.slice(0, 10) : '',
      valid_until: v.valid_until ? v.valid_until.slice(0, 10) : '',
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      value: parseFloat(form.value as any) || 0,
      min_purchase: parseFloat(form.min_purchase as any) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses as any) : null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
    };
    if (isEditing && selectedVoucher) updateMutation.mutate({ id: selectedVoucher.id, ...payload });
    else createMutation.mutate(payload);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado!" });
  };

  const filtered = vouchers.filter(v =>
    v.code.toLowerCase().includes(search.toLowerCase()) ||
    (v.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d: string | null) => d ? format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }) : '—';
  const isExpired = (v: Voucher) => v.valid_until && new Date(v.valid_until) < new Date();
  const isExhausted = (v: Voucher) => v.max_uses !== null && parseInt(v.used_count_real) >= v.max_uses;

  const getStatus = (v: Voucher) => {
    if (!v.is_active) return { label: 'Inativo', color: 'bg-slate-100 text-slate-600' };
    if (isExpired(v)) return { label: 'Vencido', color: 'bg-red-100 text-red-700' };
    if (isExhausted(v)) return { label: 'Esgotado', color: 'bg-orange-100 text-orange-700' };
    return { label: 'Ativo', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Tag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vouchers</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie cupons de desconto para seus clientes</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Voucher
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: vouchers.length, icon: Tag, color: 'text-blue-600' },
          { label: 'Ativos', value: vouchers.filter(v => v.is_active && !isExpired(v) && !isExhausted(v)).length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Usos totais', value: vouchers.reduce((s, v) => s + parseInt(v.used_count_real || '0'), 0), icon: Eye, color: 'text-purple-600' },
          { label: 'Vencidos/Inativos', value: vouchers.filter(v => !v.is_active || isExpired(v) || isExhausted(v)).length, icon: XCircle, color: 'text-red-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
            <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
            <div>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input placeholder="Buscar por código ou descrição..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando vouchers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
          <p className="text-muted-foreground">Nenhum voucher encontrado</p>
          <Button variant="outline" onClick={openNew} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Criar primeiro voucher</Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Código</th>
                <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                <th className="text-left px-4 py-3 font-semibold">Desconto</th>
                <th className="text-left px-4 py-3 font-semibold">Usos</th>
                <th className="text-left px-4 py-3 font-semibold">Validade</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const status = getStatus(v);
                return (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{v.code}</code>
                        <button onClick={() => copyCode(v.code)} className="text-muted-foreground hover:text-primary" title="Copiar">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{v.description || '—'}</td>
                    <td className="px-4 py-3 font-semibold">
                      {v.type === 'fixed' ? `R$ ${parseFloat(v.value).toFixed(2)}` : `${parseFloat(v.value)}%`}
                      {parseFloat(v.min_purchase) > 0 && (
                        <div className="text-xs text-muted-foreground font-normal">mín. R$ {parseFloat(v.min_purchase).toFixed(2)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedVoucher(v); setUsesDialogOpen(true); }} className="hover:underline text-primary">
                        {v.used_count_real}{v.max_uses ? ` / ${v.max_uses}` : ''}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {v.valid_until ? <span className={isExpired(v) ? 'text-red-600 font-medium' : ''}>{fmtDate(v.valid_until)}</span> : 'Sem vencimento'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleActiveMutation.mutate({ id: v.id, is_active: !v.is_active })}
                          className={`p-1.5 rounded hover:bg-muted ${v.is_active ? 'text-green-600' : 'text-slate-400'}`}
                          title={v.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {v.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setSelectedVoucher(v); openEdit(v); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remover voucher ${v.code}?`)) deleteMutation.mutate(v.id); }}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Voucher' : 'Novo Voucher'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Código *</label>
              <Input
                value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="EX: PROMO10" disabled={isEditing}
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Descrição</label>
              <Input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do voucher" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="h-9 w-full border border-input rounded-md px-3 text-sm bg-background">
                  <option value="fixed">Valor fixo (R$)</option>
                  <option value="percentage">Percentual (%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {form.type === 'fixed' ? 'Valor (R$) *' : 'Percentual (%) *'}
                </label>
                <Input type="number" min="0" max={form.type === 'percentage' ? 100 : undefined} step="0.01"
                  value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === 'fixed' ? '0.00' : '0'} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Compra mínima (R$)</label>
                <Input type="number" min="0" step="0.01" value={form.min_purchase || '0'}
                  onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Máx. usos (vazio = ilimitado)</label>
                <Input type="number" min="1" value={form.max_uses || ''}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="Ilimitado" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Válido de</label>
                <Input type="date" value={form.valid_from || ''} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Válido até</label>
                <Input type="date" value={form.valid_until || ''} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Aplicável em</label>
              <select value={form.applicable_to || 'all'} onChange={e => setForm(f => ({ ...f, applicable_to: e.target.value }))}
                className="h-9 w-full border border-input rounded-md px-3 text-sm bg-background">
                <option value="all">Tudo</option>
                <option value="services">Apenas serviços</option>
                <option value="products">Apenas produtos</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? 'Salvar' : 'Criar Voucher'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog histórico de usos */}
      <Dialog open={usesDialogOpen} onOpenChange={setUsesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Usos do voucher <code className="text-primary">{selectedVoucher?.code}</code></DialogTitle>
          </DialogHeader>
          {(voucherUses as any[]).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum uso registrado ainda</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b"><tr>
                <th className="text-left py-2">Cliente</th>
                <th className="text-right py-2">Desconto</th>
                <th className="text-right py-2">Data</th>
              </tr></thead>
              <tbody>
                {(voucherUses as any[]).map((u: any) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.client_name || '—'}</td>
                    <td className="py-2 text-right font-medium">R$ {parseFloat(u.discount_applied).toFixed(2)}</td>
                    <td className="py-2 text-right text-muted-foreground">{fmtDate(u.used_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
