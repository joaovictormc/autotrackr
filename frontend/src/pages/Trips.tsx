import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
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
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { Edit, Plus, RefreshCw, Route, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { tripsApi, Trip, CreateTripPayload, TripPurpose, TRIP_PURPOSES } from '../api/trips.api';

interface TripForm {
  date: string;
  origin: string;
  destination: string;
  distanceKm: string;
  mileageStart: string;
  mileageEnd: string;
  durationMin: string;
  purpose: TripPurpose;
  passengers: string;
  notes: string;
}

const EMPTY_FORM: TripForm = {
  date: new Date().toISOString().split('T')[0],
  origin: '',
  destination: '',
  distanceKm: '',
  mileageStart: '',
  mileageEnd: '',
  durationMin: '',
  purpose: 'PERSONAL',
  passengers: '',
  notes: '',
};

const PURPOSE_COLOR: Record<TripPurpose, 'primary' | 'success' | 'warning' | 'secondary'> = {
  PERSONAL: 'success',
  WORK: 'primary',
  BUSINESS: 'warning',
  OTHER: 'secondary',
};

export default function Trips() {
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [records, setRecords] = useState<Trip[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [form, setForm] = useState<TripForm>(EMPTY_FORM);
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

  const fetchRecords = useCallback(
    async (vehicleId: string) => {
      if (!vehicleId) return;
      setLoadingRecords(true);
      try {
        setRecords(await tripsApi.getTrips(vehicleId));
      } catch {
        enqueueSnackbar(t('common.loadRecordsError'), { variant: 'error' });
      } finally {
        setLoadingRecords(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchRecords(selectedVehicleId);
  }, [selectedVehicleId, fetchRecords]);

  const openDialog = (record?: Trip) => {
    if (record) {
      setEditing(record);
      setForm({
        date: record.date.slice(0, 10),
        origin: record.origin,
        destination: record.destination,
        distanceKm: String(record.distanceKm),
        mileageStart: record.mileageStart != null ? String(record.mileageStart) : '',
        mileageEnd: record.mileageEnd != null ? String(record.mileageEnd) : '',
        durationMin: record.durationMin != null ? String(record.durationMin) : '',
        purpose: record.purpose,
        passengers: record.passengers != null ? String(record.passengers) : '',
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

  const handleMileageChange = (field: 'mileageStart' | 'mileageEnd', val: string) => {
    setForm((p) => {
      const next = { ...p, [field]: val };
      const start = parseInt(field === 'mileageStart' ? val : p.mileageStart, 10);
      const end = parseInt(field === 'mileageEnd' ? val : p.mileageEnd, 10);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        next.distanceKm = String(end - start);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.origin.trim()) { setFormError(t('trips.errOrigin')); return; }
    if (!form.destination.trim()) { setFormError(t('trips.errDestination')); return; }
    const distanceKm = parseInt(form.distanceKm, 10);
    if (isNaN(distanceKm) || distanceKm <= 0) { setFormError(t('trips.errDistance')); return; }

    setSaving(true);
    try {
      const mileageStart = form.mileageStart ? parseInt(form.mileageStart, 10) : undefined;
      const mileageEnd = form.mileageEnd ? parseInt(form.mileageEnd, 10) : undefined;
      const payload: CreateTripPayload = {
        date: form.date,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        distanceKm,
        mileageStart: mileageStart && !isNaN(mileageStart) ? mileageStart : undefined,
        mileageEnd: mileageEnd && !isNaN(mileageEnd) ? mileageEnd : undefined,
        durationMin: form.durationMin ? parseInt(form.durationMin, 10) || undefined : undefined,
        purpose: form.purpose,
        passengers: form.passengers ? parseInt(form.passengers, 10) || undefined : undefined,
        notes: form.notes || undefined,
      };
      if (editing) {
        await tripsApi.updateTrip(selectedVehicleId, editing.id, payload);
        enqueueSnackbar(t('trips.saved'), { variant: 'success' });
      } else {
        await tripsApi.createTrip(selectedVehicleId, payload);
        enqueueSnackbar(t('trips.created'), { variant: 'success' });
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
    if (!window.confirm(t('trips.confirmDelete'))) return;
    try {
      await tripsApi.deleteTrip(selectedVehicleId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      enqueueSnackbar(t('trips.removed'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.removeError'), { variant: 'error' });
    }
  };

  const purposeLabel = (p: TripPurpose) => {
    const found = TRIP_PURPOSES.find((x) => x.key === p);
    return found ? (isPt ? found.labelPt : found.labelEn) : p;
  };

  const fmtDate = (val: string) => {
    if (!val) return '—';
    const [y, m, d] = val.slice(0, 10).split('-');
    return isPt ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  };

  const columns: GridColDef[] = [
    { field: 'date', headerName: t('common.date'), flex: 0.7, valueFormatter: (p: { value: string }) => fmtDate(p.value) },
    { field: 'origin', headerName: t('trips.origin'), flex: 1.2 },
    { field: 'destination', headerName: t('trips.destination'), flex: 1.2 },
    {
      field: 'distanceKm', headerName: t('trips.distanceKm'), flex: 0.7,
      renderCell: (p: GridRenderCellParams<Trip>) => (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {(p.row as Trip).distanceKm.toLocaleString(isPt ? 'pt-BR' : 'en-US')} km
        </Typography>
      ),
    },
    {
      field: 'purpose', headerName: t('trips.purpose'), flex: 0.9,
      renderCell: (p: GridRenderCellParams<Trip>) => (
        <Chip
          label={purposeLabel((p.row as Trip).purpose)}
          color={PURPOSE_COLOR[(p.row as Trip).purpose]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'durationMin', headerName: t('trips.durationMin'), flex: 0.7,
      valueFormatter: (p: { value: number | null }) => p.value != null ? `${p.value} min` : '—',
    },
    {
      field: 'actions', headerName: t('common.actions'), width: 100, sortable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams<Trip>) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" onClick={() => openDialog(p.row as Trip)} sx={{ color: 'primary.main' }}>
            <Edit size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete((p.row as Trip).id)} sx={{ color: 'error.main' }}>
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const now = new Date();
  const kmThisMonth = records
    .filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, r) => sum + r.distanceKm, 0);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Route size={24} />
          <Typography variant="h5" fontWeight={700}>{t('trips.title')}</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => openDialog()} disabled={!selectedVehicleId || loadingVehicles}>
          {t('trips.add')}
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
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
        {selectedVehicleId && (
          <Card sx={{ minWidth: 180 }}>
            <CardContent sx={{ py: '12px !important' }}>
              <Typography variant="caption" color="text.secondary">{t('trips.kmThisMonth')}</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {kmThisMonth.toLocaleString(isPt ? 'pt-BR' : 'en-US')} km
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {t('trips.title')}
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
            <Alert severity="info">{t('trips.selectToView')}</Alert>
          ) : loadingRecords ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : records.length === 0 ? (
            <Alert severity="info">{t('trips.empty')}</Alert>
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
        <DialogTitle>{editing ? t('trips.editTitle') : t('trips.newTitle')}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('common.date')} type="date" value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label={t('trips.purpose')} value={form.purpose}
                onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value as TripPurpose }))}
              >
                {TRIP_PURPOSES.map((p) => (
                  <MenuItem key={p.key} value={p.key}>{isPt ? p.labelPt : p.labelEn}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label={t('trips.origin')} value={form.origin}
                onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label={t('trips.destination')} value={form.destination}
                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('trips.mileageStart')} type="number" value={form.mileageStart}
                onChange={(e) => handleMileageChange('mileageStart', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('trips.mileageEnd')} type="number" value={form.mileageEnd}
                onChange={(e) => handleMileageChange('mileageEnd', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('trips.distanceKm')} type="number" value={form.distanceKm}
                onChange={(e) => setForm((p) => ({ ...p, distanceKm: e.target.value }))}
                inputProps={{ min: 0 }}
                helperText={
                  form.mileageStart && form.mileageEnd && parseInt(form.mileageEnd) > parseInt(form.mileageStart)
                    ? t('trips.distanceAutoCalc')
                    : undefined
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('trips.durationMin')} type="number" value={form.durationMin}
                onChange={(e) => setForm((p) => ({ ...p, durationMin: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('trips.passengers')} type="number" value={form.passengers}
                onChange={(e) => setForm((p) => ({ ...p, passengers: e.target.value }))}
                inputProps={{ min: 0 }}
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
