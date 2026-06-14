import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Container, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminAppBar from '../components/admin/AdminAppBar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { loading, isAuthenticated, isStaff, loadingError } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }

    if (!loading && isAuthenticated && !isStaff) {
      enqueueSnackbar('Acesso não autorizado. Você precisa ser administrador ou operador.', {
        variant: 'error',
        autoHideDuration: 3000
      });
      navigate('/');
    }
  }, [loading, isAuthenticated, isStaff, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Carregando...
        </Typography>
      </Box>
    );
  }

  if (loadingError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h5" color="error" sx={{ textAlign: 'center', mb: 2 }}>
          Erro ao carregar os dados
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
          Ocorreu um erro ao tentar conectar com o servidor.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
          <Button variant="outlined" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </Box>
      </Box>
    );
  }

  if (!isStaff) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <AdminAppBar />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
} 