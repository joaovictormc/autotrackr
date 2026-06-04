import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Stack,
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
  PenTool as Tool,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { vehiclesApi, Vehicle } from '../api/vehicles.api';
import { maintenanceApi, MaintenanceRecord } from '../api/maintenance.api';
import AddVehicleDrawer from '../components/AddVehicleDrawer';
import EditVehicleDialog from '../components/EditVehicleDialog';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const theme = useTheme();
  const { user, userProfile } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  // Maintenance stats
  const [allRecords, setAllRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await vehiclesApi.getMyVehicles();
      setVehicles(data);
      return data;
    } catch {
      setError('Não foi possível carregar seus veículos. Por favor, tente novamente.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStats = async (vehicleList: Vehicle[]) => {
    if (vehicleList.length === 0) return;
    setMaintenanceLoading(true);
    try {
      const results = await Promise.all(
        vehicleList.map((v) => maintenanceApi.getRecords(v.id).catch(() => []))
      );
      setAllRecords(results.flat());
    } finally {
      setMaintenanceLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVehicles().then(fetchMaintenanceStats);
    }
  }, [user]);

  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este veículo? Esta ação não pode ser desfeita.')) return;
    try {
      await vehiclesApi.deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setError('Erro ao remover o veículo. Tente novamente.');
    }
  };

  // Maintenance stats
  const pendingCount = allRecords.filter((r) => !r.isCompleted).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const alertsCount = allRecords.filter((r) => {
    if (r.isCompleted) return false;
    const dateAlert = r.reminderDate && r.reminderDate.slice(0, 10) <= todayStr;
    const kmAlert =
      r.reminderMileage != null &&
      (vehicles.find((v) => v.id === r.vehicleId)?.mileage ?? 0) >= r.reminderMileage;
    return dateAlert || kmAlert;
  }).length;

  const totalCost = allRecords.reduce((sum, r) => sum + parseFloat(r.cost ?? '0'), 0);
  const totalCostLabel = maintenanceLoading
    ? '—'
    : `R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const vehicleColumns: GridColDef[] = [
    { field: 'brandName', headerName: 'Marca', flex: 1, valueGetter: (params: { row: Vehicle }) => params.row.brand?.name ?? '' },
    { field: 'modelName', headerName: 'Modelo', flex: 1.5, valueGetter: (params: { row: Vehicle }) => params.row.model?.name ?? '' },
    { field: 'plate', headerName: 'Placa', flex: 0.8 },
    {
      field: 'year', headerName: 'Ano', flex: 0.6, type: 'number',
      valueFormatter: (params: { value: number }) => String(params.value),
    },
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
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <AddVehicleDrawer
        open={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        onSuccess={() => { fetchVehicles().then(fetchMaintenanceStats); setAddVehicleOpen(false); }}
      />
      <EditVehicleDialog
        open={Boolean(editVehicle)}
        vehicle={editVehicle}
        onClose={() => setEditVehicle(null)}
        onSuccess={() => { fetchVehicles().then(fetchMaintenanceStats); setEditVehicle(null); }}
      />

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
                loading
                  ? 'Carregando...'
                  : vehicles.length === 0
                  ? 'Nenhum veículo cadastrado'
                  : `${vehicles.length} veículo${vehicles.length !== 1 ? 's' : ''} registrado${vehicles.length !== 1 ? 's' : ''}`
              }
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={Tool}
              title="Manutenções Pendentes"
              value={maintenanceLoading ? '—' : pendingCount.toString()}
              subtitle={
                maintenanceLoading
                  ? 'Carregando...'
                  : pendingCount === 0
                  ? 'Nenhuma pendência'
                  : `${pendingCount} registro${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}`
              }
              color={theme.palette.error.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={AlertTriangle}
              title="Alertas"
              value={maintenanceLoading ? '—' : alertsCount.toString()}
              subtitle={
                maintenanceLoading
                  ? 'Carregando...'
                  : alertsCount === 0
                  ? 'Nenhum alerta'
                  : `${alertsCount} lembrete${alertsCount !== 1 ? 's' : ''} vencido${alertsCount !== 1 ? 's' : ''}`
              }
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={TrendingUp}
              title="Gastos Totais"
              value={totalCostLabel}
              subtitle={
                maintenanceLoading
                  ? 'Carregando...'
                  : totalCost === 0
                  ? 'Nenhuma despesa registrada'
                  : 'Total em manutenções'
              }
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
                  onClick={() => fetchVehicles().then(fetchMaintenanceStats)}
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
                    initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
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
  );
}
