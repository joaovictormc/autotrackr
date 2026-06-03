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
import { brandsApi, Brand } from '../../api/brands.api';

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
      const data = await brandsApi.getAll();
      setBrands(data);
    } catch (err) {
      console.error('Erro ao buscar marcas:', err);
      setSnackbar({ open: true, message: 'Erro ao carregar as marcas.', severity: 'error' });
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
    if (!brandName.trim()) { setError('O nome da marca é obrigatório.'); return; }
    try {
      if (editingBrand) {
        await brandsApi.update(editingBrand.id, { name: brandName });
        setSnackbar({ open: true, message: 'Marca atualizada com sucesso!', severity: 'success' });
      } else {
        await brandsApi.create(brandName);
        setSnackbar({ open: true, message: 'Marca adicionada com sucesso!', severity: 'success' });
      }
      handleCloseDialog();
      fetchBrands();
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) { setError('Esta marca já existe no sistema.'); return; }
      setError('Ocorreu um erro ao salvar. Por favor, tente novamente.');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta marca? Isso também excluirá todos os modelos associados.')) return;
    try {
      await brandsApi.remove(id);
      setSnackbar({ open: true, message: 'Marca excluída com sucesso!', severity: 'success' });
      fetchBrands();
    } catch (err) {
      setSnackbar({ open: true, message: 'Erro ao excluir a marca. Verifique se não há dependências.', severity: 'error' });
    }
  };

  const handleImportStandardBrands = async () => {
    if (!window.confirm('Esta ação irá importar as marcas padrões. Deseja continuar?')) return;
    setImportLoading(true);
    try {
      const result = await brandsApi.bulkImport(standardBrands.map(name => ({ name })));
      setSnackbar({ open: true, message: `Importação concluída! ${result.created} marcas adicionadas.`, severity: 'success' });
      fetchBrands();
    } catch (err) {
      setSnackbar({ open: true, message: 'Erro ao importar marcas padrões.', severity: 'error' });
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