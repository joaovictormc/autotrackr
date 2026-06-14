import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip as MuiTooltip,
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
import {
  BarChart3, Fuel, TrendingUp, TrendingDown, Wallet, Download, Lock, FileText, FileSpreadsheet,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord } from '../api/maintenance.api';
import { fuelApi, FuelRecord, FuelType, fuelTypeInfo } from '../api/fuel.api';
import { revenueApi, RevenueRecord } from '../api/revenue.api';
import { reportsApi, ReportType, ReportFormat } from '../api/reports.api';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';

const PERIODS = [
  { key: '30d', days: 30 },
  { key: '3m', days: 90 },
  { key: '6m', days: 180 },
  { key: '12m', days: 365 },
  { key: 'all', days: 0 },
];

const brl = (v: number, locale = 'pt-BR') => `R$ ${v.toLocaleString(locale, { minimumFractionDigits: 2 })}`;
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
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const numLocale = isPt ? 'pt-BR' : 'en-US';
  const money = (v: number) => brl(v, numLocale);
  const { enqueueSnackbar } = useSnackbar();
  const { isPro } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('all');
  const [period, setPeriod] = useState('6m');
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: ReportType, format: ReportFormat) => {
    setExportAnchor(null);
    if (vehicleId === 'all') return;
    setExporting(true);
    try {
      await reportsApi.download(vehicleId, type, format);
    } catch {
      enqueueSnackbar(t('plan.exportError'), { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

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
      .catch(() => enqueueSnackbar(t('common.loadDataError'), { variant: 'error' }));
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
      enqueueSnackbar(t('reports.loadError'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [vehicles, vehicleId, t]);

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
    { name: t('reports.fuel'), value: Number(fuelCost.toFixed(2)) },
    { name: t('reports.maintenance'), value: Number(maintCost.toFixed(2)) },
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
        <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>{t('reports.title')}</Typography>

        {isPro ? (
          <MuiTooltip title={vehicleId === 'all' ? t('plan.selectVehicleToExport') : ''}>
            <span>
              <Button
                variant="outlined"
                startIcon={exporting ? <CircularProgress size={16} /> : <Download size={16} />}
                onClick={(e) => setExportAnchor(e.currentTarget)}
                disabled={vehicleId === 'all' || exporting}
              >
                {t('plan.export')}
              </Button>
            </span>
          </MuiTooltip>
        ) : (
          <MuiTooltip title={t('plan.proOnly')}>
            <span>
              <Button variant="outlined" startIcon={<Lock size={16} />} disabled>
                {t('plan.export')}
              </Button>
            </span>
          </MuiTooltip>
        )}

        <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
          <MenuItem onClick={() => handleExport('maintenance', 'pdf')}>
            <ListItemIcon><FileText size={16} /></ListItemIcon>
            <ListItemText>{t('reports.maintenance')} · PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('maintenance', 'csv')}>
            <ListItemIcon><FileSpreadsheet size={16} /></ListItemIcon>
            <ListItemText>{t('reports.maintenance')} · CSV</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('revenue', 'pdf')}>
            <ListItemIcon><FileText size={16} /></ListItemIcon>
            <ListItemText>{t('reports.revenueLabel')} · PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExport('revenue', 'csv')}>
            <ListItemIcon><FileSpreadsheet size={16} /></ListItemIcon>
            <ListItemText>{t('reports.revenueLabel')} · CSV</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label={t('common.vehicle')} size="small" value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)} sx={{ width: { xs: '100%', sm: 320 } }}>
              <MenuItem value="all">{t('reports.allVehicles')}</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>{v.brand?.name} {v.model?.name} · {v.plate}</MenuItem>
              ))}
            </TextField>
            <TextField select label={t('reports.period')} size="small" value={period}
              onChange={(e) => setPeriod(e.target.value)} sx={{ width: { xs: '100%', sm: 220 } }}>
              {PERIODS.map((p) => <MenuItem key={p.key} value={p.key}>{t(`reports.periods.${p.key}`)}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label={t('reports.tabs.general')} />
        <Tab label={t('reports.tabs.fueling')} />
        <Tab label={t('reports.tabs.expenses')} />
        <Tab label={t('reports.tabs.revenue')} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}><CircularProgress /></Box>
      ) : vehicles.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary">{t('reports.needVehicle')}</Typography></CardContent></Card>
      ) : noData ? (
        <Card><CardContent><Typography color="text.secondary">{t('reports.noData')}</Typography></CardContent></Card>
      ) : (
        <>
          {/* ABA GERAL */}
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingDown} title={t('reports.totalExpense')} value={money(expenseTotal)} subtitle={t('reports.totalExpenseSub')} color={C.error} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingUp} title={t('reports.totalRevenue')} value={money(revTotal)} subtitle={t('reports.totalRevenueSub')} color={C.success} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={Wallet} title={t('reports.balance')} value={money(balance)} subtitle={balance >= 0 ? t('reports.profit') : t('reports.loss')} color={balance >= 0 ? C.success : C.error} />
              </Grid>

              <Grid item xs={12} md={8}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.revVsExp')}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                      <Line type="monotone" dataKey="receita" name={t('reports.revenueLabel')} stroke={C.success} strokeWidth={2} />
                      <Line type="monotone" dataKey="despesa" name={t('reports.expense')} stroke={C.error} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.expenseDistribution')}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {expenseByCategory.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
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
                <StatCard icon={Fuel} title={t('reports.avgConsumption')} value={consumption ? `${consumption.value.toFixed(1)} ${consumption.label}` : '—'} subtitle={t('reports.betweenFullTanks')} color={C.primary} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Wallet} title={t('reports.costPerKm')} value={distance > 0 ? money(costPerKm) : '—'} subtitle={t('reports.kmDriven', { km: distance.toLocaleString(numLocale) })} color={C.warning} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={TrendingDown} title={t('reports.avgPrice')} value={avgPrice > 0 ? money(avgPrice) : '—'} subtitle={t('reports.perUnit')} color={C.info} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard icon={Fuel} title={t('reports.totalSpent')} value={money(fuelCost)} subtitle={t('reports.fuelInPeriod')} color={C.error} />
              </Grid>
              <Grid item xs={12}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.fuelByMonth')}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Bar dataKey="combustivel" name={t('reports.fuel')} fill={C.primary} radius={[4, 4, 0, 0]} />
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
                <StatCard icon={Fuel} title={t('reports.fuel')} value={money(fuelCost)} color={C.primary} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={BarChart3} title={t('reports.maintenance')} value={money(maintCost)} color={C.warning} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={TrendingDown} title={t('reports.total')} value={money(expenseTotal)} color={C.error} />
              </Grid>
              <Grid item xs={12}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.expensesByMonth')}</Typography>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Legend />
                      <Bar dataKey="combustivel" name={t('reports.fuel')} stackId="a" fill={C.primary} />
                      <Bar dataKey="manutencao" name={t('reports.maintenance')} stackId="a" fill={C.warning} radius={[4, 4, 0, 0]} />
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
                <StatCard icon={TrendingUp} title={t('reports.totalRevenue')} value={money(revTotal)} subtitle={t('reports.revenue', { count: fRev.length })} color={C.success} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StatCard icon={Wallet} title={t('reports.balance')} value={money(balance)} subtitle={balance >= 0 ? t('reports.profit') : t('reports.loss')} color={balance >= 0 ? C.success : C.error} />
              </Grid>
              <Grid item xs={12} md={7}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.revenueByMonth')}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
                      <Bar dataKey="receita" name={t('reports.revenueLabel')} fill={C.success} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent></Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card><CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>{t('reports.byCategory')}</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={revByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {revByCategory.map((_e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => money(v)} contentStyle={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }} />
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
