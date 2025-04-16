import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SettingsMenu from '../components/SettingsMenu';
import ProfileMenu from '../components/ProfileMenu';

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
  const { user } = useAuth();
  
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const nextMaintenances = [
    { vehicle: 'Carro 1', service: 'Troca de Óleo', dueIn: '7 dias', progress: 75 },
    { vehicle: 'Carro 2', service: 'Rodízio de Pneus', dueIn: '14 dias', progress: 50 },
    { vehicle: 'Carro 3', service: 'Revisão Geral', dueIn: '30 dias', progress: 25 }
  ];

  const maintenanceColumns = [
    { field: 'vehicle', headerName: 'Veículo', flex: 1 },
    { field: 'service', headerName: 'Serviço', flex: 1 },
    { field: 'date', headerName: 'Data Prevista', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'cost', headerName: 'Custo Estimado', flex: 1 }
  ];

  const maintenanceRows = [
    { id: 1, vehicle: 'Carro 1', service: 'Troca de Óleo', date: '23/04/2025', status: 'Agendado', cost: 'R$ 350,00' },
    { id: 2, vehicle: 'Carro 2', service: 'Rodízio de Pneus', date: '30/04/2025', status: 'Pendente', cost: 'R$ 200,00' },
    { id: 3, vehicle: 'Carro 3', service: 'Revisão Geral', date: '15/05/2025', status: 'Agendado', cost: 'R$ 800,00' }
  ];

  return (
    <Box sx={{ 
      flexGrow: 1,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(156, 39, 176, 0.1))',
    }}>
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
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between" 
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              mb={3}
            >
              <Typography variant="h4" component="h1">
                Bem-vindo(a), {user?.user_metadata?.name || 'Usuário'}
              </Typography>
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
          </Grid>

          <Grid item xs={12} container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Car}
                title="Total de Veículos"
                value="3"
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
                <Typography variant="h6" component="div" gutterBottom>
                  Manutenções Programadas
                </Typography>
                <Box sx={{ height: 400 }}>
                  <DataGrid
                    rows={maintenanceRows}
                    columns={maintenanceColumns}
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}