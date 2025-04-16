import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedLayout() {
  const { user, loading } = useAuth();

  // Log para depuração
  useEffect(() => {
    console.log('ProtectedLayout - Estados:', { loading, isAuthenticated: !!user });
  }, [user, loading]);
  
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
        
        {loadingTimeout && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="error" gutterBottom>
              O carregamento está demorando mais do que o esperado.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleReload}
              sx={{ mt: 2 }}
            >
              Recarregar Página
            </Button>
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