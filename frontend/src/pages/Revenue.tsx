import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { Edit, Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { revenueApi, RevenueRecord, REVENUE_CATEGORIES, CreateRevenuePayload } from '../api/revenue.api';

interface RevenueForm {
  date: string;
  category: string;
  amount: string;
  notes: string;
}

const EMPTY_FORM: RevenueForm = {
  date: new Date().toISOString().split('T')[0],
  category: REVENUE_CATEGORIES[0],
  amount: '',
  notes: '',
};

const brl = (v: string | number, locale: string) =>
  `R$ ${Number(v).toLocaleString(locale, { minimumFractionDigits: 2 })}`;

export default function Revenue() {
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const numLocale = isPt ? 'pt-BR' : 'en-US';
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RevenueRecord | null>(null);
  const [form, setForm] = useState<RevenueForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    vehiclesApi
      .getMyVehicles()
      .then((list) => {
        setVehicles(list);
        if (list.length > 0) setSelectedVehicleId(list[0].id);
      })
      .catch(() => enqueueSnackbar(t('common.loadDataError'), { variant: 'error' }))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const fetchRecords = useCallback(async (vehicleId: string) => {
    if (!vehicleId) return;
    setLoadingRecords(true);
    try {
      setRecords(await revenueApi.getRecords(vehicleId));
    } catch {
      enqueueSnackbar(t('common.loadRecordsError'), { variant: 'error' });
    } finally {
      setLoadingRecords(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(selectedVehicleId);
  }, [selectedVehicleId, fetchRecords]);

  const openDialog = (record?: RevenueRecord) => {
    if (record) {
      setEditing(record);
      setForm({
        date: record.date.slice(0, 10),
        category: record.category,
        amount: String(parseFloat(record.amount)),
        notes: record.notes ?? '',
      });
    } else {
      setEditing(null);
      setForm(EMPTY_FORM);
    }
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    const amount = parseFloat(form.amount);
    if (!form.category) { setFormError(t('revenue.errCategory')); return; }
    if (isNaN(amount) || amount < 0) { setFormError(t('revenue.errAmount')); return; }

    setSaving(true);
    try {
      const payload: CreateRevenuePayload = {
        date: form.date,
        category: form.category,
        amount,
        notes: form.notes || undefined,
      };
      if (editing) {
        await revenueApi.updateRecord(selectedVehicleId, editing.id, payload);
        enqueueSnackbar(t('revenue.saved'), { variant: 'success' });
      } else {
        await revenueApi.createRecord(selectedVehicleId, payload);
        enqueueSnackbar(t('revenue.created'), { variant: 'success' });
      }
      closeDialog();
      fetchRecords(selectedVehicleId);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(' | ') : msg || t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('revenue.confirmDelete'))) return;
    try {
      await revenueApi.deleteRecord(selectedVehicleId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      enqueueSnackbar(t('revenue.removed'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.removeError'), { variant: 'error' });
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'date', headerName: t('revenue.col.date'), flex: 0.8,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '—';
        const [y, m, d] = params.value.slice(0, 10).split('-');
        return isPt ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
      },
    },
    { field: 'category', headerName: t('revenue.col.category'), flex: 1.2 },
    {
      field: 'amount', headerName: t('revenue.col.amount'), flex: 0.8,
      valueGetter: (params: { row: RevenueRecord }) => parseFloat(params.row.amount),
      renderCell: (params: GridRenderCellParams<RevenueRecord>) => (
        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
          {brl(params.row.amount, numLocale)}
        </Typography>
      ),
    },
    {
      field: 'notes', headerName: t('revenue.col.notes'), flex: 1.4,
      valueFormatter: (params: { value: string | null }) => params.value ?? '—',
    },
    {
      field: 'actions', headerName: t('common.actions'), width: 100, sortable: false, disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<RevenueRecord>) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" onClick={() => openDialog(params.row as RevenueRecord)} sx={{ color: 'primary.main' }}>
            <Edit size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete((params.row as RevenueRecord).id)} sx={{ color: 'error.main' }}>
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TrendingUp size={24} />
          <Typography variant="h5" fontWeight={700}>{t('revenue.title')}</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => openDialog()} disabled={!selectedVehicleId || loadingVehicles}>
          {t('revenue.add')}
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          {loadingVehicles ? (
            <CircularProgress size={24} />
          ) : vehicles.length === 0 ? (
            <Alert severity="info">{t('common.noVehicles')}</Alert>
          ) : (
            <TextField
              select label={t('common.vehicle')} value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              size="small" sx={{ width: { xs: '100%', sm: 360 } }}
            >
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.brand?.name} {v.model?.name} · {v.year} · {v.plate}
                </MenuItem>
              ))}
            </TextField>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('revenue.list')}
              {selectedVehicle && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  — {selectedVehicle.brand?.name} {selectedVehicle.model?.name} · {selectedVehicle.plate}
                </Typography>
              )}
            </Typography>
            <IconButton size="small" onClick={() => fetchRecords(selectedVehicleId)} disabled={loadingRecords}>
              {loadingRecords ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
            </IconButton>
          </Box>

          {!selectedVehicleId ? (
            <Alert severity="info">{t('revenue.selectToView')}</Alert>
          ) : loadingRecords ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : records.length === 0 ? (
            <Alert severity="info">{t('revenue.empty')}</Alert>
          ) : (
            <Box sx={{ height: 450 }}>
              <DataGrid
                rows={records}
                columns={columns}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                pageSizeOptions={[10, 25]}
                disableRowSelectionOnClick
                localeText={isPt ? ptBR.components.MuiDataGrid.defaultProps.localeText : undefined}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle>{editing ? t('revenue.editTitle') : t('revenue.newTitle')}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label={t('revenue.category')} value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {REVENUE_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('common.date')} type="date" value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('revenue.amount')} type="number" value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label={t('common.notes')} multiline rows={2} value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
