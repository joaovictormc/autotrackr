import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Drawer,
  Grid,
  IconButton,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import { X, Car } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { vehiclesApi } from '../api/vehicles.api';
import { getBrands, getModels, getYears, FipeBrand, FipeModel, FipeYear } from '../services/fipeApi';

interface FormData {
  brand: string;
  model: string;
  year: string;
  plate: string;
  mileage: string;
  color: string;
  vin: string;
  details: string;
}

const EMPTY_FORM: FormData = {
  brand: '', model: '', year: '', plate: '', mileage: '', color: '', vin: '', details: '',
};

interface AddVehicleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVehicleDrawer({ open, onClose, onSuccess }: AddVehicleDrawerProps) {
  const { enqueueSnackbar } = useSnackbar();
  const mounted = useRef(true);

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [manualYear, setManualYear] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (open && brands.length === 0) {
      loadBrands();
    }
    if (!open) {
      setFormData(EMPTY_FORM);
      setModels([]);
      setYears([]);
      setManualYear(false);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (formData.brand) {
      loadModels(formData.brand);
    } else {
      setModels([]);
      setYears([]);
    }
  }, [formData.brand]);

  useEffect(() => {
    if (formData.brand && formData.model) {
      loadYears(formData.brand, formData.model);
    } else {
      setYears([]);
    }
  }, [formData.model]);

  const loadBrands = async () => {
    if (!mounted.current) return;
    setLoadingBrands(true);
    try {
      const data = await getBrands();
      if (mounted.current) setBrands(data);
    } catch {
      if (mounted.current) setError('Erro ao carregar marcas. Tente novamente.');
    } finally {
      if (mounted.current) setLoadingBrands(false);
    }
  };

  const loadModels = async (brandId: string) => {
    if (!mounted.current) return;
    setLoadingModels(true);
    try {
      const response = await getModels(brandId);
      if (mounted.current) setModels(response.models);
    } catch {
      if (mounted.current) setError('Erro ao carregar modelos.');
    } finally {
      if (mounted.current) setLoadingModels(false);
    }
  };

  const loadYears = async (brandId: string, modelId: string) => {
    if (!mounted.current) return;
    setLoadingYears(true);
    try {
      const data = await getYears(brandId, modelId);
      if (mounted.current) setYears(data);
    } catch {
      if (mounted.current) setError('Erro ao carregar anos.');
    } finally {
      if (mounted.current) setLoadingYears(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    if (name === 'brand') {
      setFormData({ ...EMPTY_FORM, brand: value as string });
    } else if (name === 'model') {
      setFormData(prev => ({ ...prev, model: value as string, year: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value as string }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate numeric fields first
    const yearInt = parseInt(formData.year, 10);
    const mileageInt = parseInt(formData.mileage, 10);
    const maxYear = new Date().getFullYear() + 1;

    if (!formData.brand || !formData.model || !formData.plate) {
      enqueueSnackbar('Preencha todos os campos obrigatórios', { variant: 'error', autoHideDuration: 3000 });
      return;
    }
    if (!formData.year || isNaN(yearInt) || yearInt < 1950 || yearInt > maxYear) {
      enqueueSnackbar(`Selecione ou informe um ano válido (1950–${maxYear})`, { variant: 'error', autoHideDuration: 3000 });
      return;
    }
    if (formData.mileage === '' || isNaN(mileageInt) || mileageInt < 0) {
      enqueueSnackbar('Informe uma quilometragem válida (0 ou maior)', { variant: 'error', autoHideDuration: 3000 });
      return;
    }

    const selectedBrand = brands.find(b => b.code === formData.brand);
    const selectedModel = models.find(m => m.code === formData.model);

    if (!selectedBrand || !selectedModel) {
      enqueueSnackbar('Selecione uma marca e modelo válidos', { variant: 'error', autoHideDuration: 3000 });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        brandName: selectedBrand.name,
        brandApiCode: selectedBrand.code,
        modelName: selectedModel.name,
        modelApiCode: selectedModel.code,
        plate: formData.plate.toUpperCase(),
        year: yearInt,
        mileage: mileageInt,
        color: formData.color || undefined,
        vin: formData.vin || undefined,
        details: formData.details || undefined,
        apiYearCode: manualYear ? undefined : formData.year,
      };
      await vehiclesApi.createVehicle(payload);
      enqueueSnackbar('Veículo adicionado com sucesso!', { variant: 'success', autoHideDuration: 3000 });
      onSuccess();
    } catch (err: any) {
      const errData = err.response?.data;
      const raw = errData?.message;
      const msg = Array.isArray(raw)
        ? raw.join(' | ')
        : raw || err.message || 'Erro ao adicionar veículo';
      setError(msg);
      enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 8000 });
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      {/* Header — fora do form */}
      <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Car size={22} />
          <Typography variant="h6" fontWeight={700}>
            Adicionar Veículo
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </Box>
      <Divider />

      {/* Form — engloba área scrollável + footer */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Conteúdo scrollável */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Marca */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Marca *"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                disabled={loadingBrands}
                InputProps={{
                  endAdornment: loadingBrands ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                }}
              >
                {brands.length === 0 && !loadingBrands ? (
                  <MenuItem value="" disabled>Nenhuma marca disponível</MenuItem>
                ) : (
                  brands.map((b) => (
                    <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Modelo */}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Modelo *"
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={loadingModels || !formData.brand}
                InputProps={{
                  endAdornment: loadingModels ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                }}
              >
                {models.length === 0 && !loadingModels ? (
                  <MenuItem value="" disabled>
                    {formData.brand ? 'Nenhum modelo disponível' : 'Selecione uma marca'}
                  </MenuItem>
                ) : (
                  models.map((m) => (
                    <MenuItem key={m.code} value={m.code}>{m.name}</MenuItem>
                  ))
                )}
              </TextField>
            </Grid>

            {/* Ano */}
            <Grid item xs={12} sm={6}>
              {manualYear ? (
                <TextField
                  fullWidth
                  label="Ano *"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  inputProps={{ min: 1950, max: new Date().getFullYear() + 1, step: 1 }}
                  placeholder={`Ex: ${new Date().getFullYear() - 10}`}
                  helperText={
                    <Link
                      component="button"
                      type="button"
                      variant="caption"
                      underline="hover"
                      onClick={() => { setManualYear(false); setFormData(prev => ({ ...prev, year: '' })); }}
                    >
                      Voltar à lista FIPE
                    </Link>
                  }
                />
              ) : (
                <TextField
                  select
                  fullWidth
                  label="Ano *"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={loadingYears || !formData.model}
                  InputProps={{
                    endAdornment: loadingYears ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null,
                  }}
                  helperText={
                    formData.model && !loadingYears ? (
                      <Link
                        component="button"
                        type="button"
                        variant="caption"
                        underline="hover"
                        onClick={() => { setManualYear(true); setFormData(prev => ({ ...prev, year: '' })); }}
                      >
                        Ano não encontrado? Inserir manualmente
                      </Link>
                    ) : undefined
                  }
                >
                  {years.length === 0 && !loadingYears ? (
                    <MenuItem value="" disabled>
                      {formData.model ? 'Nenhum ano disponível' : 'Selecione um modelo'}
                    </MenuItem>
                  ) : (
                    years.map((y) => (
                      <MenuItem key={y.code} value={y.code}>{y.name}</MenuItem>
                    ))
                  )}
                </TextField>
              )}
            </Grid>

            {/* Placa */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placa *"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                inputProps={{ style: { textTransform: 'uppercase' } }}
                placeholder="ABC-1234"
              />
            </Grid>

            {/* Quilometragem */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quilometragem *"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleChange}
                inputProps={{ min: 0, step: 1 }}
              />
            </Grid>

            {/* Cor */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cor"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="Branco, Prata, Preto..."
              />
            </Grid>

            {/* VIN */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="VIN / Chassi"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
              />
            </Grid>

            {/* Detalhes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detalhes / Observações"
                name="details"
                multiline
                rows={3}
                value={formData.details}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Footer — dentro do form, sempre visível */}
        <Divider />
        <Box sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? 'Salvando...' : 'Cadastrar Veículo'}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
