import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Stack,
  Toolbar,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, ptBR } from '@mui/x-data-grid';
import {
  AlertTriangle,
  Car,
  Edit,
  Plus,
  RefreshCw,
  Settings,
  PenTool as Tool,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import SettingsMenu from '../components/SettingsMenu';
import ProfileMenu from '../components/ProfileMenu';
import AddVehicleDrawer from '../components/AddVehicleDrawer';
import EditVehicleDialog from '../components/EditVehicleDialog';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, subtitle, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={20} color={color} />
          </Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
        </Stack>
        <Box>
          <Typography variant="h4" component="div" sx={{ color, fontWeight: 700 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const theme = useTheme();
  const { user, userProfile } = useAuth();

  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehiclesApi.getMyVehicles();
      setVehicles(data);
    } catch {
      setError('Não foi possível carregar seus veículos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchVehicles();
  }, [user]);

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.')) return;
    try {
      await vehiclesApi.deleteVehicle(id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch {
      setError('Erro ao remover o veículo. Tente novamente.');
    }
  };

  const vehicleColumns: GridColDef[] = [
    { field: 'brandName', headerName: 'Marca', flex: 1, valueGetter: (params: { row: Vehicle }) => params.row.brand?.name ?? '' },
    { field: 'modelName', headerName: 'Modelo', flex: 1.5, valueGetter: (params: { row: Vehicle }) => params.row.model?.name ?? '' },
    { field: 'plate', headerName: 'Placa', flex: 0.8 },
    { field: 'year', headerName: 'Ano', flex: 0.6, type: 'number' },
    {
      field: 'mileage', headerName: 'Quilometragem', flex: 0.9, type: 'number',
      valueFormatter: (params: { value: number }) => `${params.value.toLocaleString('pt-BR')} km`,
    },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<Vehicle>) => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <IconButton
            size="small"
            onClick={() => setEditVehicle(params.row as Vehicle)}
            sx={{ color: 'primary.main' }}
          >
            <Edit size={16} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteVehicle((params.row as Vehicle).id)}
            sx={{ color: 'error.main' }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Car size={28} color={theme.palette.primary.main} />
          <Typography variant="h6" component="div" sx={{ ml: 2, flexGrow: 1, fontWeight: 700 }}>
            AutoTrackr
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="large" onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
              <Settings size={22} />
            </IconButton>
            <IconButton size="large" onClick={(e) => setProfileAnchorEl(e.currentTarget)}>
              <User size={22} />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <SettingsMenu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
      />
      <ProfileMenu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
      />

      <AddVehicleDrawer
        open={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        onSuccess={() => { fetchVehicles(); setAddVehicleOpen(false); }}
      />

      <EditVehicleDialog
        open={Boolean(editVehicle)}
        vehicle={editVehicle}
        onClose={() => setEditVehicle(null)}
        onSuccess={() => { fetchVehicles(); setEditVehicle(null); }}
      />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Banner */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    Bem-vindo(a), {userProfile?.name?.split(' ')[0] || userProfile?.email || 'Usuário'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                    Gerencie seus veículos e manutenções em um só lugar.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={() => setAddVehicleOpen(true)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Adicionar Veículo
                </Button>
              </Stack>
            </Box>
          </Grid>

          {/* Stat cards */}
          <Grid item xs={12} container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Car}
                title="Total de Veículos"
                value={loading ? '—' : vehicles.length.toString()}
                subtitle={
                  loading ? 'Carregando...'
                  : vehicles.length === 0 ? 'Nenhum veículo cadastrado'
                  : `${vehicles.length} veículo${vehicles.length !== 1 ? 's' : ''} registrado${vehicles.length !== 1 ? 's' : ''}`
                }
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Tool}
                title="Manutenções Pendentes"
                value="—"
                subtitle="Disponível em breve"
                color={theme.palette.error.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={AlertTriangle}
                title="Alertas"
                value="—"
                subtitle="Disponível em breve"
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={TrendingUp}
                title="Gastos Totais"
                value="—"
                subtitle="Disponível em breve"
                color={theme.palette.success.main}
              />
            </Grid>
          </Grid>

          {/* Tabela de veículos */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Meus Veículos
                  </Typography>
                  <Button
                    size="small"
                    startIcon={loading ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                    onClick={fetchVehicles}
                    disabled={loading}
                  >
                    Atualizar
                  </Button>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : vehicles.length === 0 ? (
                  <Alert severity="info">
                    Você ainda não possui veículos cadastrados. Clique em "Adicionar Veículo" para começar.
                  </Alert>
                ) : (
                  <Box sx={{ height: 420 }}>
                    <DataGrid
                      rows={vehicles}
                      columns={vehicleColumns}
                      initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 5 } },
                      }}
                      pageSizeOptions={[5, 10]}
                      disableRowSelectionOnClick
                      localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
