import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashFromUrl, setHashFromUrl] = useState<string | null>(null);

  // Verificar se há um hash na URL (enviado por email de redefinição)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      // Formato esperado: #access_token=XXX&refresh_token=YYY&...
      setHashFromUrl(hash);
    }
  }, []);

  // Se houver um hash, verificar a sessão
  useEffect(() => {
    const checkSession = async () => {
      if (hashFromUrl) {
        try {
          // O Supabase vai processar o hash automaticamente
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            setError('Link de redefinição inválido ou expirado.');
          }
        } catch (err) {
          console.error('Erro ao verificar sessão:', err);
          setError('Erro ao verificar a sessão.');
        }
      }
    };

    checkSession();
  }, [hashFromUrl]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await updatePassword(password);
      setSuccess(true);
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Redefinir Senha
        </Typography>
        
        {!hashFromUrl && (
          <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
            Esta página só deve ser acessada através do link enviado ao seu email.
            Se você precisa redefinir sua senha, volte para a página de login e
            clique em "Esqueceu sua senha?".
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <Paper sx={{ p: 3, width: '100%', textAlign: 'center' }}>
            <CheckCircle size={48} color="green" style={{ margin: '0 auto 16px' }} />
            <Typography variant="h6" gutterBottom>
              Senha atualizada com sucesso!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Você será redirecionado para a página de login em instantes...
            </Typography>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              Ir para login
            </Button>
          </Paper>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Nova senha"
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !hashFromUrl}
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
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirme a nova senha"
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !hashFromUrl}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !hashFromUrl}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Atualizando...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ mt: 1 }}
            >
              Voltar para login
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
} 