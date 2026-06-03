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
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { Edit, Trash2, Plus, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Brand {
  id: string;
  name: string;
}

// Lista de marcas padrão baseadas nos modelos definidos
const standardBrands = [
  "Volkswagen",
  "Chevrolet",
  "Ford",
  "Fiat",
  "Toyota",
  "Honda",
  "Hyundai",
  "Nissan",
  "Renault"
];

export default function BrandsManager() {
  const theme = useTheme();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandName(brand.name);
    } else {
      setEditingBrand(null);
      setBrandName('');
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBrand(null);
    setBrandName('');
    setError('');
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      setError('O nome da marca é obrigatório.');
      return;
    }

    try {
      if (editingBrand) {
        // Atualizar marca existente
        const { error } = await supabase
          .from('brands')
          .update({ name: brandName, updated_at: new Date() })
          .eq('id', editingBrand.id);
        
        if (error) throw error;
        
        setSnackbar({
          open: true,
          message: 'Marca atualizada com sucesso!',
          severity: 'success',
        });
      } else {
        // Criar nova marca
        const { error } = await supabase
          .from('brands')
          .insert([{ name: brandName }]);
        
        if (error) {
          if (error.code === '23505') {
            setError('Esta marca já existe no sistema.');
            return;
          }
          throw error;
        }
        
        setSnackbar({
          open: true,
          message: 'Marca adicionada com sucesso!',
          severity: 'success',
        });
      }
      
      handleCloseDialog();
      fetchBrands();
    } catch (err) {
      console.error('Erro ao salvar marca:', err);
      setError('Ocorreu um erro ao salvar. Por favor, tente novamente.');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta marca? Isso também excluirá todos os modelos associados.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSnackbar({
        open: true,
        message: 'Marca excluída com sucesso!',
        severity: 'success',
      });
      
      fetchBrands();
    } catch (err) {
      console.error('Erro ao excluir marca:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao excluir a marca. Verifique se não há dependências.',
        severity: 'error',
      });
    }
  };

  // Função para importar marcas padrões
  const handleImportStandardBrands = async () => {
    if (!window.confirm('Esta ação irá importar as marcas padrões. Deseja continuar?')) {
      return;
    }

    setImportLoading(true);
    try {
      // Verificar quais marcas já existem no banco
      const { data: existingBrands, error: fetchError } = await supabase
        .from('brands')
        .select('name');
      
      if (fetchError) throw fetchError;
      
      // Criar conjunto de nomes para facilitar a verificação
      const existingBrandNames = new Set((existingBrands || []).map(b => b.name));
      
      // Filtrar apenas marcas que não existem
      const newBrands = standardBrands
        .filter(name => !existingBrandNames.has(name))
        .map(name => ({ name }));
      
      if (newBrands.length === 0) {
        setSnackbar({
          open: true,
          message: 'Todas as marcas padrões já estão cadastradas.',
          severity: 'info',
        });
        setImportLoading(false);
        return;
      }
      
      // Inserir novas marcas
      const { error: insertError, data: insertedData } = await supabase
        .from('brands')
        .insert(newBrands)
        .select();
      
      if (insertError) throw insertError;
      
      setSnackbar({
        open: true,
        message: `Importação concluída! ${insertedData?.length || 0} marcas adicionadas.`,
        severity: 'success',
      });
      
      // Recarregar marcas
      fetchBrands();
    } catch (err) {
      console.error('Erro ao importar marcas padrões:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao importar marcas padrões. Por favor, tente novamente.',
        severity: 'error',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nome da Marca', flex: 1 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleOpenDialog(params.row as Brand)}
            aria-label="editar"
          >
            <Edit size={18} />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteBrand(params.row.id)}
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
          Gerenciar Marcas
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Importar marcas padrões">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={importLoading ? <CircularProgress size={20} /> : <Download size={20} />}
              onClick={handleImportStandardBrands}
              disabled={importLoading}
            >
              Importar Marcas Padrões
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenDialog()}
          >
            Nova Marca
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : brands.length === 0 ? (
            <Alert severity="info">
              Nenhuma marca cadastrada. Clique em "Nova Marca" para adicionar ou use "Importar Marcas Padrões" para adicionar automaticamente.
            </Alert>
          ) : (
            <div style={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={brands}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
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

      {/* Dialog para adicionar/editar marca */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingBrand ? 'Editar Marca' : 'Nova Marca'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Nome da Marca"
            fullWidth
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Ex: Volkswagen, Chevrolet, Toyota..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveBrand} variant="contained">
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