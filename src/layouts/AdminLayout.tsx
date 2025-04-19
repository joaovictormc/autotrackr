import { useSnackbar } from 'notistack';
import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Container, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminAppBar from '../components/admin/AdminAppBar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { loading, isAuthenticated, isAdmin, loadingError } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  useEffect(() => {
    console.log('AdminLayout - loading:', loading, 'isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'loadingError:', loadingError);
    
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
    
    if (!loading && isAuthenticated && !isAdmin) {
      enqueueSnackbar('Acesso não autorizado. Você precisa ser um administrador.', {
        variant: 'error',
        autoHideDuration: 3000
      });
      navigate('/');
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

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
          background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)'
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: 'white' }} />
        <Typography variant="h6" sx={{ color: 'white', mt: 2 }}>
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
          background: 'linear-gradient(45deg, #c62828 30%, #d32f2f 90%)'
        }}
      >
        <Typography variant="h5" sx={{ color: 'white', textAlign: 'center', mb: 2 }}>
          Erro ao carregar os dados
        </Typography>
        <Typography variant="body1" sx={{ color: 'white', textAlign: 'center', mb: 3 }}>
          Ocorreu um erro ao tentar conectar com o servidor.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{
              bgcolor: 'white',
              color: '#c62828',
              '&:hover': {
                bgcolor: '#f5f5f5'
              }
            }}
          >
            Recarregar página
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: '#f5f5f5',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Voltar ao início
          </Button>
        </Box>
      </Box>
    );
  }

  if (!isAdmin) {
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
          bgcolor: '#f5f5f5'
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