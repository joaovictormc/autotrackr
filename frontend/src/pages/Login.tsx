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
import { useAuth } from '../contexts/AuthContext';
import { Facebook, Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Login = () => {
  const { signIn, resetPassword } = useAuth();
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

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.message) {
        setError(err.message);
      } else {
        setError('Falha ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = () => {
    setError('Login social estará disponível em breve.');
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
          startIcon={<Facebook size={20} />}
          onClick={handleSocialLogin}
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
          startIcon={<GoogleIcon />}
          onClick={handleSocialLogin}
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
