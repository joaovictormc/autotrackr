import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { BarChart3, Fuel, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord } from '../api/maintenance.api';
import { fuelApi, FuelRecord, FuelType, fuelTypeInfo } from '../api/fuel.api';
import { revenueApi, RevenueRecord } from '../api/revenue.api';
import StatCard from '../components/StatCard';

const PERIODS = [
  { key: '30d', label: 'Últimos 30 dias', days: 30 },
  { key: '3m', label: 'Últimos 3 meses', days: 90 },
  { key: '6m', label: 'Últimos 6 meses', days: 180 },
  { key: '12m', label: 'Últimos 12 meses', days: 365 },
  { key: 'all', label: 'Todo o período', days: 0 },
];

const brl = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const monthKey = (d: string) => d.slice(0, 7); // YYYY-MM
const monthLabel = (key: string) => {
  const [y, m] = key.split('-');
  return `${m}/${y.slice(2)}`;
};

function avgConsumption(records: FuelRecord[]): { value: number; label: string } | null {
  const byType = new Map<FuelType, FuelRecord[]>();
  records.forEach((r) => {
    const a = byType.get(r.fuelType) ?? [];
    a.push(r);
    byType.set(r.fuelType, a);
  });
  let best: FuelType | null = null;
  let bestCount = 0;
  byType.forEach((a, t) => { if (a.length > bestCount) { bestCount = a.length; best = t; } });
  if (!best) return null;
  const recs = byType.get(best)!.slice().sort((a, b) => a.mileage - b.mileage);
  let dist = 0;
  let qty = 0;
  for (let i = 1; i < recs.length; i++) {
    if (recs[i].fullTank) {
      const d = recs[i].mileage - recs[i - 1].mileage;
      const q = parseFloat(recs[i].quantity);
      if (d > 0 && q > 0) { dist += d; qty += q; }
    }
  }
  if (qty === 0) return null;
  return { value: dist / qty, label: fuelTypeInfo(best).consumptionLabel };
}

export default function Reports() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('all');
  const [period, setPeriod] = useState('6m');
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuel, setFuel] = useState<FuelRecord[]>([]);
  const [revenue, setRevenue] = useState<RevenueRecord[]>([]);

  const C = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
  };

  useEffect(() => {
    vehiclesApi.getMyVehicles()
      .then(setVehicles)
      .catch(() => enqueueSnackbar('Erro ao carregar veículos.', { variant: 'error' }));
  }, []);

  const loadData = useCallback(async () => {
    if (vehicles.length === 0) { setLoading(false); return; }
    setLoading(true);
    const targets = vehicleId === 'all' ? vehicles : vehicles.filter((v) => v.id === vehicleId);
    try {
      const [m, f, r] = await Promise.all([
        Promise.all(targets.map((v) => maintenanceApi.getRecords(v.id).catch(() => []))).then((a) => a.flat()),
        Promise.all(targets.map((v) => fuelApi.getRecords(v.id).catch(() => []))).then((a) => a.flat()),
        Promise.all(targets.map((v) => revenueApi.getRecords(v.id).catch(() => []))).then((a) => a.flat()),
      ]);
      setMaintenance(m);
      setFuel(f);
      setRevenue(r);
    } catch {
      enqueueSnackbar('Erro ao carregar dados dos relatórios.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [vehicles, vehicleId]);

  useEffect(() => { loadData(); }, [loadData]);

  const cutoff = useMemo(() => {
    const p = PERIODS.find((x) => x.key === period)!;
    if (p.days === 0) return null;
    const d = new Date();
    d.setDate(d.getDate() - p.days);
    return d.toISOString().split('T')[0];
  }, [period]);

  const within = (dateStr: string) => !cutoff || dateStr.slice(0, 10) >= cutoff;

  const fMaint = useMemo(() => maintenance.filter((r) => within(r.date)), [maintenance, cutoff]);
  const fFuel = useMemo(() => fuel.filter((r) => within(r.date)), [fuel, cutoff]);
  const fRev = useMemo(() => revenue.filter((r) => within(r.date)), [revenue, cutoff]);

  // Totais
  const maintCost = fMaint.reduce((s, r) => s + parseFloat(r.cost ?? '0'), 0);
  const fuelCost = fFuel.reduce((s, r) => s + parseFloat(r.totalCost), 0);
  const revTotal = fRev.reduce((s, r) => s + parseFloat(r.amount), 0);
  const expenseTotal = maintCost + fuelCost;
  const balance = revTotal - expenseTotal;

  // Série mensal
  const monthly = useMemo(() => {
    const map = new Map<string, { despesa: number; receita: number; combustivel: number; manutencao: number }>();
    const ensure = (k: string) => {
      if (!map.has(k)) map.set(k, { despesa: 0, receita: 0, combustivel: 0, manutencao: 0 });
      return map.get(k)!;
    };
    fFuel.forEach((r) => { const e = ensure(monthKey(r.date)); const c = parseFloat(r.totalCost); e.combustivel += c; e.despesa += c; });
    fMaint.forEach((r) => { const e = ensure(monthKey(r.date)); const c = parseFloat(r.cost ?? '0'); e.manutencao += c; e.despesa += c; });
    fRev.forEach((r) => { const e = ensure(monthKey(r.date)); e.receita += parseFloat(r.amount); });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ mes: monthLabel(k), ...v }));
  }, [fFuel, fMaint, fRev]);

  // Despesas por categoria (pizza)
  const expenseByCategory = [
    { name: 'Combustível', value: Number(fuelCost.toFixed(2)) },
    { name: 'Manutenção', value: Number(maintCost.toFixed(2)) },
  ].filter((x) => x.value > 0);

  // Receitas por categoria
  const revByCategory = useMemo(() => {
    const map = new Map<string, number>();
    fRev.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + parseFloat(r.amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [fRev]);

  // Abastecimento
  const consumption = useMemo(() => avgConsumption(fFuel), [fFuel]);
  const totalQty = fFuel.reduce((s, r) => s + parseFloat(r.quantity), 0);
  const avgPrice = totalQty > 0 ? fuelCost / totalQty : 0;
  const fuelMileages = fFuel.map((r) => r.mileage);
  const distance = fuelMileages.length >= 2 ? Math.max(...fuelMileages) - Math.min(...fuelMileages) : 0;
  const costPerKm = distance > 0 ? fuelCost / distance : 0;

  const PIE_COLORS = [C.primary, C.error, C.warning, C.info, C.success];

  const noData = !loading && fMaint.length === 0 && fFuel.length === 0 && fRev.length === 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <BarChart3 size={24} />
        <Typography variant="h5" fontWeight={700}>Relatórios</Typography>
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Veículo" size="small" value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)} sx={{ width: { xs: '100%', sm: 320 } }}>
              <MenuItem value="all">Todos os veículos</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.brand?.name} {v.model?.name} · {v.plate}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Período" size="small" value={period}
              onChange={(e) => setPeriod(e.target.value)} sx={{ width: { xs: '100%', sm: 220 } }}>
              {PERIODS.map((p) => <MenuItem key={p.key} value={p.key}>{p.label}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Geral" />
        <Tab label="Abastecimento" />
        <Tab label="Despesas" />
        <Tab label="Receitas" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : vehicles.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary">Cadastre um veículo para ver os relatórios.</Typography></CardContent></Card>
      ) : noData ? (
        <Card><CardContent><Typography color="text.secondary">Sem dados no período selecionado.</Typography></CardContent></Card>
      ) : (
        <>
          {/* ABA GERAL */}
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingDown} title="Despesa total" value={brl(expenseTotal)} subtitle="Combustível + manutenção" color={C.error} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingUp} title="Receita total" value={brl(revTotal)} subtitle="Renda no período" color={C.success} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={Wallet} title="Saldo" value={brl(balance)} subtitle={balance >= 0 ? 'Lucro' : 'Prejuízo'} color={balance >= 0 ? C.success : C.error} />
              </Grid>

              <Grid item xs={12} md={8}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Receitas × Despesas por mês</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                      <Line type="monotone" dataKey="receita" name="Receita" stroke={C.success} strokeWidth={2} />
                      <Line type="monotone" dataKey="despesa" name="Despesa" stroke={C.error} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Distribuição de despesas</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {expenseByCategory.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
            </Grid>
          )}

          {/* ABA ABASTECIMENTO */}
          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Fuel} title="Consumo médio" value={consumption ? `${consumption.value.toFixed(1)} ${consumption.label}` : '—'} subtitle="Entre tanques cheios" color={C.primary} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Wallet} title="Custo por km" value={distance > 0 ? brl(costPerKm) : '—'} subtitle={`${distance.toLocaleString('pt-BR')} km rodados`} color={C.warning} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={TrendingDown} title="Preço médio" value={avgPrice > 0 ? brl(avgPrice) : '—'} subtitle="Por unidade" color={C.info} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Fuel} title="Total gasto" value={brl(fuelCost)} subtitle="Combustível no período" color={C.error} />
              </Grid>
              <Grid item xs={12}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Gasto com combustível por mês</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Bar dataKey="combustivel" name="Combustível" fill={C.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
            </Grid>
          )}

          {/* ABA DESPESAS */}
          {tab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <StatCard icon={Fuel} title="Combustível" value={brl(fuelCost)} color={C.primary} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={BarChart3} title="Manutenção" value={brl(maintCost)} color={C.warning} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingDown} title="Total" value={brl(expenseTotal)} color={C.error} />
              </Grid>
              <Grid item xs={12}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Despesas por mês</Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                      <Bar dataKey="combustivel" name="Combustível" stackId="a" fill={C.primary} />
                      <Bar dataKey="manutencao" name="Manutenção" stackId="a" fill={C.warning} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
            </Grid>
          )}

          {/* ABA RECEITAS */}
          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StatCard icon={TrendingUp} title="Receita total" value={brl(revTotal)} subtitle={`${fRev.length} lançamento(s)`} color={C.success} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard icon={Wallet} title="Saldo" value={brl(balance)} subtitle={balance >= 0 ? 'Lucro' : 'Prejuízo'} color={balance >= 0 ? C.success : C.error} />
              </Grid>
              <Grid item xs={12} md={7}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Receitas por mês</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Bar dataKey="receita" name="Receita" fill={C.success} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Por categoria</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={revByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {revByCategory.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
