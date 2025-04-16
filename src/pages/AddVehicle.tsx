import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';

// Tipagem para os dados do banco
interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  brand_id: string;
  name: string;
}

// Dados de fallback para quando ocorrer algum erro na busca
const FALLBACK_BRANDS: Brand[] = [
  { id: '1', name: 'Volkswagen' },
  { id: '2', name: 'Ford' },
  { id: '3', name: 'Chevrolet' },
  { id: '4', name: 'Fiat' },
  { id: '5', name: 'Toyota' },
  { id: '6', name: 'Honda' },
  { id: '7', name: 'Hyundai' },
  { id: '8', name: 'Nissan' },
  { id: '9', name: 'Renault' },
];

export default function AddVehicle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    plate: '',
    year: '',
    mileage: '',
  });

  // Estados para dados do banco
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [dataError, setDataError] = useState('');

  // Buscar marcas ao carregar a página
  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      setDataError('');
      
      try {
        console.log('Buscando marcas do banco de dados...');
        
        // Verificar se as tabelas existem
        const { data: tablesExist, error: tableCheckError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
          .in('tablename', ['brands', 'models']);
          
        if (tableCheckError) {
          console.error('Erro ao verificar tabelas:', tableCheckError);
          // Se não for possível verificar as tabelas, tentamos buscar as marcas mesmo assim
        }
        
        // Se as tabelas não existirem, criamos elas
        if (!tablesExist || tablesExist.length < 2) {
          console.log('Tabelas de marcas/modelos não encontradas, usando dados de fallback');
          setBrands(FALLBACK_BRANDS);
          setLoadingBrands(false);
          return;
        }
        
        // Buscar marcas do banco
        const { data, error } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
        
        if (error) {
          console.error('Erro ao buscar marcas:', error);
          setDataError('Erro ao buscar marcas. Usando dados padrão.');
          setBrands(FALLBACK_BRANDS);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`${data.length} marcas encontradas no banco`);
          setBrands(data);
        } else {
          console.log('Nenhuma marca encontrada no banco, usando dados de fallback');
          setBrands(FALLBACK_BRANDS);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar marcas:', err);
        setDataError('Erro ao buscar marcas. Usando dados padrão.');
        setBrands(FALLBACK_BRANDS);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // Buscar modelos quando a marca for selecionada
  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.brand) {
        setModels([]);
        return;
      }
      
      setLoadingModels(true);
      setDataError('');
      
      try {
        console.log('Buscando modelos para a marca ID:', formData.brand);
        
        // Verificar se as tabelas existem
        const { data: tablesExist, error: tableCheckError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
          .in('tablename', ['models']);
          
        if (tableCheckError) {
          console.error('Erro ao verificar tabela de modelos:', tableCheckError);
          // Se não for possível verificar as tabelas, tentamos buscar os modelos mesmo assim
        }
        
        // Se a tabela de modelos não existir, usamos dados genéricos
        if (!tablesExist || tablesExist.length === 0) {
          console.log('Tabela de modelos não encontrada, usando dados genéricos');
          const genericModels: Model[] = [
            { id: '1', brand_id: formData.brand, name: 'Sedan' },
            { id: '2', brand_id: formData.brand, name: 'Hatch' },
            { id: '3', brand_id: formData.brand, name: 'SUV' },
            { id: '4', brand_id: formData.brand, name: 'Picape' },
            { id: '5', brand_id: formData.brand, name: 'Minivan' },
          ];
          setModels(genericModels);
          setLoadingModels(false);
          return;
        }
        
        // Buscar modelos para a marca selecionada
        const { data, error } = await supabase
          .from('models')
          .select('id, brand_id, name')
          .eq('brand_id', formData.brand)
          .order('name');
        
        if (error) {
          console.error('Erro ao buscar modelos:', error);
          setDataError('Erro ao buscar modelos. Usando dados genéricos.');
          // Fornecer alguns modelos genéricos como fallback
          const genericModels: Model[] = [
            { id: '1', brand_id: formData.brand, name: 'Sedan' },
            { id: '2', brand_id: formData.brand, name: 'Hatch' },
            { id: '3', brand_id: formData.brand, name: 'SUV' },
            { id: '4', brand_id: formData.brand, name: 'Picape' },
            { id: '5', brand_id: formData.brand, name: 'Minivan' },
          ];
          setModels(genericModels);
          return;
        }
        
        if (data && data.length > 0) {
          console.log(`${data.length} modelos encontrados para a marca`);
          setModels(data);
        } else {
          console.log('Nenhum modelo encontrado para esta marca, usando dados genéricos');
          // Fornecer alguns modelos genéricos como fallback
          const genericModels: Model[] = [
            { id: '1', brand_id: formData.brand, name: 'Sedan' },
            { id: '2', brand_id: formData.brand, name: 'Hatch' },
            { id: '3', brand_id: formData.brand, name: 'SUV' },
            { id: '4', brand_id: formData.brand, name: 'Picape' },
            { id: '5', brand_id: formData.brand, name: 'Minivan' },
          ];
          setModels(genericModels);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar modelos:', err);
        setDataError('Erro ao buscar modelos. Usando dados genéricos.');
        // Fornecer alguns modelos genéricos como fallback
        const genericModels: Model[] = [
          { id: '1', brand_id: formData.brand, name: 'Sedan' },
          { id: '2', brand_id: formData.brand, name: 'Hatch' },
          { id: '3', brand_id: formData.brand, name: 'SUV' },
          { id: '4', brand_id: formData.brand, name: 'Picape' },
          { id: '5', brand_id: formData.brand, name: 'Minivan' },
        ];
        setModels(genericModels);
      } finally {
        setLoadingModels(false);
      }
    };

    if (formData.brand) {
      fetchModels();
    }
  }, [formData.brand]);

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Encontrar o nome da marca selecionada
    const selectedBrand = brands.find(b => b.id === formData.brand)?.name || formData.brand;
    
    // Encontrar o nome do modelo selecionado
    const selectedModel = models.find(m => m.id === formData.model)?.name || formData.model;

    try {
      const { error: supabaseError } = await supabase
        .from('vehicles')
        .insert([
          {
            user_id: user?.id,
            brand: selectedBrand,
            model: selectedModel,
            plate: formData.plate.toUpperCase(),
            year: parseInt(formData.year),
            mileage: parseInt(formData.mileage),
          },
        ]);

      if (supabaseError) throw supabaseError;

      navigate('/dashboard');
    } catch (err) {
      setError('Erro ao cadastrar veículo. Por favor, tente novamente.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 4 }}
        >
          Voltar ao Dashboard
        </Button>

        <Card sx={{ 
          p: 4,
          backdropFilter: 'blur(10px)',
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Adicionar Novo Veículo
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {dataError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {dataError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel id="marca-label">Marca</InputLabel>
                <Select
                  labelId="marca-label"
                  id="marca"
                  name="brand"
                  value={formData.brand}
                  onChange={handleSelectChange}
                  label="Marca"
                  required
                  disabled={loadingBrands}
                >
                  {loadingBrands ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando...
                    </MenuItem>
                  ) : (
                    <>
                      {brands.length === 0 && !loadingBrands && (
                        <MenuItem value="" disabled>
                          Nenhuma marca encontrada
                        </MenuItem>
                      )}
                      {brands.map((brand) => (
                        <MenuItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Select>
              </FormControl>

              {/* Campo alternativo para entrada manual da marca */}
              {(brands.length === 0 && !loadingBrands) && (
                <TextField
                  fullWidth
                  label="Marca (manual)"
                  name="brand"
                  value={formData.brand}
                  onChange={handleTextFieldChange}
                  helperText="Digite o nome da marca manualmente"
                />
              )}

              <FormControl fullWidth>
                <InputLabel id="modelo-label">Modelo</InputLabel>
                <Select
                  labelId="modelo-label"
                  id="modelo"
                  name="model"
                  value={formData.model}
                  onChange={handleSelectChange}
                  label="Modelo"
                  required
                  disabled={loadingModels || (!formData.brand && brands.length > 0)}
                >
                  {loadingModels ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando...
                    </MenuItem>
                  ) : (
                    <>
                      {models.length === 0 && !loadingModels && formData.brand && (
                        <MenuItem value="" disabled>
                          Nenhum modelo encontrado
                        </MenuItem>
                      )}
                      {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name}
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Select>
              </FormControl>

              {/* Campo alternativo para entrada manual do modelo */}
              {(models.length === 0 && !loadingModels && formData.brand) && (
                <TextField
                  fullWidth
                  label="Modelo (manual)"
                  name="model"
                  value={formData.model}
                  onChange={handleTextFieldChange}
                  helperText="Digite o nome do modelo manualmente"
                />
              )}

              <TextField
                required
                fullWidth
                label="Placa"
                name="plate"
                value={formData.plate}
                onChange={handleTextFieldChange}
                inputProps={{ 
                  style: { textTransform: 'uppercase' },
                  maxLength: 7,
                }}
              />
              <TextField
                required
                fullWidth
                label="Ano de Fabricação"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleTextFieldChange}
                inputProps={{ 
                  min: 1900,
                  max: new Date().getFullYear() + 1,
                }}
              />
              <TextField
                required
                fullWidth
                label="Quilometragem Atual"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleTextFieldChange}
                inputProps={{ min: 0 }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
              </Button>
            </Stack>
          </Box>
        </Card>
      </Box>
    </Container>
  );
}