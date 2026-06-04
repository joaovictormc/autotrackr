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
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { Edit, Fuel, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import {
  fuelApi,
  FuelRecord,
  FuelType,
  FUEL_TYPES,
  fuelTypeInfo,
  CreateFuelPayload,
} from '../api/fuel.api';

interface FuelForm {
  fuelType: FuelType;
  date: string;
  mileage: string;
  quantity: string;
  pricePerUnit: string;
  totalCost: string;
  fullTank: boolean;
  station: string;
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
  notes: '',
};

const brl = (v: string | number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function FuelTracking() {
  const { enqueueSnackbar } = useSnackbar();
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

  useEffect(() => {
    vehiclesApi
      .getMyVehicles()
      .then((list) => {
        setVehicles(list);
        if (list.length > 0) setSelectedVehicleId(list[0].id);
      })
      .catch(() => enqueueSnackbar('Erro ao carregar veículos.', { variant: 'error' }))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const fetchRecords = useCallback(async (vehicleId: string) => {
    if (!vehicleId) return;
    setLoadingRecords(true);
    try {
      setRecords(await fuelApi.getRecords(vehicleId));
    } catch {
      enqueueSnackbar('Erro ao carregar abastecimentos.', { variant: 'error' });
    } finally {
      setLoadingRecords(false);
    }
  }, []);

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

  // Auto-cálculo entre quantidade, preço/un e total
  const onQuantity = (val: string) => {
    setForm((p) => {
      const q = parseFloat(val);
      const price = parseFloat(p.pricePerUnit);
      const total = parseFloat(p.totalCost);
      const next = { ...p, quantity: val };
      if (!isNaN(q) && !isNaN(price)) next.totalCost = (q * price).toFixed(2);
      else if (!isNaN(q) && !isNaN(total) && q > 0) next.pricePerUnit = (total / q).toFixed(3);
      return next;
    });
  };
  const onPrice = (val: string) => {
    setForm((p) => {
      const price = parseFloat(val);
      const q = parseFloat(p.quantity);
      const next = { ...p, pricePerUnit: val };
      if (!isNaN(price) && !isNaN(q)) next.totalCost = (q * price).toFixed(2);
      return next;
    });
  };
  const onTotal = (val: string) => {
    setForm((p) => {
      const total = parseFloat(val);
      const q = parseFloat(p.quantity);
      const price = parseFloat(p.pricePerUnit);
      const next = { ...p, totalCost: val };
      if (!isNaN(total) && !isNaN(q) && q > 0) next.pricePerUnit = (total / q).toFixed(3);
      else if (!isNaN(total) && !isNaN(price) && price > 0) next.quantity = (total / price).toFixed(2);
      return next;
    });
  };

  const handleSave = async () => {
    setFormError('');
    const mileage = parseInt(form.mileage, 10);
    const quantity = parseFloat(form.quantity);
    const pricePerUnit = parseFloat(form.pricePerUnit);
    const totalCost = parseFloat(form.totalCost);

    if (isNaN(mileage) || mileage < 0) { setFormError('Informe a quilometragem.'); return; }
    if (isNaN(quantity) || quantity <= 0) { setFormError('Informe a quantidade abastecida.'); return; }
    if (isNaN(totalCost) || totalCost < 0) { setFormError('Informe o valor total.'); return; }

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
        notes: form.notes || undefined,
      };
      if (editing) {
        await fuelApi.updateRecord(selectedVehicleId, editing.id, payload);
        enqueueSnackbar('Abastecimento atualizado!', { variant: 'success' });
      } else {
        await fuelApi.createRecord(selectedVehicleId, payload);
        enqueueSnackbar('Abastecimento registrado!', { variant: 'success' });
      }
      closeDialog();
      fetchRecords(selectedVehicleId);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setFormError(Array.isArray(msg) ? msg.join(' | ') : msg || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este abastecimento? Ação irreversível.')) return;
    try {
      await fuelApi.deleteRecord(selectedVehicleId, id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      enqueueSnackbar('Abastecimento removido.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao remover.', { variant: 'error' });
    }
  };

  const unit = fuelTypeInfo(form.fuelType).unit;

  const columns: GridColDef[] = [
    {
      field: 'date', headerName: 'Data', flex: 0.8,
      valueFormatter: (params: { value: string }) => {
        if (!params.value) return '—';
        const [y, m, d] = params.value.slice(0, 10).split('-');
        return `${d}/${m}/${y}`;
      },
    },
    {
      field: 'fuelType', headerName: 'Tipo', flex: 0.9,
      valueGetter: (params: { row: FuelRecord }) => fuelTypeInfo(params.row.fuelType).label,
    },
    {
      field: 'mileage', headerName: 'Km', flex: 0.7, type: 'number',
      valueFormatter: (params: { value: number }) => `${params.value.toLocaleString('pt-BR')} km`,
    },
    {
      field: 'quantity', headerName: 'Quantidade', flex: 0.8,
      valueGetter: (params: { row: FuelRecord }) =>
        `${parseFloat(params.row.quantity).toLocaleString('pt-BR')} ${fuelTypeInfo(params.row.fuelType).unit}`,
    },
    {
      field: 'pricePerUnit', headerName: 'Preço/un', flex: 0.7,
      valueFormatter: (params: { value: string }) => brl(params.value),
    },
    {
      field: 'totalCost', headerName: 'Total', flex: 0.7,
      valueFormatter: (params: { value: string }) => brl(params.value),
    },
    {
      field: 'station', headerName: 'Posto', flex: 1,
      valueFormatter: (params: { value: string | null }) => params.value ?? '—',
    },
    {
      field: 'actions', headerName: 'Ações', width: 100, sortable: false, disableColumnMenu: true,
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
          <Typography variant="h5" fontWeight={700}>Combustível</Typography>
        </Stack>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={() => openDialog()} disabled={!selectedVehicleId || loadingVehicles}>
          Adicionar Abastecimento
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '12px !important' }}>
          {loadingVehicles ? (
            <CircularProgress size={24} />
          ) : vehicles.length === 0 ? (
            <Alert severity="info">Nenhum veículo cadastrado. Adicione um veículo no Dashboard primeiro.</Alert>
          ) : (
            <TextField
              select label="Veículo" value={selectedVehicleId}
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
              Abastecimentos
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
            <Alert severity="info">Selecione um veículo para ver os abastecimentos.</Alert>
          ) : loadingRecords ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : records.length === 0 ? (
            <Alert severity="info">Nenhum abastecimento registrado. Clique em "Adicionar Abastecimento" para começar.</Alert>
          ) : (
            <Box sx={{ height: 450 }}>
              <DataGrid
                rows={records}
                columns={columns}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                pageSizeOptions={[10, 25]}
                disableRowSelectionOnClick
                localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm" fullScreen={fullScreenDialog}>
        <DialogTitle>{editing ? 'Editar Abastecimento' : 'Novo Abastecimento'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Tipo de combustível" value={form.fuelType}
                onChange={(e) => setForm((p) => ({ ...p, fuelType: e.target.value as FuelType }))}
              >
                {FUEL_TYPES.map((f) => (
                  <MenuItem key={f.key} value={f.key}>{f.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Data" type="date" value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Quilometragem" type="number" value={form.mileage}
                onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={`Quantidade (${unit})`} type="number" value={form.quantity}
                onChange={(e) => onQuantity(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label={`Preço por ${unit} (R$)`} type="number" value={form.pricePerUnit}
                onChange={(e) => onPrice(e.target.value)}
                inputProps={{ min: 0, step: 0.001 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Total pago (R$)" type="number" value={form.totalCost}
                onChange={(e) => onTotal(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Posto" value={form.station}
                onChange={(e) => setForm((p) => ({ ...p, station: e.target.value }))}
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
                label="Tanque cheio"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Observações" multiline rows={2} value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
