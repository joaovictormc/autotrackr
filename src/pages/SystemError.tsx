import React from 'react';
import { Box, Typography, Button, Paper, Stack, Divider, Alert } from '@mui/material';
import { Car, RefreshCw, AlertTriangle, Trash, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SystemError() {
  const navigate = useNavigate();

  const handleClearData = () => {
    try {
      // Limpar todos os dados do localStorage
      localStorage.clear();
      console.log('localStorage limpo com sucesso');
      
      // Limpar cookies também
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=");
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      console.log('Cookies limpos com sucesso');
      
      alert('Dados locais limpos com sucesso. A página será recarregada.');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      alert(`Erro ao limpar dados: ${error.message}`);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 2,
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(156, 39, 176, 0.1))',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          maxWidth: 600,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Car size={40} color="#1976d2" />
          <Typography variant="h4" ml={2} fontWeight="bold">
            AutoTrackr
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">
            Erro de Inicialização do Sistema
          </Typography>
          <Typography variant="body2">
            Ocorreu um problema ao inicializar a aplicação. Isso pode ser por causa de dados corrompidos ou problemas de conexão.
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom>
          Diagnóstico
        </Typography>
        
        <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            • Timeout de carregamento atingido
            • Possível problema no ciclo de autenticação
            • Possíveis dados locais corrompidos
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Soluções Recomendadas
        </Typography>

        <Stack spacing={2} sx={{ mb: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            fullWidth 
            startIcon={<Trash size={16} />}
            onClick={handleClearData}
          >
            Limpar Dados Locais
          </Button>
          
          <Button 
            variant="outlined" 
            color="primary" 
            fullWidth
            startIcon={<RefreshCw size={16} />}
            onClick={handleReload}
          >
            Recarregar Aplicação
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth
            startIcon={<Database size={16} />}
            onClick={handleGoToLogin}
          >
            Tentar Login Novamente
          </Button>
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Se o problema persistir, entre em contato com o suporte técnico.
        </Typography>
      </Paper>
    </Box>
  );
} 