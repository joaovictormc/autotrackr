import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Divider,
  Stack,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Provider } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { Github, Facebook, Mail, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  console.log('Componente Login renderizado');
  const { signIn, signInWithProvider, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulário de login submetido para:', email);
    
    if (!email || !password) {
      console.log('Validação falhou: email ou senha em branco');
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando processo de autenticação');
      await signIn(email, password);
      console.log('Login bem-sucedido, redirecionando para o dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Erro no processo de login:', err);
      if (err.message) {
        console.log('Mensagem de erro:', err.message);
        setError(err.message);
      } else {
        setError('Falha ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      console.log('Finalizando processo de login');
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError('Falha ao entrar com provedor social');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Por favor, informe seu email');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Erro ao enviar email de recuperação');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetDialogClose = () => {
    setResetDialogOpen(false);
    setResetEmail('');
    setResetError(null);
    setResetSuccess(false);
  };

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3 }}>
        Entrar no AutoTrackr
      </Typography>
      <Stack spacing={2} sx={{ width: '100%', mb: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Github size={20} />}
          onClick={() => handleSocialLogin('github')}
          sx={{ 
            color: 'black',
            borderColor: 'black',
            '&:hover': {
              borderColor: 'black',
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Continuar com GitHub
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Facebook size={20} />}
          onClick={() => handleSocialLogin('facebook')}
          sx={{ 
            color: '#1877F2',
            borderColor: '#1877F2',
            '&:hover': {
              borderColor: '#1877F2',
              backgroundColor: 'rgba(24, 119, 242, 0.04)'
            }
          }}
        >
          Continuar com Facebook
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Mail size={20} />}
          onClick={() => handleSocialLogin('google')}
          sx={{ 
            color: '#DB4437',
            borderColor: '#DB4437',
            '&:hover': {
              borderColor: '#DB4437',
              backgroundColor: 'rgba(219, 68, 55, 0.04)'
            }
          }}
        >
          Continuar com Google
        </Button>
      </Stack>
      
      <Divider sx={{ width: '100%', mb: 3 }}>ou</Divider>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={togglePasswordVisibility}
                  edge="end"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Link component={RouterLink} to="/register" variant="body2">
            {"Não tem uma conta? Cadastre-se"}
          </Link>
          <Link 
            component="button" 
            type="button"
            variant="body2"
            onClick={() => setResetDialogOpen(true)}
          >
            {"Esqueceu sua senha?"}
          </Link>
        </Box>
      </Box>

      {/* Diálogo de Recuperação de Senha */}
      <Dialog open={resetDialogOpen} onClose={handleResetDialogClose}>
        <DialogTitle>Recuperar Senha</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {resetSuccess 
              ? "Email de recuperação enviado com sucesso! Verifique sua caixa de entrada para as instruções de redefinição de senha."
              : "Para redefinir sua senha, informe o email associado à sua conta. Enviaremos um link para você criar uma nova senha."}
          </DialogContentText>
          {!resetSuccess && (
            <TextField
              autoFocus
              margin="dense"
              id="reset-email"
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              sx={{ mt: 2 }}
              error={!!resetError}
              helperText={resetError}
              disabled={resetLoading}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetDialogClose}>
            {resetSuccess ? "Fechar" : "Cancelar"}
          </Button>
          {!resetSuccess && (
            <Button 
              onClick={handleResetPassword} 
              variant="contained" 
              disabled={resetLoading}
            >
              {resetLoading ? "Enviando..." : "Enviar"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Login;