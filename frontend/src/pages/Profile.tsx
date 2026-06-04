import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Lock, Save, User as UserIcon } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Dados pessoais
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Senha
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name ?? '');
      setPhone(userProfile.phone ?? '');
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!name.trim()) {
      setProfileError('Informe seu nome.');
      return;
    }
    setSavingProfile(true);
    try {
      await authApi.updateMe({ name: name.trim(), phone: phone.trim() || undefined });
      await refreshProfile();
      enqueueSnackbar('Perfil atualizado!', { variant: 'success', autoHideDuration: 3000 });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(' | ') : msg || 'Erro ao atualizar perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (password.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      enqueueSnackbar('Senha alterada com sucesso!', { variant: 'success', autoHideDuration: 3000 });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setPasswordError(Array.isArray(msg) ? msg.join(' | ') : msg || 'Erro ao alterar a senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <UserIcon size={24} />
        <Typography variant="h5" fontWeight={700}>Meu Perfil</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Dados pessoais */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Dados pessoais
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Atualize seu nome e telefone de contato.
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-mail"
                    value={userProfile?.email ?? ''}
                    disabled
                    helperText="O e-mail não pode ser alterado."
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                >
                  {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alterar senha */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                Alterar senha
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use uma senha forte com no mínimo 8 caracteres.
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nova senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirmar nova senha"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !password || !confirmPassword}
                  startIcon={savingPassword ? <CircularProgress size={16} color="inherit" /> : <Lock size={16} />}
                >
                  {savingPassword ? 'Alterando...' : 'Alterar senha'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
