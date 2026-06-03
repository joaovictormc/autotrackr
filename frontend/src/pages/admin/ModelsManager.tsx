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
  Tooltip,
  Divider,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { Edit, Trash2, Plus, Download, RefreshCw } from 'lucide-react';
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

// Definição dos modelos corretos por marca
const standardModels: Record<string, string[]> = {
  "Volkswagen": [
    "Gol G5 1.0",
    "Gol G5 1.6",
    "Gol G6 1.0",
    "Gol G6 1.6",
    "Golf GTI 2.0 TSI",
    "Polo 1.0 MPI",
    "Polo 1.6 MSI",
    "Polo GTS 1.4 TSI",
    "Virtus 1.0 TSI",
    "Virtus 1.6 MSI",
    "T-Cross 1.0 TSI",
    "T-Cross 1.4 TSI",
    "Nivus 1.0 TSI",
    "Jetta 1.4 TSI",
    "Jetta 2.0 TSI GLI",
    "Taos 1.4 TSI",
    "Saveiro Robust CS",
    "Saveiro Trendline CS",
    "Saveiro Cross CD",
  ],
  "Chevrolet": [
    "Onix LT 1.0",
    "Onix LT 1.4",
    "Onix LTZ 1.4",
    "Onix Plus LT 1.0",
    "Onix Plus LTZ 1.0 Turbo",
    "Onix Plus Premier 1.0 Turbo",
    "Cruze LT 1.4 Turbo",
    "Cruze LTZ 1.4 Turbo",
    "Cruze Sport6 LT 1.4 Turbo",
    "Cruze Sport6 LTZ 1.4 Turbo",
    "Tracker 1.0 Turbo LT",
    "Tracker 1.2 Turbo Premier",
    "S10 LT 2.8 Diesel 4x4",
    "S10 LTZ 2.8 Diesel 4x4",
    "S10 High Country 2.8 Diesel 4x4",
    "Montana LS 1.4",
    "Montana Sport 1.4",
    "Spin LT 1.8",
    "Spin LTZ 1.8",
    "Spin Activ 1.8",
  ],
  "Ford": [
    "Ka SE 1.0",
    "Ka SE Plus 1.0",
    "Ka SEL 1.5",
    "Ka Sedan SE 1.0",
    "Ka Sedan SE Plus 1.0",
    "Ka Sedan SEL 1.5",
    "EcoSport SE 1.5",
    "EcoSport Freestyle 1.5",
    "EcoSport Storm 2.0 4WD",
    "Ranger XL 2.2 Diesel",
    "Ranger XLS 2.2 Diesel 4x4",
    "Ranger XLT 3.2 Diesel 4x4",
    "Ranger Limited 3.2 Diesel 4x4",
    "Ranger Black 3.2 Diesel 4x4",
    "Bronco Sport Wildtrak 2.0 EcoBoost",
    "Territory SEL 1.5 Turbo",
    "Territory Titanium 1.5 Turbo",
    "Maverick Lariat FX4 2.0 EcoBoost",
  ],
  "Fiat": [
    "Mobi Like 1.0",
    "Mobi Drive 1.0",
    "Mobi Drive GSR 1.0",
    "Uno Attractive 1.0",
    "Uno Way 1.0",
    "Uno Way 1.3",
    "Argo 1.0",
    "Argo Drive 1.0",
    "Argo Drive 1.3",
    "Argo Trekking 1.3",
    "Argo HGT 1.8",
    "Cronos 1.3",
    "Cronos Drive 1.3",
    "Cronos Precision 1.8",
    "Strada Endurance CS 1.4",
    "Strada Freedom CS 1.4",
    "Strada Freedom CD 1.4",
    "Strada Volcano CD 1.3",
    "Toro Freedom 1.8",
    "Toro Endurance 1.8",
    "Toro Freedom 2.0 Diesel",
    "Toro Ranch 2.0 Diesel",
    "Toro Ultra 2.0 Diesel",
    "Pulse Drive 1.3",
    "Pulse Audace 1.0 Turbo",
    "Pulse Impetus 1.0 Turbo",
    "Fastback Impetus 1.0 Turbo",
  ],
  "Toyota": [
    "Etios X 1.3",
    "Etios X Plus 1.5",
    "Etios XS 1.5",
    "Etios XLS 1.5",
    "Etios X Sedan 1.5",
    "Etios XS Sedan 1.5",
    "Etios XLS Sedan 1.5",
    "Corolla GLi 1.8",
    "Corolla XEi 2.0",
    "Corolla Altis Hybrid",
    "Corolla GR-Sport",
    "Corolla Cross XR 2.0",
    "Corolla Cross XRE 2.0",
    "Corolla Cross XRX Hybrid",
    "Yaris XL Live 1.3",
    "Yaris XL 1.3",
    "Yaris XL Plus Tech 1.3",
    "Yaris XS 1.5",
    "Yaris XLS 1.5",
    "Yaris Sedan XL 1.5",
    "Yaris Sedan XL Plus Tech 1.5",
    "Yaris Sedan XS 1.5",
    "Yaris Sedan XLS 1.5",
    "Hilux SR 2.7",
    "Hilux SRV 2.7 Flex",
    "Hilux SRX 2.8 Diesel 4x4",
    "Hilux SW4 SRX 2.8 Diesel",
    "RAV4 2.5 Hybrid",
  ],
  "Honda": [
    "Fit LX 1.5",
    "Fit EX 1.5",
    "Fit EXL 1.5",
    "City DX 1.5",
    "City LX 1.5",
    "City EX 1.5",
    "City EXL 1.5",
    "City Touring 1.5 Turbo",
    "HR-V LX 1.8",
    "HR-V EX 1.8",
    "HR-V EXL 1.8",
    "HR-V Touring 1.5 Turbo",
    "Civic EX 2.0",
    "Civic EXL 2.0",
    "Civic Touring 1.5 Turbo",
    "WR-V EX 1.5",
    "WR-V EXL 1.5",
    "CR-V EXL 1.5 Turbo",
    "CR-V Touring 1.5 Turbo",
    "Accord Touring 2.0 Turbo",
  ],
  "Hyundai": [
    "HB20 Sense 1.0",
    "HB20 Vision 1.0",
    "HB20 Vision 1.6",
    "HB20 Evolution 1.0 Turbo",
    "HB20 Sport 1.0 Turbo",
    "HB20S Sense 1.0",
    "HB20S Vision 1.0",
    "HB20S Vision 1.6",
    "HB20S Evolution 1.0 Turbo",
    "HB20S Platinum 1.0 Turbo",
    "Creta Action 1.6",
    "Creta Comfort 1.0 Turbo",
    "Creta Limited 1.0 Turbo",
    "Creta Platinum 1.0 Turbo",
    "Creta Ultimate 2.0",
    "Tucson GLS 1.6 Turbo",
    "Tucson Ultimate 1.6 Turbo",
    "Santa Fe 3.5 V6",
  ],
  "Nissan": [
    "March S 1.0",
    "March SV 1.0",
    "March SV 1.6",
    "Versa Sense 1.0",
    "Versa Advance 1.6",
    "Versa Exclusive 1.6",
    "Kicks S 1.6",
    "Kicks Advance 1.6",
    "Kicks Exclusive 1.6",
    "Sentra SV 2.0",
    "Sentra Advance 2.0",
    "Sentra Exclusive 2.0",
    "Frontier S 2.3 Diesel 4x4",
    "Frontier Attack 2.3 Diesel 4x4",
    "Frontier XE 2.3 Diesel 4x4",
    "Frontier LE 2.3 Diesel 4x4",
  ],
  "Renault": [
    "Kwid Life 1.0",
    "Kwid Zen 1.0",
    "Kwid Intense 1.0",
    "Kwid Outsider 1.0",
    "Sandero Life 1.0",
    "Sandero Zen 1.0",
    "Sandero Intense 1.6",
    "Sandero RS 2.0",
    "Logan Life 1.0",
    "Logan Zen 1.0",
    "Logan Intense 1.6",
    "Stepway Zen 1.6",
    "Stepway Intense 1.6",
    "Duster Zen 1.6",
    "Duster Intense 1.6",
    "Duster Iconic 1.3 Turbo",
    "Oroch Express 1.6",
    "Oroch Pro 1.6",
    "Oroch Intense 1.6",
    "Oroch Outsider 1.3 Turbo",
    "Captur Life 1.6",
    "Captur Zen 1.6",
    "Captur Intense 1.6",
    "Captur Iconic 1.3 Turbo",
  ]
};

export default function ModelsManager() {
  const theme = useTheme();
  const [models, setModels] = useState<ModelWithBrand[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
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

  // Função para importar modelos padrões
  const handleImportStandardModels = async () => {
    if (!window.confirm('Esta ação irá adicionar modelos padrões para as marcas existentes. Deseja continuar?')) {
      return;
    }

    setImportLoading(true);
    setError('');
    let totalImported = 0;
    let totalErrors = 0;

    try {
      // Para cada marca no banco de dados
      for (const brand of brands) {
        // Verificar se temos modelos padrões para esta marca
        const brandModels = standardModels[brand.name];
        if (!brandModels) continue;

        // Verificar quais modelos já existem para esta marca
        const { data: existingModels, error: fetchError } = await supabase
          .from('models')
          .select('name')
          .eq('brand_id', brand.id);

        if (fetchError) throw fetchError;

        // Criar um conjunto dos nomes de modelos existentes para verificação rápida
        const existingModelNames = new Set((existingModels || []).map(m => m.name));

        // Filtrar apenas modelos que não existem ainda
        const newModels = brandModels
          .filter(modelName => !existingModelNames.has(modelName))
          .map(modelName => ({
            brand_id: brand.id,
            name: modelName
          }));

        if (newModels.length === 0) continue;

        // Inserir modelos em lotes para melhor performance
        const { error: insertError, data: insertedData } = await supabase
          .from('models')
          .insert(newModels)
          .select();

        if (insertError) {
          console.error(`Erro ao importar modelos para ${brand.name}:`, insertError);
          totalErrors++;
        } else if (insertedData) {
          totalImported += insertedData.length;
        }
      }

      setSnackbar({
        open: true,
        message: `Importação concluída! ${totalImported} modelos adicionados.${totalErrors > 0 ? ` ${totalErrors} marcas com erros.` : ''}`,
        severity: totalErrors > 0 ? 'error' : 'success',
      });

      // Recarregar a lista de modelos
      fetchModels();
    } catch (err) {
      console.error('Erro ao importar modelos padrões:', err);
      setSnackbar({
        open: true,
        message: 'Erro ao importar modelos padrões. Por favor, tente novamente.',
        severity: 'error',
      });
    } finally {
      setImportLoading(false);
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
        <Box display="flex" gap={2}>
          <Tooltip title="Importar modelos padrões para as marcas existentes">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={importLoading ? <CircularProgress size={20} /> : <Download size={20} />}
              onClick={handleImportStandardModels}
              disabled={importLoading || brands.length === 0}
            >
              Importar Modelos Padrões
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => handleOpenDialog()}
            disabled={brands.length === 0}
          >
            Novo Modelo
          </Button>
        </Box>
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
              Nenhum modelo cadastrado. Clique em "Novo Modelo" para adicionar ou use o botão "Importar Modelos Padrões" para adicionar automaticamente.
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
            placeholder="Ex: Onix LT 1.4, Gol G6 1.0, Hilux SRX 2.8 Diesel 4x4..."
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