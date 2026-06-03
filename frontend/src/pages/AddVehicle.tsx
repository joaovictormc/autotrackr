import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  TextField,
  Typography,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Snackbar,
  IconButton,
  Paper,
  Grid,
} from '@mui/material';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { getBrands, getModels, getYears, FipeBrand, FipeModel, FipeYear, FipeModelResponse } from '../services/fipeApi';

// Tipagem para os dados do formulário
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

export default function AddVehicle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBrandName, setSelectedBrandName] = useState('');
  const [selectedModelName, setSelectedModelName] = useState('');
  const mounted = useRef(true);
  const [formData, setFormData] = useState<FormData>({
    brand: '',
    model: '',
    year: '',
    plate: '',
    mileage: '',
    color: '',
    vin: '',
    details: ''
  });

  // Estados para dados da API FIPE
  const [brands, setBrands] = useState<FipeBrand[]>([]);
  const [models, setModels] = useState<FipeModel[]>([]);
  const [years, setYears] = useState<FipeYear[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [apiError, setApiError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const safeSetState = (setter: Function, value: any) => {
    if (mounted.current) {
      setter(value);
    }
  };

  // Buscar marcas da API FIPE ao carregar a página
  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const brands = await getBrands();
      setBrands(brands);
    } catch (error) {
      console.error('Error loading brands:', error);
      setError('Erro ao carregar as marcas. Por favor, tente novamente.');
    } finally {
      setLoadingBrands(false);
    }
  };

  // Buscar modelos da marca selecionada
  const loadModels = async (brandId: string) => {
    setLoadingModels(true);
    try {
      const response = await getModels(brandId);
      setModels(response.models);
    } catch (error) {
      console.error('Error loading models:', error);
      setError('Erro ao carregar os modelos. Por favor, tente novamente.');
    } finally {
      setLoadingModels(false);
    }
  };

  // Buscar anos do modelo selecionado
  const loadYears = async (brandId: string, modelId: string) => {
    setLoadingYears(true);
    try {
      const years = await getYears(brandId, modelId);
      setYears(years);
    } catch (error) {
      console.error('Error loading years:', error);
      setError('Erro ao carregar os anos. Por favor, tente novamente.');
    } finally {
      setLoadingYears(false);
    }
  };

  // Carregar marcas ao iniciar
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Buscar modelos quando a marca for selecionada
  useEffect(() => {
    if (formData.brand && formData.brand !== 'custom') {
      loadModels(formData.brand);
    }
  }, [formData.brand, loadModels]);

  // Buscar anos quando o modelo for selecionado
  useEffect(() => {
    if (formData.brand && formData.model && formData.model !== 'custom') {
      loadYears(formData.brand, formData.model);
    }
  }, [formData.brand, formData.model, loadYears]);

  const handleRefreshBrands = () => {
    loadBrands();
    setSnackbarMessage('Atualizando lista de marcas...');
    setSnackbarOpen(true);
  };
  
  const handleRefreshModels = () => {
    if (formData.brand && formData.brand !== 'custom') {
      loadModels(formData.brand);
      setSnackbarMessage('Atualizando lista de modelos...');
      setSnackbarOpen(true);
    }
  };

  const handleRefreshYears = () => {
    if (formData.brand && formData.model && formData.model !== 'custom') {
      loadYears(formData.brand, formData.model);
      setSnackbarMessage('Atualizando lista de anos...');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (!name) return;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'brand') {
      setFormData(prev => ({ ...prev, model: '', year: '' }));
      setModels([]);
      setYears([]);
      if (value) {
        loadModels(value as string);
      }
    } else if (name === 'model') {
      setFormData(prev => ({ ...prev, year: '' }));
      setYears([]);
      if (value && formData.brand) {
        loadYears(formData.brand, value as string);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Validação dos campos obrigatórios
      if (!formData.brand || !formData.model || !formData.year || !formData.plate || !formData.mileage) {
        enqueueSnackbar('Por favor, preencha todos os campos obrigatórios', { 
          variant: 'error',
          autoHideDuration: 3000
        });
        return;
      }

      // Buscar ou criar a marca
      console.log('Procurando/criando marca:', formData.brand);
      const selectedBrand = brands.find(b => b.code === formData.brand);
      if (!selectedBrand) {
        throw new Error('Marca não encontrada');
      }

      let { data: existingBrand, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('api_code', formData.brand)
        .single();

      if (brandError && brandError.code !== 'PGRST116') {
        console.error('Erro ao buscar marca:', brandError);
        throw brandError;
      }

      let brandId;
      if (!existingBrand) {
        const { data: newBrand, error: createBrandError } = await supabase
          .from('brands')
          .insert({
            name: selectedBrand.name,
            api_code: selectedBrand.code
          })
          .select('id')
          .single();

        if (createBrandError) {
          console.error('Erro ao criar marca:', createBrandError);
          throw createBrandError;
        }
        brandId = newBrand.id;
      } else {
        brandId = existingBrand.id;
      }

      // Buscar ou criar o modelo
      console.log('Procurando/criando modelo:', formData.model);
      const selectedModel = models.find(m => m.code === formData.model);
      if (!selectedModel) {
        throw new Error('Modelo não encontrado');
      }

      let { data: existingModel, error: modelError } = await supabase
        .from('models')
        .select('id')
        .eq('api_code', formData.model)
        .eq('brand_id', brandId)
        .single();

      if (modelError && modelError.code !== 'PGRST116') {
        console.error('Erro ao buscar modelo:', modelError);
        throw modelError;
      }

      let modelId;
      if (!existingModel) {
        const { data: newModel, error: createModelError } = await supabase
          .from('models')
          .insert({
            name: selectedModel.name,
            api_code: selectedModel.code,
            brand_id: brandId
          })
          .select('id')
          .single();

        if (createModelError) {
          console.error('Erro ao criar modelo:', createModelError);
          throw createModelError;
        }
        modelId = newModel.id;
      } else {
        modelId = existingModel.id;
      }

      // Criar o veículo
      console.log('Criando veículo...');
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          brand_id: brandId,
          model_id: modelId,
          plate: formData.plate.toUpperCase(),
          year: parseInt(formData.year),
          mileage: parseInt(formData.mileage),
          color: formData.color || null,
          vin: formData.vin || null,
          details: formData.details || null,
          api_year_code: formData.year
        });

      if (vehicleError) {
        console.error('Erro ao criar veículo:', vehicleError);
        throw vehicleError;
      }

      enqueueSnackbar('Veículo adicionado com sucesso!', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao adicionar veículo:', error);
      enqueueSnackbar(error.message || 'Erro ao adicionar veículo', { 
        variant: 'error',
        autoHideDuration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Adicionar Veículo
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Marca"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                disabled={loadingBrands}
                required
              >
                {loadingBrands ? (
                  <MenuItem value="">
                    <CircularProgress size={20} /> Carregando...
                  </MenuItem>
                ) : (
                  brands.map((brand) => (
                    <MenuItem key={brand.code} value={brand.code}>
                      {brand.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Modelo"
                name="model"
                value={formData.model}
                onChange={handleChange}
                disabled={loadingModels || !formData.brand}
                required
              >
                {loadingModels ? (
                  <MenuItem value="">
                    <CircularProgress size={20} /> Carregando...
                  </MenuItem>
                ) : (
                  models.map((model) => (
                    <MenuItem key={model.code} value={model.code}>
                      {model.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Ano"
                name="year"
                value={formData.year}
                onChange={handleChange}
                disabled={loadingYears || !formData.model}
                required
              >
                {loadingYears ? (
                  <MenuItem value="">
                    <CircularProgress size={20} /> Carregando...
                  </MenuItem>
                ) : (
                  years.map((year) => (
                    <MenuItem key={year.code} value={year.code}>
                      {year.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Placa"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quilometragem"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cor"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VIN/Chassi"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detalhes"
                name="details"
                multiline
                rows={4}
                value={formData.details}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
}