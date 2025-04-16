import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography, AppBar, Toolbar, Container, Button, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminLayout() {
  const { user, userProfile, loading, loadingError, isAdmin, retryConnection } = useAuth();
  
  // Log para depuração
  useEffect(() => {
    console.log('AdminLayout - Estados:', { loading, isAuthenticated: !!user, isAdmin, error: loadingError });
  }, [user, loading, isAdmin, loadingError]);
  
  // Adicionar timeout de segurança para evitar carregamento infinito
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  useEffect(() => {
    // Se estiver carregando por mais de 10 segundos, mostrar botão de reload
    const timer = setTimeout(() => {
      if (loading) {
        console.error('Timeout de carregamento atingido no AdminLayout');
        setLoadingTimeout(true);
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [loading]);

  const handleReload = () => {
    console.log('Recarregando a página...');
    window.location.reload();
  };
  
  const handleRetry = () => {
    console.log('Tentando reconectar...');
    setLoadingTimeout(false);
    retryConnection();
  };

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
        
        {(loadingTimeout || loadingError) && (
          <Box sx={{ mt: 4, textAlign: 'center', maxWidth: '400px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <AlertTriangle color="#f44336" size={24} />
              <Typography variant="body1" color="error" sx={{ ml: 1 }}>
                {loadingError 
                  ? 'Erro de conexão com o servidor.' 
                  : 'O carregamento está demorando mais do que o esperado.'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Isso pode ocorrer devido a problemas de rede ou servidor. Você pode tentar:
            </Typography>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={handleRetry}
                startIcon={<RefreshCw size={16} />}
              >
                Reconectar
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleReload}
              >
                Recarregar Página
              </Button>
            </Stack>
          </Box>
        )}
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