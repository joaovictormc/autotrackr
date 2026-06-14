import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Stack, Switch, TextField, Button, Chip,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, FormControlLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, IconButton,
} from '@mui/material';
import { Star, Trash2, Plus } from 'lucide-react';
import { useSnackbar } from 'notistack';
import {
  billingApi, Gateway, Coupon, PaymentProvider, CreateCouponInput,
} from '../../api/billing.api';

const GATEWAY_FIELDS: Record<PaymentProvider, { key: string; label: string }[]> = {
  PIX_DIRETO: [
    { key: 'pixKey', label: 'Chave Pix' },
    { key: 'receiverName', label: 'Nome do recebedor' },
  ],
  MERCADO_PAGO: [{ key: 'accessToken', label: 'Access Token' }],
  STRIPE: [
    { key: 'secretKey', label: 'Secret Key' },
    { key: 'priceId', label: 'Price ID' },
  ],
};

function GatewaysTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Gateway>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    billingApi.listGateways()
      .then((gs) => {
        setGateways(gs);
        setDrafts(Object.fromEntries(gs.map((g) => [g.provider, g])));
      })
      .catch(() => enqueueSnackbar('Erro ao carregar gateways.', { variant: 'error' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const patch = (provider: PaymentProvider, p: Partial<Gateway>) =>
    setDrafts((d) => ({ ...d, [provider]: { ...d[provider], ...p } }));

  const save = async (g: Gateway) => {
    setBusy(g.provider);
    try {
      await billingApi.upsertGateway(g.provider, { label: g.label, enabled: g.enabled, config: g.config ?? {} });
      enqueueSnackbar(`${g.label} salvo.`, { variant: 'success' });
      load();
    } catch {
      enqueueSnackbar('Erro ao salvar gateway.', { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const makeDefault = async (provider: PaymentProvider) => {
    setBusy(provider);
    try {
      await billingApi.setDefaultGateway(provider);
      enqueueSnackbar('Gateway padrão definido.', { variant: 'success' });
      load();
    } catch {
      enqueueSnackbar('Erro ao definir padrão.', { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Stack spacing={2}>
      {gateways.map((g) => {
        const d = drafts[g.provider] ?? g;
        return (
          <Card key={g.provider} variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6">{g.label}</Typography>
                  {g.isDefault && <Chip size="small" color="primary" icon={<Star size={13} />} label="Padrão" />}
                </Stack>
                <FormControlLabel
                  control={<Switch checked={d.enabled} onChange={(e) => patch(g.provider, { enabled: e.target.checked })} />}
                  label="Habilitado"
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                {GATEWAY_FIELDS[g.provider].map((f) => (
                  <TextField
                    key={f.key}
                    label={f.label}
                    size="small"
                    fullWidth
                    value={(d.config?.[f.key] as string) ?? ''}
                    onChange={(e) => patch(g.provider, { config: { ...d.config, [f.key]: e.target.value } })}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {!g.isDefault && (
                  <Button size="small" disabled={busy === g.provider} onClick={() => makeDefault(g.provider)}>
                    Tornar padrão
                  </Button>
                )}
                <Button size="small" variant="contained" disabled={busy === g.provider} onClick={() => save(d)}>
                  Salvar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

const EMPTY_COUPON: CreateCouponInput = { code: '', type: 'PERCENT', value: 10, active: true };

function CouponsTab() {
  const { enqueueSnackbar } = useSnackbar();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateCouponInput>(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    billingApi.listCoupons()
      .then(setCoupons)
      .catch(() => enqueueSnackbar('Erro ao carregar cupons.', { variant: 'error' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!form.code.trim()) return enqueueSnackbar('Informe o código.', { variant: 'warning' });
    setSaving(true);
    try {
      await billingApi.createCoupon({ ...form, code: form.code.trim().toUpperCase() });
      enqueueSnackbar('Cupom criado.', { variant: 'success' });
      setDialogOpen(false);
      setForm(EMPTY_COUPON);
      load();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Erro ao criar cupom.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await billingApi.updateCoupon(c.id, { active: !c.active });
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    } catch {
      enqueueSnackbar('Erro ao atualizar cupom.', { variant: 'error' });
    }
  };

  const remove = async (c: Coupon) => {
    try {
      await billingApi.deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
    } catch {
      enqueueSnackbar('Erro ao remover cupom.', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>
          Novo cupom
        </Button>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Desconto</TableCell>
              <TableCell>Usos</TableCell>
              <TableCell>Expira</TableCell>
              <TableCell>Ativo</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell><strong>{c.code}</strong></TableCell>
                <TableCell>{c.type === 'PERCENT' ? `${Number(c.value)}%` : `R$ ${Number(c.value).toFixed(2)}`}</TableCell>
                <TableCell>{c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}</TableCell>
                <TableCell>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}</TableCell>
                <TableCell><Switch size="small" checked={c.active} onChange={() => toggleActive(c)} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => remove(c)}><Trash2 size={16} /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>Nenhum cupom.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Novo cupom</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} fullWidth />
            <TextField select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} fullWidth>
              <MenuItem value="PERCENT">Percentual (%)</MenuItem>
              <MenuItem value="FIXED">Valor fixo (R$)</MenuItem>
            </TextField>
            <TextField type="number" label={form.type === 'PERCENT' ? 'Desconto (%)' : 'Desconto (R$)'} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} fullWidth />
            <TextField type="number" label="Limite de usos (opcional)" value={form.maxRedemptions ?? ''} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value ? Number(e.target.value) : undefined })} fullWidth />
            <TextField type="date" label="Expira em (opcional)" InputLabelProps={{ shrink: true }} value={form.expiresAt ?? ''} onChange={(e) => setForm({ ...form, expiresAt: e.target.value || undefined })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={saving} onClick={create}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function PaymentsManager() {
  const [tab, setTab] = useState(0);
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Pagamentos</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure os métodos de pagamento (incluindo Pix direto) e os cupons do plano Pro.
      </Typography>
      <Card>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Gateways" />
          <Tab label="Cupons" />
        </Tabs>
        <CardContent>
          {tab === 0 ? <GatewaysTab /> : <CouponsTab />}
        </CardContent>
      </Card>
    </Box>
  );
}
