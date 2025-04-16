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
} from '@mui/material';
import { Provider } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { Github, Facebook, Mail } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp, signInWithProvider } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password);
    } catch (err) {
      setError('Failed to create an account');
    }
  };

  const handleSocialLogin = async (provider: Provider) => {
    try {
      await signInWithProvider(provider);
    } catch (err) {
      setError('Failed to sign up with social provider');
    }
  };

  return (
    <>
      <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 3 }}>
        Create your account
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
          autoComplete="new-password"
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
        >
          Sign Up
        </Button>
        <Link component={RouterLink} to="/login" variant="body2">
          {"Already have an account? Sign In"}
        </Link>
      </Box>
    </>
  );
}