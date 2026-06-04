import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';

interface EditVehicleDialogProps {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditForm {
  mileage: string;
  color: string;
  details: string;
}

export default function EditVehicleDialog({ open, vehicle, onClose, onSuccess }: EditVehicleDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<EditForm>({ mileage: '', color: '', details: '' });

  useEffect(() => {
    if (vehicle) {
      setForm({
        mileage: vehicle.mileage.toString(),
        color: vehicle.color ?? '',
        details: vehicle.details ?? '',
      });
      setError('');
    }
  }, [vehicle]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!vehicle) return;
    if (!form.mileage || isNaN(Number(form.mileage))) {
      setError('Informe uma quilometragem válida.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await vehiclesApi.updateVehicle(vehicle.id, {
        mileage: parseInt(form.mileage),
        color: form.color || undefined,
        details: form.details || undefined,
      });
      enqueueSnackbar('Veículo atualizado!', { variant: 'success', autoHideDuration: 3000 });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar veículo.');
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Editar Veículo
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {vehicle.brand?.name} {vehicle.model?.name} · {vehicle.year} · {vehicle.plate}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quilometragem *"
              name="mileage"
              type="number"
              value={form.mileage}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cor"
              name="color"
              value={form.color}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Detalhes / Observações"
              name="details"
              multiline
              rows={3}
              value={form.details}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
