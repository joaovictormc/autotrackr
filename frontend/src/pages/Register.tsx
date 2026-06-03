import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
} from '@mui/material';
import { Provider } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { Github, Facebook, Mail, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signInWithProvider } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      setError('Todos os campos são obrigatórios');
      return;
    }
    
    try {
      await signUp(email, password, fullName, phone);
    } catch (err: any) {
      if (err?.message?.includes('already registered')) {
        setError('Este email já está cadastrado. Tente fazer login ou use outro email.');
      } else {
        setError('Falha ao criar a conta: ' + (err?.message || 'Erro desconhecido'));
      }
      console.error('Erro de registro:', err);
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError('Falha ao cadastrar com provedor social');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3 }}>
        Crie sua conta
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
          id="fullName"
          label="Nome Completo"
          name="fullName"
          autoComplete="name"
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="phone"
          label="Telefone de Contato"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
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
          autoComplete="new-password"
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
        >
          Cadastrar
        </Button>
        <Link component={RouterLink} to="/login" variant="body2">
          {"Já tem uma conta? Faça login"}
        </Link>
      </Box>
    </>
  );
}