import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { CheckCircle2, Circle, Edit, Plus, RefreshCw, Trash2, Wrench } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord, MaintenanceType, CreateMaintenancePayload } from '../api/maintenance.api';

interface FormState {
  maintenanceTypeId: string;
  newTypeName: string;
  date: string;
  mileage: string;
  cost: string;
  location: string;
  notes: string;
  reminderMileage: string;
  reminderDate: string;
  reminderKmTouched: boolean;
  reminderDateTouched: boolean;
  isCompleted: boolean;
}

const EMPTY_FORM: FormState = {
  maintenanceTypeId: '',
  newTypeName: '',
  date: new Date().toISOString().split('T')[0],
  mileage: '',
  cost: '',
  location: '',
  notes: '',
  reminderMileage: '',
  reminderDate: '',
  reminderKmTouched: false,
  reminderDateTouched: false,
  isCompleted: false,
};

export default function Maintenance() {
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const numLocale = isPt ? 'pt-BR' : 'en-US';
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ── Load initial data ───────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      vehiclesApi.getMyVehicles(),
      maintenanceApi.getTypes(),
    ]).then(([vList, tList]) => {
      setVehicles(vList);
      setTypes(tList);
      if (vList.length > 0) setSelectedVehicleId(vList[0].id);
    }).catch(() => {
      enqueueSnackbar(t('common.loadDataError'), { variant: 'error' });
    }).finally(() => setLoadingVehicles(false));
  }, []);

  const fetchRecords = useCallback(async (vehicleId: string) => {
    if (!vehicleId) return;
    setLoadingRecords(true);
    try {
      const data = await maintenanceApi.getRecords(vehicleId);
      setRecords(data);
    } catch {
      enqueueSnackbar(t('common.loadRecordsError'), { variant: 'error' });
    } finally {
      setLoadingRecords(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(selectedVehicleId);
  }, [selectedVehicleId, fetchRecords]);

  // ── Dialog ──────────────────────────────────────────────────────────

  const openDialog = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setForm({
        maintenanceTypeId: record.maintenanceTypeId,
        newTypeName: '',
        date: record.date.slice(0, 10),
        mileage: String(record.mileage),
        cost: record.cost ? String(parseFloat(record.cost)) : '',
        location: record.location ?? '',
        notes: record.notes ?? '',
        reminderMileage: record.reminderMileage != null ? String(record.reminderMileage) : '',
        reminderDate: record.reminderDate ? record.reminderDate.slice(0, 10) : '',
        reminderKmTouched: true, // não sobrescrever valores já salvos
        reminderDateTouched: true,
        isCompleted: record.isCompleted,
      });
    } else {
      setEditingRecord(null);
      const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      setForm({ ...EMPTY_FORM, mileage: selectedVehicle ? String(selectedVehicle.mileage) : '' });
    }
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  // Calcula o km do próximo lembrete: km atual + intervalo padrão do tipo
  const computeReminder = (mileageStr: string, typeId: string): string => {
    const type = types.find((mt) => mt.id === typeId);
    const interval = type?.defaultIntervalKm;
    const base = parseInt(mileageStr, 10);
    if (!interval || isNaN(base)) return '';
    return String(base + interval);
  };

  // Calcula a data do próximo lembrete: data da manutenção + intervalo em meses
  const computeReminderDate = (dateStr: string, typeId: string): string => {
    const type = types.find((mt) => mt.id === typeId);
    const months = type?.defaultIntervalMonths;
    if (!months || !dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!form.maintenanceTypeId && !form.newTypeName.trim()) {
      setFormError(t('maintenance.errType'));
      return;
    }
    if (!form.date) { setFormError(t('maintenance.errDate')); return; }
    if (!form.mileage || isNaN(parseInt(form.mileage, 10))) { setFormError(t('maintenance.errMileage')); return; }

    setSaving(true);
    setFormError('');
    try {
      let typeId = form.maintenanceTypeId;

      // Create new type if user typed a custom name
      if (!typeId && form.newTypeName.trim()) {
        const newType = await maintenanceApi.createType(form.newTypeName.trim());
        setTypes((prev) => [...prev, newType].sort((a, b) => a.name.localeCompare(b.name)));
        typeId = newType.id;
      }

      const payload: CreateMaintenancePayload = {
        maintenanceTypeId: typeId,
        date: form.date,
        mileage: parseInt(form.mileage, 10),
        cost: form.cost ? parseFloat(form.cost) : undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
        reminderMileage: form.reminderMileage ? parseInt(form.reminderMileage, 10) : undefined,
        reminderDate: form.reminderDate || undefined,
        isCompleted: form.isCompleted,
      };

      if (editingRecord) {
        await maintenanceApi.updateRecord(selectedVehicleId, editingRecord.id, payload);
        enqueueSnackbar(t('maintenance.saved'), { variant: 'success' });
      } else {
        await maintenanceApi.createRecord(selectedVehicleId, payload);
        enqueueSnackbar(t('maintenance.created'), { variant: 'success' });
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
    if (!window.confirm(t('maintenance.confirmDelete'))) return;
    try {
      await maintenanceApi.deleteRecord(selectedVehicleId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      enqueueSnackbar(t('maintenance.removed'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.removeError'), { variant: 'error' });
    }
  };

  const handleToggleComplete = async (record: MaintenanceRecord) => {
    try {
      const updated = await maintenanceApi.updateRecord(selectedVehicleId, record.id, {
        isCompleted: !record.isCompleted,
      });
      setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      enqueueSnackbar(t('common.statusError'), { variant: 'error' });
    }
  };

  // ── Columns ─────────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    {
      field: 'type', headerName: t('maintenance.col.type'), flex: 1.2,
      valueGetter: (params: { row: MaintenanceRecord }) => params.row.maintenanceType?.name ?? '—',
    },
    {
      field: 'date', headerName: t('maintenance.col.date'), flex: 0.9,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '—';
        const [y, m, d] = params.value.slice(0, 10).split('-');
        return isPt ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
      },
    },
    {
      field: 'mileage', headerName: t('maintenance.col.km'), flex: 0.8, type: 'number',
      valueFormatter: (params: { value: number }) => `${params.value.toLocaleString(numLocale)} km`,
    },
    {
      field: 'cost', headerName: t('maintenance.col.cost'), flex: 0.8,
      valueFormatter: (params: { value: string | null }) =>
        params.value ? `R$ ${parseFloat(params.value).toLocaleString(numLocale, { minimumFractionDigits: 2 })}` : '—',
    },
    {
      field: 'location', headerName: t('maintenance.col.location'), flex: 1,
      valueFormatter: (params: { value: string | null }) => params.value ?? '—',
    },
    {
      field: 'isCompleted', headerName: t('maintenance.col.status'), width: 130,
      renderCell: (params: GridRenderCellParams<MaintenanceRecord>) => (
        <Chip
          size="small"
          label={params.row.isCompleted ? t('maintenance.status.completed') : t('maintenance.status.pending')}
          color={params.row.isCompleted ? 'success' : 'warning'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'actions', headerName: t('common.actions'), width: 120, sortable: false, disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<MaintenanceRecord>) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <Tooltip title={params.row.isCompleted ? t('maintenance.markPending') : t('maintenance.markCompleted')}>
            <IconButton size="small" onClick={() => handleToggleComplete(params.row as MaintenanceRecord)}
              sx={{ color: params.row.isCompleted ? 'success.main' : 'text.secondary' }}>
              {params.row.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => openDialog(params.row as MaintenanceRecord)}
            sx={{ color: 'primary.main' }}>
            <Edit size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete((params.row as MaintenanceRecord).id)}
            sx={{ color: 'error.main' }}>
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const selectedType = types.find((mt) => mt.id === form.maintenanceTypeId);
  const selectedTypeInterval = selectedType?.defaultIntervalKm ?? null;
  const selectedTypeMonths = selectedType?.defaultIntervalMonths ?? null;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Wrench size={24} />
          <Typography variant="h5" fontWeight={700}>{t('maintenance.title')}</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => openDialog()}
          disabled={!selectedVehicleId || loadingVehicles}
        >
          {t('maintenance.add')}
        </Button>
      </Stack>

      {/* Vehicle selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          {loadingVehicles ? (
            <CircularProgress size={24} />
          ) : vehicles.length === 0 ? (
            <Alert severity="info">{t('common.noVehicles')}</Alert>
          ) : (
            <TextField
              select
              label={t('common.vehicle')}
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', sm: 360 } }}
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

      {/* Records table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('maintenance.history')}
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
            <Alert severity="info">{t('maintenance.selectToView')}</Alert>
          ) : loadingRecords ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : records.length === 0 ? (
            <Alert severity="info">
              {t('maintenance.empty')}
            </Alert>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle>{editingRecord ? t('maintenance.editTitle') : t('maintenance.newTitle')}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Tipo — Autocomplete com opção de criar novo */}
            <Grid item xs={12}>
              <Autocomplete
                freeSolo
                options={types}
                getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.name)}
                value={types.find((mt) => mt.id === form.maintenanceTypeId) ?? form.newTypeName}
                onChange={(_e, val) => {
                  if (!val) {
                    setForm((p) => ({ ...p, maintenanceTypeId: '', newTypeName: '' }));
                  } else if (typeof val === 'string') {
                    setForm((p) => ({ ...p, maintenanceTypeId: '', newTypeName: val }));
                  } else {
                    setForm((p) => ({
                      ...p,
                      maintenanceTypeId: val.id,
                      newTypeName: '',
                      // auto-preenche os lembretes se o usuário ainda não editou manualmente
                      reminderMileage: p.reminderKmTouched ? p.reminderMileage : computeReminder(p.mileage, val.id),
                      reminderDate: p.reminderDateTouched ? p.reminderDate : computeReminderDate(p.date, val.id),
                    }));
                  }
                }}
                onInputChange={(_e, val, reason) => {
                  if (reason === 'input') setForm((p) => ({ ...p, maintenanceTypeId: '', newTypeName: val }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label={`${t('maintenance.type')} *`} helperText={t('maintenance.typeHelp')} />
                )}
              />
            </Grid>

            {/* Data */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={`${t('common.date')} *`} type="date" value={form.date}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  date: e.target.value,
                  reminderDate: p.reminderDateTouched ? p.reminderDate : computeReminderDate(e.target.value, p.maintenanceTypeId),
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Km */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={`${t('maintenance.mileage')} *`} type="number" value={form.mileage}
                onChange={(e) => setForm((p) => ({
                  ...p,
                  mileage: e.target.value,
                  reminderMileage: p.reminderKmTouched ? p.reminderMileage : computeReminder(e.target.value, p.maintenanceTypeId),
                }))}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>

            {/* Custo */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('maintenance.cost')} type="number" value={form.cost}
                onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Local */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('maintenance.location')} value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              />
            </Grid>

            {/* Notas */}
            <Grid item xs={12}>
              <TextField
                fullWidth label={t('common.notes')} multiline rows={2} value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Grid>

            {/* Próxima manutenção — auto-calculada pelo intervalo padrão do tipo */}
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                {selectedTypeInterval || selectedTypeMonths
                  ? t('maintenance.recommendation', {
                      km: selectedTypeInterval ? t('maintenance.recommendationKm', { km: selectedTypeInterval.toLocaleString(numLocale) }) : '',
                      months: selectedTypeMonths
                        ? (selectedTypeInterval
                            ? t('maintenance.recommendationMonthsAlt', { months: selectedTypeMonths })
                            : t('maintenance.recommendationMonths', { months: selectedTypeMonths }))
                        : '',
                    })
                  : t('maintenance.selectTypeFirst')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('maintenance.nextTitle')}
                type="number"
                value={form.reminderMileage}
                onChange={(e) => setForm((p) => ({ ...p, reminderMileage: e.target.value, reminderKmTouched: true }))}
                inputProps={{ min: 0, step: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('maintenance.nextDate')}
                type="date"
                value={form.reminderDate}
                onChange={(e) => setForm((p) => ({ ...p, reminderDate: e.target.value, reminderDateTouched: true }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
