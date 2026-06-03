import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function ProtectedLayout() {
  const { user, loading, loadingError, retryConnection } = useAuth();

  // Log para depuração
  useEffect(() => {
    console.log('ProtectedLayout - Estados:', { loading, isAuthenticated: !!user, error: loadingError });
  }, [user, loading, loadingError]);
  
  // Adicionar timeout de segurança para evitar carregamento infinito
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  useEffect(() => {
    // Se estiver carregando por mais de 10 segundos, mostrar botão de reload
    const timer = setTimeout(() => {
      if (loading) {
        console.error('Timeout de carregamento atingido no ProtectedLayout');
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
          Carregando...
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

  if (!user) {
    console.log('ProtectedLayout - Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedLayout - Renderizando conteúdo protegido');
  return <Outlet />;
}