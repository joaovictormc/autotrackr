import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Toolbar,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { DataGrid, ptBR } from '@mui/x-data-grid';
import { 
  AlertTriangle,
  Car,
  Clock,
  LogOut,
  Plus,
  Settings,
  PenTool as Tool,
  TrendingUp,
  User,
  Wrench,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SettingsMenu from '../components/SettingsMenu';
import ProfileMenu from '../components/ProfileMenu';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  mileage: number;
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, color, onClick }) => {
  const theme = useTheme();
  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Icon size={24} color={color} />
            <Typography variant="h6" component="div">
              {title}
            </Typography>
          </Stack>
          <Typography variant="h4" component="div" sx={{ color }}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  // Função para buscar os veículos do usuário
  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setVehicles(data || []);
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
      setError('Não foi possível carregar seus veículos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar veículos quando o componente montar
  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const nextMaintenances = [
    { vehicle: 'Carro 1', service: 'Troca de Óleo', dueIn: '7 dias', progress: 75 },
    { vehicle: 'Carro 2', service: 'Rodízio de Pneus', dueIn: '14 dias', progress: 50 },
    { vehicle: 'Carro 3', service: 'Revisão Geral', dueIn: '30 dias', progress: 25 }
  ];

  const vehicleColumns = [
    { field: 'brand', headerName: 'Marca', flex: 1 },
    { field: 'model', headerName: 'Modelo', flex: 1.5 },
    { field: 'plate', headerName: 'Placa', flex: 1 },
    { field: 'year', headerName: 'Ano', flex: 0.7, type: 'number' },
    { field: 'mileage', headerName: 'Quilometragem', flex: 0.8, type: 'number',
      valueFormatter: (params: { value: number }) => {
        return `${params.value.toLocaleString()} km`;
      }
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <Car size={32} color={theme.palette.primary.main} />
          <Typography variant="h6" component="div" sx={{ ml: 2, flexGrow: 1 }}>
            AutoTrackr
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton size="large" onClick={handleSettingsClick}>
              <Settings size={24} />
            </IconButton>
            <IconButton size="large" onClick={handleProfileClick}>
              <User size={24} />
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

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 2,
                backgroundImage: 'linear-gradient(to right, #f0f7ff, #e0f2ff)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', sm: 'center' }}
                spacing={2}
              >
                <Box>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.primary.main 
                    }}
                  >
                    Bem-vindo(a), {userProfile?.name || userProfile?.email || user?.email || 'Usuário'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    O que você gostaria de fazer hoje?
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Plus size={20} />}
                  sx={{ 
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(25, 118, 210, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 1)',
                    },
                  }}
                  onClick={() => navigate('/vehicles/new')}
                >
                  Adicionar Veículo
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Car}
                title="Total de Veículos"
                value={vehicles.length.toString()}
                color={theme.palette.primary.main}
                onClick={() => navigate('/vehicles')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Tool}
                title="Manutenções Pendentes"
                value="2"
                color={theme.palette.error.main}
                onClick={() => navigate('/maintenance')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={AlertTriangle}
                title="Alertas"
                value="1"
                color={theme.palette.warning.main}
                onClick={() => navigate('/alerts')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={TrendingUp}
                title="Gastos Totais"
                value="R$ 2.450"
                color={theme.palette.success.main}
                onClick={() => navigate('/expenses')}
              />
            </Grid>
          </Grid>

          <Grid item xs={12} container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                backdropFilter: 'blur(10px)',
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Próximas Manutenções
                  </Typography>
                  <Stack spacing={3}>
                    {nextMaintenances.map((maintenance, index) => (
                      <Box key={index}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1">
                            {maintenance.vehicle} - {maintenance.service}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Vence em {maintenance.dueIn}
                          </Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={maintenance.progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: maintenance.progress > 80 
                                ? theme.palette.error.main 
                                : maintenance.progress > 60
                                ? theme.palette.warning.main
                                : theme.palette.success.main,
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%',
                backdropFilter: 'blur(10px)',
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumo de Manutenções
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Wrench size={20} color={theme.palette.success.main} />
                        <Typography>
                          15 Realizadas
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Clock size={20} color={theme.palette.warning.main} />
                        <Typography>
                          2 Pendentes
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Calendar size={20} color={theme.palette.info.main} />
                        <Typography>
                          3 Agendadas
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AlertTriangle size={20} color={theme.palette.error.main} />
                        <Typography>
                          1 Atrasada
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ 
              backdropFilter: 'blur(10px)',
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    Meus Veículos
                  </Typography>
                  <Button 
                    startIcon={loading ? <CircularProgress size={20} /> : <RefreshCw size={20} />}
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
                  <Box sx={{ height: 400 }}>
                    <DataGrid
                      rows={vehicles}
                      columns={vehicleColumns}
                      initialState={{
                        pagination: {
                          paginationModel: { page: 0, pageSize: 5 },
                        },
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