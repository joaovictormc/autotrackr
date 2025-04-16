import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography, AppBar, Toolbar, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  const { user, userProfile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(156, 39, 176, 0.1))',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando painel administrativo...
        </Typography>
      </Box>
    );
  }

  // Verifica se o usuário está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se o usuário tem permissão de administrador
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(156, 39, 176, 0.05))',
        }}
      >
        <AppBar 
          position="sticky" 
          elevation={0}
          color="inherit"
          sx={{
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AutoTrackr - Área Administrativa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userProfile?.name || userProfile?.email || 'Administrador'}
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
} 