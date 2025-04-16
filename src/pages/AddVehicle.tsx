import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import fipeApi, { FipeBrand, FipeModel, FipeYear } from '../services/fipeApi';

// Tipagem para os dados do formulário
interface FormData {
  fipeBrandCode: string;
  fipeModelCode: string;
  fipeYearCode: string;
  plate: string;
  mileage: string;
  customBrand: string;
  customModel: string;
}

export default function AddVehicle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    fipeBrandCode: '',
    fipeModelCode: '',
    fipeYearCode: '',
    plate: '',
    mileage: '',
    customBrand: '',
    customModel: '',
  });

  // Estados para dados da API FIPE
  const [fipeBrands, setFipeBrands] = useState<FipeBrand[]>([]);
  const [fipeModels, setFipeModels] = useState<FipeModel[]>([]);
  const [fipeYears, setFipeYears] = useState<FipeYear[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [apiError, setApiError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Buscar marcas da API FIPE ao carregar a página
  const fetchFipeBrands = useCallback(async () => {
    setLoadingBrands(true);
    setApiError('');
    
    try {
      const brands = await fipeApi.getBrands();
      setFipeBrands(brands);
    } catch (err) {
      console.error('Erro ao buscar marcas da API FIPE:', err);
      setApiError('Não foi possível carregar as marcas dos veículos. Por favor, tente novamente.');
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  // Buscar modelos da marca selecionada
  const fetchFipeModels = useCallback(async (brandCode: string) => {
    if (!brandCode) {
      setFipeModels([]);
      return;
    }
    
    setLoadingModels(true);
    setApiError('');
    
    try {
      const response = await fipeApi.getModels(brandCode);
      setFipeModels(response.modelos);
    } catch (err) {
      console.error(`Erro ao buscar modelos para a marca ${brandCode}:`, err);
      setApiError('Não foi possível carregar os modelos para esta marca. Por favor, tente novamente.');
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Buscar anos do modelo selecionado
  const fetchFipeYears = useCallback(async (brandCode: string, modelCode: string) => {
    if (!brandCode || !modelCode) {
      setFipeYears([]);
      return;
    }
    
    setLoadingYears(true);
    setApiError('');
    
    try {
      const years = await fipeApi.getYears(brandCode, modelCode);
      setFipeYears(years);
    } catch (err) {
      console.error(`Erro ao buscar anos para o modelo ${modelCode}:`, err);
      setApiError('Não foi possível carregar os anos para este modelo. Por favor, tente novamente.');
    } finally {
      setLoadingYears(false);
    }
  }, []);

  // Carregar marcas ao iniciar
  useEffect(() => {
    fetchFipeBrands();
  }, [fetchFipeBrands]);

  // Buscar modelos quando a marca for selecionada
  useEffect(() => {
    if (formData.fipeBrandCode && formData.fipeBrandCode !== 'custom') {
      fetchFipeModels(formData.fipeBrandCode);
    }
  }, [formData.fipeBrandCode, fetchFipeModels]);

  // Buscar anos quando o modelo for selecionado
  useEffect(() => {
    if (formData.fipeBrandCode && formData.fipeModelCode && formData.fipeModelCode !== 'custom') {
      fetchFipeYears(formData.fipeBrandCode, formData.fipeModelCode);
    }
  }, [formData.fipeBrandCode, formData.fipeModelCode, fetchFipeYears]);

  const handleRefreshFipeBrands = () => {
    fetchFipeBrands();
    setSnackbarMessage('Atualizando lista de marcas...');
    setSnackbarOpen(true);
  };
  
  const handleRefreshFipeModels = () => {
    if (formData.fipeBrandCode && formData.fipeBrandCode !== 'custom') {
      fetchFipeModels(formData.fipeBrandCode);
      setSnackbarMessage('Atualizando lista de modelos...');
      setSnackbarOpen(true);
    }
  };

  const handleRefreshFipeYears = () => {
    if (formData.fipeBrandCode && formData.fipeModelCode && formData.fipeModelCode !== 'custom') {
      fetchFipeYears(formData.fipeBrandCode, formData.fipeModelCode);
      setSnackbarMessage('Atualizando lista de anos...');
      setSnackbarOpen(true);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    
    // Resetar valores dependentes quando mudar marca ou modelo
    if (name === 'fipeBrandCode') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        fipeModelCode: '',
        fipeYearCode: '',
      }));
    } else if (name === 'fipeModelCode') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        fipeYearCode: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Determinar a marca e modelo (da API FIPE ou personalizada)
      let selectedBrandName = '';
      let selectedModelName = '';
      let selectedYear = 0;
      
      // Buscar marca
      if (formData.fipeBrandCode === 'custom') {
        if (!formData.customBrand || formData.customBrand.trim() === '') {
          setError('Por favor, informe o nome da marca.');
          setLoading(false);
          return;
        }
        selectedBrandName = formData.customBrand.trim();
      } else {
        const selectedBrand = fipeBrands.find(b => b.codigo === formData.fipeBrandCode);
        if (selectedBrand) {
          selectedBrandName = selectedBrand.nome;
        } else {
          setError('Marca não encontrada. Por favor, selecione novamente.');
          setLoading(false);
          return;
        }
      }
      
      // Buscar modelo
      if (formData.fipeModelCode === 'custom') {
        if (!formData.customModel || formData.customModel.trim() === '') {
          setError('Por favor, informe o nome do modelo.');
          setLoading(false);
          return;
        }
        selectedModelName = formData.customModel.trim();
      } else {
        const selectedModel = fipeModels.find(m => m.codigo === formData.fipeModelCode);
        if (selectedModel) {
          selectedModelName = selectedModel.nome;
        } else {
          setError('Modelo não encontrado. Por favor, selecione novamente.');
          setLoading(false);
          return;
        }
      }
      
      // Buscar ano
      if (formData.fipeYearCode) {
        const selectedFipeYear = fipeYears.find(y => y.codigo === formData.fipeYearCode);
        if (selectedFipeYear) {
          // A API FIPE retorna o ano como "2022-1" (ano-combustível)
          // Vamos extrair apenas o ano
          const yearPart = selectedFipeYear.nome.split(' ')[0];
          selectedYear = parseInt(yearPart);
        }
      }

      // Validar que temos valores obrigatórios
      if (!selectedBrandName) {
        setError('Não foi possível determinar a marca. Por favor, tente novamente.');
        setLoading(false);
        return;
      }
      
      if (!selectedModelName) {
        setError('Não foi possível determinar o modelo. Por favor, tente novamente.');
        setLoading(false);
        return;
      }
      
      if (!selectedYear && !formData.fipeBrandCode.includes('custom')) {
        setError('Por favor, selecione o ano do veículo.');
        setLoading(false);
        return;
      }

      // Validar campo de quilometragem
      if (!formData.mileage) {
        setError('Por favor, informe a quilometragem do veículo.');
        setLoading(false);
        return;
      }

      // Validar campo de placa
      if (!formData.plate) {
        setError('Por favor, informe a placa do veículo.');
        setLoading(false);
        return;
      }

      console.log('Enviando veículo:', {
        marca: selectedBrandName,
        modelo: selectedModelName,
        placa: formData.plate.toUpperCase(),
        ano: selectedYear,
        quilometragem: parseInt(formData.mileage)
      });

      // Inserir no banco de dados
      const { error: supabaseError } = await supabase
        .from('vehicles')
        .insert([
          {
            user_id: user?.id,
            brand: selectedBrandName,
            model: selectedModelName,
            plate: formData.plate.toUpperCase(),
            year: selectedYear,
            mileage: parseInt(formData.mileage),
            created_at: new Date().toISOString()
          },
        ]);

      if (supabaseError) {
        console.error('Erro do Supabase:', supabaseError);
        
        if (supabaseError.code === '42P01') {
          setError('A tabela de veículos não existe. Execute o script SQL para criar as tabelas necessárias.');
          setLoading(false);
          return;
        }
        
        throw new Error(supabaseError.message || 'Erro ao cadastrar veículo');
      }

      // Sucesso
      setSnackbarMessage('Veículo cadastrado com sucesso!');
      setSnackbarOpen(true);
      
      // Redirecionar após mostrar a mensagem
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('Erro ao cadastrar veículo:', err);
      setError('Erro ao cadastrar veículo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 3 }}
        >
          Voltar
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Adicionar Veículo
        </Typography>
        
        {apiError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {apiError}
            <Typography variant="body2" mt={1}>
              Você pode continuar usando a opção "Inserir manualmente" nos campos abaixo.
            </Typography>
          </Alert>
        )}
        
        {(error && error.includes('tabela')) && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setSnackbarMessage('Para criar as tabelas, execute o script SQL no Console do Supabase');
                  setSnackbarOpen(true);
                  
                  // Mostrar instruções mais detalhadas
                  setError(`
                    Para resolver este problema:
                    1. Acesse o Console do Supabase (supabase.com)
                    2. Vá para o projeto usado nesta aplicação
                    3. Clique em "SQL Editor" no menu
                    4. Crie um novo script e cole o conteúdo do arquivo setup_tables.sql
                    5. Execute o script e retorne a este formulário
                  `);
                }}
              >
                Ver Solução
              </Button>
            }
          >
            {error}
          </Alert>
        )}
        
        <Card sx={{ p: 3, mb: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Os dados de marca, modelo e ano são obtidos da Tabela FIPE oficial.
                Selecione as opções ou insira manualmente caso seu veículo não esteja na lista.
              </Alert>
              
              {/* Campo de Marca */}
              <FormControl fullWidth>
                <InputLabel id="brand-label">Marca</InputLabel>
                <Select
                  labelId="brand-label"
                  id="fipeBrandCode"
                  name="fipeBrandCode"
                  value={formData.fipeBrandCode}
                  label="Marca"
                  onChange={handleSelectChange}
                  required
                  disabled={loadingBrands}
                  endAdornment={
                    loadingBrands ? (
                      <CircularProgress size={20} sx={{ mr: 2 }} />
                    ) : (
                      <IconButton 
                        onClick={handleRefreshFipeBrands}
                        size="small"
                        sx={{ mr: 1 }}
                        title="Atualizar marcas"
                        disabled={loadingBrands}
                      >
                        <RefreshCw size={18} />
                      </IconButton>
                    )
                  }
                >
                  {fipeBrands.map(brand => (
                    <MenuItem key={brand.codigo} value={brand.codigo}>
                      {brand.nome}
                    </MenuItem>
                  ))}
                  <MenuItem value="custom" sx={{ borderTop: '1px solid #eee', mt: 1, color: 'primary.main' }}>
                    Inserir manualmente...
                  </MenuItem>
                </Select>
              </FormControl>
              
              {formData.fipeBrandCode === 'custom' && (
                <TextField
                  label="Nome da Marca"
                  name="customBrand"
                  value={formData.customBrand || ''}
                  onChange={handleTextFieldChange}
                  required={formData.fipeBrandCode === 'custom'}
                  fullWidth
                  placeholder="Ex: Volkswagen, Chevrolet, Toyota..."
                />
              )}
              
              {/* Campo de Modelo */}
              <FormControl fullWidth>
                <InputLabel id="model-label">Modelo</InputLabel>
                <Select
                  labelId="model-label"
                  id="fipeModelCode"
                  name="fipeModelCode"
                  value={formData.fipeModelCode}
                  label="Modelo"
                  onChange={handleSelectChange}
                  required
                  disabled={!formData.fipeBrandCode || formData.fipeBrandCode === 'custom' || loadingModels}
                  endAdornment={
                    loadingModels ? (
                      <CircularProgress size={20} sx={{ mr: 2 }} />
                    ) : (
                      <IconButton 
                        onClick={handleRefreshFipeModels}
                        size="small"
                        sx={{ mr: 1 }}
                        title="Atualizar modelos"
                        disabled={!formData.fipeBrandCode || formData.fipeBrandCode === 'custom' || loadingModels}
                      >
                        <RefreshCw size={18} />
                      </IconButton>
                    )
                  }
                >
                  {fipeModels.map(model => (
                    <MenuItem key={model.codigo} value={model.codigo}>
                      {model.nome}
                    </MenuItem>
                  ))}
                  {formData.fipeBrandCode && formData.fipeBrandCode !== 'custom' && (
                    <MenuItem value="custom" sx={{ borderTop: '1px solid #eee', mt: 1, color: 'primary.main' }}>
                      Inserir manualmente...
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mb: 1, display: 'block' }}>
                Modelos conforme Tabela FIPE oficial.
              </Typography>
              
              {formData.fipeModelCode === 'custom' && (
                <TextField
                  autoFocus
                  margin="dense"
                  label="Nome do Modelo"
                  name="customModel"
                  fullWidth
                  value={formData.customModel || ''}
                  onChange={handleTextFieldChange}
                  required={formData.fipeModelCode === 'custom'}
                  placeholder="Ex: Onix LT 1.4, Gol G6 1.0, Hilux SRX 2.8 Diesel 4x4..."
                />
              )}
              
              {/* Campo de Ano */}
              <FormControl fullWidth>
                <InputLabel id="year-label">Ano</InputLabel>
                <Select
                  labelId="year-label"
                  id="fipeYearCode"
                  name="fipeYearCode"
                  value={formData.fipeYearCode}
                  label="Ano"
                  onChange={handleSelectChange}
                  required={formData.fipeBrandCode !== 'custom' && formData.fipeModelCode !== 'custom'}
                  disabled={!formData.fipeModelCode || formData.fipeModelCode === 'custom' || loadingYears || formData.fipeBrandCode === 'custom'}
                  endAdornment={
                    loadingYears ? (
                      <CircularProgress size={20} sx={{ mr: 2 }} />
                    ) : (
                      <IconButton 
                        onClick={handleRefreshFipeYears}
                        size="small"
                        sx={{ mr: 1 }}
                        title="Atualizar anos"
                        disabled={
                          !formData.fipeBrandCode || 
                          !formData.fipeModelCode || 
                          formData.fipeModelCode === 'custom' || 
                          formData.fipeBrandCode === 'custom' ||
                          loadingYears
                        }
                      >
                        <RefreshCw size={18} />
                      </IconButton>
                    )
                  }
                >
                  {fipeYears.map(year => (
                    <MenuItem key={year.codigo} value={year.codigo}>
                      {year.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Campo de Placa */}
              <TextField
                label="Placa"
                name="plate"
                value={formData.plate}
                onChange={handleTextFieldChange}
                required
                fullWidth
                inputProps={{ maxLength: 7 }}
                placeholder="Ex: ABC1234"
              />
              
              {/* Campo de Quilometragem */}
              <TextField
                label="Quilometragem"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleTextFieldChange}
                required
                fullWidth
                inputProps={{ min: 0 }}
                placeholder="Ex: 15000"
              />
              
              {error && !error.includes('tabela') && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 2,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Veículo'}
              </Button>
            </Stack>
          </form>
        </Card>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
}