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
} from '@mui/material';
import { Provider } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { Github, Facebook, Mail } from 'lucide-react';

const Login = () => {
  console.log('Componente Login renderizado');
  const { signIn, signInWithProvider } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      setError('Failed to sign in with social provider');
    }
  };

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3 }}>
        Sign in to AutoTrackr
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
          Continue with GitHub
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
          Continue with Facebook
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
          Continue with Google
        </Button>
      </Stack>
      
      <Divider sx={{ width: '100%', mb: 3 }}>or</Divider>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
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
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Entrando...' : 'Sign In'}
        </Button>
        <Link component={RouterLink} to="/register" variant="body2">
          {"Don't have an account? Sign Up"}
        </Link>
      </Box>
    </>
  );
};

export default Login;