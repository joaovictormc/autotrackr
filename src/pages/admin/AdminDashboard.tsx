import React from 'react';
import { Box, Card, CardContent, Grid, Typography, Stack } from '@mui/material';
import { Users, Car, Tag as TagIcon, ListFilter, ShieldAlert } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          {icon}
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default function AdminDashboard() {
  const theme = useTheme();
  const { userProfile } = useAuth();
  
  // Em um cenário real, esses dados viriam do banco
  const stats = {
    usuariosTotal: 32,
    veiculosTotal: 48,
    marcasTotal: 16,
    modelosTotal: 124,
    adminsTotal: 2
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Painel Administrativo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Bem-vindo(a), {userProfile?.name || 'Administrador(a)'}. Esse é o painel de controle do sistema.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<Users size={32} color={theme.palette.primary.main} />}
            title="Usuários"
            value={stats.usuariosTotal}
            color={theme.palette.primary.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<Car size={32} color={theme.palette.success.main} />}
            title="Veículos"
            value={stats.veiculosTotal}
            color={theme.palette.success.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<ShieldAlert size={32} color={theme.palette.warning.main} />}
            title="Administradores"
            value={stats.adminsTotal}
            color={theme.palette.warning.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            icon={<TagIcon size={32} color={theme.palette.info.main} />}
            title="Marcas"
            value={stats.marcasTotal}
            color={theme.palette.info.main}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            icon={<ListFilter size={32} color={theme.palette.secondary.main} />}
            title="Modelos"
            value={stats.modelosTotal}
            color={theme.palette.secondary.main}
          />
        </Grid>
      </Grid>
      
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Informações do Sistema
          </Typography>
          
          <Typography variant="body1" paragraph>
            O painel administrativo permite gerenciar todo o conteúdo do sistema AutoTrackr, incluindo marcas, modelos, usuários e outras configurações.
          </Typography>
          
          <Typography variant="body1">
            Utilize o menu lateral para navegar entre as diferentes seções administrativas.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
} 