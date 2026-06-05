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
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { Edit, Fuel, Map, MapPin, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import {
  fuelApi,
  FuelRecord,
  FuelType,
  FUEL_TYPES,
  fuelTypeInfo,
  CreateFuelPayload,
} from '../api/fuel.api';
import StationMapPicker from '../components/StationMapPicker';

interface FuelForm {
  fuelType: FuelType;
  date: string;
  mileage: string;
  quantity: string;
  pricePerUnit: string;
  totalCost: string;
  fullTank: boolean;
  station: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
}

const EMPTY_FORM: FuelForm = {
  fuelType: 'GASOLINA',
  date: new Date().toISOString().split('T')[0],
  mileage: '',
  quantity: '',
  pricePerUnit: '',
  totalCost: '',
  fullTank: true,
  station: '',
  latitude: null,
  longitude: null,
  notes: '',
};

const brl = (v: string | number, locale: string) =>
  `R$ ${Number(v).toLocaleString(locale, { minimumFractionDigits: 2 })}`;

export default function FuelTracking() {
  const { enqueueSnackbar } = useSnackbar();
  const { t, i18n } = useTranslation();
  const isPt = i18n.language?.startsWith('pt');
  const numLocale = isPt ? 'pt-BR' : 'en-US';
  const fuelLabel = (type: FuelType) => t(`fuel.types.${type}`);
  const theme = useTheme();
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('sm'));

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const [form, setForm] = useState<FuelForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [locating, setLocating] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

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
      setRecords(await fuelApi.getRecords(vehicleId));
    } catch {
      enqueueSnackbar(t('common.loadRecordsError'), { variant: 'error' });
    } finally {
      setLoadingRecords(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRecords(selectedVehicleId);
  }, [selectedVehicleId, fetchRecords]);

  const openDialog = (record?: FuelRecord) => {
    if (record) {
      setEditing(record);
      setForm({
        fuelType: record.fuelType,
        date: record.date.slice(0, 10),
        mileage: String(record.mileage),
        quantity: String(parseFloat(record.quantity)),
        pricePerUnit: String(parseFloat(record.pricePerUnit)),
        totalCost: String(parseFloat(record.totalCost)),
        fullTank: record.fullTank,
        station: record.station ?? '',
        latitude: record.latitude ?? null,
        longitude: record.longitude ?? null,
        notes: record.notes ?? '',
      });
    } else {
      setEditing(null);
      const v = vehicles.find((x) => x.id === selectedVehicleId);
      setForm({ ...EMPTY_FORM, mileage: v ? String(v.mileage) : '' });
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

  // Preço/L e Total são inputs primários; Quantidade é sempre derivada.
  // onQuantity: entrada manual da quantidade → recalcula total
  const onQuantity = (val: string) => {
    setForm((p) => {
      const q = parseFloat(val);
      const price = parseFloat(p.pricePerUnit);
      const next = { ...p, quantity: val };
      if (!isNaN(q) && !isNaN(price) && price > 0) next.totalCost = (q * price).toFixed(2);
      return next;
    });
  };
  // onPrice: preço mudou → se total preenchido, recalcula quantidade
  const onPrice = (val: string) => {
    setForm((p) => {
      const price = parseFloat(val);
      const total = parseFloat(p.totalCost);
      const next = { ...p, pricePerUnit: val };
      if (!isNaN(price) && !isNaN(total) && price > 0) next.quantity = (total / price).toFixed(3);
      return next;
    });
  };
  // onTotal: total mudou → se preço preenchido, recalcula quantidade
  const onTotal = (val: string) => {
    setForm((p) => {
      const total = parseFloat(val);
      const price = parseFloat(p.pricePerUnit);
      const next = { ...p, totalCost: val };
      if (!isNaN(total) && !isNaN(price) && price > 0) next.quantity = (total / price).toFixed(3);
      return next;
    });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      enqueueSnackbar(t('fuel.geoUnsupported'), { variant: 'warning' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': i18n.language } }
          );
          const data = await res.json();
          const name: string =
            data.namedetails?.name ??
            data.address?.amenity ??
            data.address?.road ??
            data.display_name ??
            '';
          setForm((p) => ({ ...p, station: name, latitude, longitude }));
        } catch {
          enqueueSnackbar(t('fuel.geoError'), { variant: 'error' });
        } finally {
          setLocating(false);
        }
      },
      () => {
        enqueueSnackbar(t('fuel.geoError'), { variant: 'error' });
        setLocating(false);
      }
    );
  };

  const handleSave = async () => {
    setFormError('');
    const mileage = parseInt(form.mileage, 10);
    const quantity = parseFloat(form.quantity);
    const pricePerUnit = parseFloat(form.pricePerUnit);
    const totalCost = parseFloat(form.totalCost);

    if (isNaN(mileage) || mileage < 0) { setFormError(t('fuel.errMileage')); return; }
    if (isNaN(quantity) || quantity <= 0) { setFormError(t('fuel.errQuantity')); return; }
    if (isNaN(totalCost) || totalCost < 0) { setFormError(t('fuel.errTotal')); return; }

    setSaving(true);
    try {
      const payload: CreateFuelPayload = {
        date: form.date,
        fuelType: form.fuelType,
        mileage,
        quantity,
        pricePerUnit: isNaN(pricePerUnit) ? totalCost / quantity : pricePerUnit,
        totalCost,
        fullTank: form.fullTank,
        station: form.station || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        notes: form.notes || undefined,
      };
      if (editing) {
        await fuelApi.updateRecord(selectedVehicleId, editing.id, payload);
        enqueueSnackbar(t('fuel.saved'), { variant: 'success' });
      } else {
        await fuelApi.createRecord(selectedVehicleId, payload);
        enqueueSnackbar(t('fuel.created'), { variant: 'success' });
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
    if (!window.confirm(t('fuel.confirmDelete'))) return;
    try {
      await fuelApi.deleteRecord(selectedVehicleId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      enqueueSnackbar(t('fuel.removed'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.removeError'), { variant: 'error' });
    }
  };

  const unit = fuelTypeInfo(form.fuelType).unit;

  const columns: GridColDef[] = [
    {
      field: 'date', headerName: t('fuel.col.date'), flex: 0.8,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '—';
        const [y, m, d] = params.value.slice(0, 10).split('-');
        return isPt ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
      },
    },
    {
      field: 'fuelType', headerName: t('fuel.col.type'), flex: 0.9,
      valueGetter: (params: { row: FuelRecord }) => fuelLabel(params.row.fuelType),
    },
    {
      field: 'mileage', headerName: t('fuel.col.km'), flex: 0.7, type: 'number',
      valueFormatter: (params: { value: number }) => `${params.value.toLocaleString(numLocale)} km`,
    },
    {
      field: 'quantity', headerName: t('fuel.col.quantity'), flex: 0.8,
      valueGetter: (params: { row: FuelRecord }) =>
        `${parseFloat(params.row.quantity).toLocaleString(numLocale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${fuelTypeInfo(params.row.fuelType).unit}`,
    },
    {
      field: 'pricePerUnit', headerName: t('fuel.col.price'), flex: 0.7,
      valueFormatter: (params: { value: string }) => brl(params.value, numLocale),
    },
    {
      field: 'totalCost', headerName: t('fuel.col.total'), flex: 0.7,
      valueFormatter: (params: { value: string }) => brl(params.value, numLocale),
    },
    {
      field: 'station', headerName: t('fuel.col.station'), flex: 1,
      valueFormatter: (params: { value: string | null }) => params.value ?? '—',
    },
    {
      field: 'actions', headerName: t('common.actions'), width: 100, sortable: false, disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<FuelRecord>) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <IconButton size="small" onClick={() => openDialog(params.row as FuelRecord)} sx={{ color: 'primary.main' }}>
            <Edit size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete((params.row as FuelRecord).id)} sx={{ color: 'error.main' }}>
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
          <Fuel size={24} />
          <Typography variant="h5" fontWeight={700}>{t('fuel.title')}</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => openDialog()} disabled={!selectedVehicleId || loadingVehicles}>
          {t('fuel.add')}
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
              {t('fuel.list')}
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
            <Alert severity="info">{t('fuel.selectToView')}</Alert>
          ) : loadingRecords ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : records.length === 0 ? (
            <Alert severity="info">{t('fuel.empty')}</Alert>
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
        <DialogTitle>{editing ? t('fuel.editTitle') : t('fuel.newTitle')}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label={t('fuel.type')} value={form.fuelType}
                onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value as FuelType }))}
              >
                {FUEL_TYPES.map((f) => (
                  <MenuItem key={f.key} value={f.key}>{fuelLabel(f.key)}</MenuItem>
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
                fullWidth label={t('fuel.mileage')} type="number" value={form.mileage}
                onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('fuel.pricePerUnit', { unit })} type="number" value={form.pricePerUnit}
                onChange={(e) => onPrice(e.target.value)}
                inputProps={{ min: 0, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('fuel.total')} type="number" value={form.totalCost}
                onChange={(e) => onTotal(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('fuel.quantity', { unit })} type="number" value={form.quantity}
                onChange={(e) => onQuantity(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={t('fuel.quantityHelper')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={t('fuel.station')} value={form.station}
                onChange={(e) => setForm((p) => ({ ...p, station: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={t('fuel.useLocation')}>
                        <span>
                          <IconButton size="small" onClick={handleLocate} disabled={locating}>
                            {locating ? <CircularProgress size={16} /> : <MapPin size={16} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('fuel.openMap')}>
                        <span>
                          <IconButton size="small" onClick={() => setMapOpen(true)} edge="end">
                            <Map size={16} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.fullTank}
                    onChange={(e) => setForm((p) => ({ ...p, fullTank: e.target.checked }))}
                  />
                }
                label={t('fuel.fullTank')}
                sx={{ mt: 1 }}
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

      <StationMapPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={(lat, lng, name) => {
          setForm((p) => ({ ...p, station: name, latitude: lat, longitude: lng }));
        }}
        initialLat={form.latitude}
        initialLng={form.longitude}
      />
    </Container>
  );
}
