import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  brand_id: string;
  name: string;
  brand_name?: string;
}

interface ModelWithBrand extends Model {
  brand_name: string; // Garantir que brand_name existe
}

export default function ModelsManager() {
  const theme = useTheme();
  const [models, setModels] = useState<ModelWithBrand[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [modelName, setModelName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchModels = async () => {
    setLoading(true);
    try {
      // Buscar modelos junto com o nome da marca para exibição
      const { data, error } = await supabase
        .from('models')
        .select(`
          id,
          brand_id,
          name,
          brands (name)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Transformar o resultado para um formato mais fácil de usar
      const formattedModels = (data || []).map(model => ({
        id: model.id,
        brand_id: model.brand_id,
        name: model.name,
        brand_name: model.brands ? model.brands.name : 'Marca desconhecida',
      }));
      
      setModels(formattedModels);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar os modelos. Por favor, tente novamente.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Erro ao buscar marcas:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar as marcas. Por favor, tente novamente.',
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchModels();
  }, []);

  const handleOpenDialog = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setModelName(model.name);
      setSelectedBrandId(model.brand_id);
    } else {
      setEditingModel(null);
      setModelName('');
      setSelectedBrandId(brands.length > 0 ? brands[0].id : '');
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingModel(null);
    setModelName('');
    setSelectedBrandId('');
    setError('');
  };

  const handleBrandChange = (event: SelectChangeEvent) => {
    setSelectedBrandId(event.target.value);
  };

  const handleSaveModel = async () => {
    if (!modelName.trim()) {
      setError('O nome do modelo é obrigatório.');
      return;
    }

    if (!selectedBrandId) {
      setError('A marca é obrigatória.');
      return;
    }

    try {
      if (editingModel) {
        // Atualizar modelo existente
        const { error } = await supabase
          .from('models')
          .update({ 
            name: modelName, 
            brand_id: selectedBrandId,
            updated_at: new Date() 
          })
          .eq('id', editingModel.id);
        
        if (error) throw error;
        
        setSnackbar({
          open: true,
          message: 'Modelo atualizado com sucesso!',
          severity: 'success',
        });
      } else {
        // Criar novo modelo
        const { error } = await supabase
          .from('models')
          .insert([{ 
            name: modelName, 
            brand_id: selectedBrandId 
          }]);
        
        if (error) {
          if (error.code === '23505') {
            setError('Este modelo já existe para esta marca.');
            return;
          }
          throw error;
        }
        
        setSnackbar({
          open: true,
          message: 'Modelo adicionado com sucesso!',
          severity: 'success',
        });
      }
      
      handleCloseDialog();
      fetchModels();
    } catch (err) {
      console.error('Erro ao salvar modelo:', err);
      setError('Ocorreu um erro ao salvar. Por favor, tente novamente.');
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este modelo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSnackbar({
        open: true,
        message: 'Modelo excluído com sucesso!',
        severity: 'success',
      });
      
      fetchModels();
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir o modelo. Verifique se não há dependências.',
        severity: 'error',
      });
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome do Modelo', flex: 1 },
    { field: 'brand_name', headerName: 'Marca', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog(params.row as Model)}
            aria-label="editar"
          >
            <Edit size={18} />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteModel(params.row.id)}
            aria-label="excluir"
          >
            <Trash2 size={18} />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Gerenciar Modelos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenDialog()}
          disabled={brands.length === 0}
        >
          Novo Modelo
        </Button>
      </Box>

      {brands.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Você precisa cadastrar marcas antes de adicionar modelos.
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : models.length === 0 ? (
            <Alert severity="info">
              Nenhum modelo cadastrado. Clique em "Novo Modelo" para adicionar.
            </Alert>
          ) : (
            <div style={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={models}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                  sorting: {
                    sortModel: [{ field: 'brand_name', sort: 'asc' }],
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar modelo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingModel ? 'Editar Modelo' : 'Novo Modelo'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel id="brand-select-label">Marca</InputLabel>
            <Select
              labelId="brand-select-label"
              id="brand-select"
              value={selectedBrandId}
              label="Marca"
              onChange={handleBrandChange}
              disabled={brands.length === 0}
            >
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Modelo"
            fullWidth
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Ex: Gol, Fiesta, Corolla..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveModel} variant="contained" disabled={brands.length === 0}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 