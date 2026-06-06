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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth.api';

export default function Profile() {
  const { userProfile, refreshProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

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
      setProfileError(t('profile.nameRequired'));
      return;
    }
    setSavingProfile(true);
    try {
      await authApi.updateMe({ name: name.trim(), phone: phone.trim() || undefined });
      await refreshProfile();
      enqueueSnackbar(t('profile.profileUpdated'), { variant: 'success', autoHideDuration: 3000 });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(' | ') : msg || t('profile.profileError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (password.length < 8) {
      setPasswordError(t('profile.passwordMin'));
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError(t('profile.passwordMismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      enqueueSnackbar(t('profile.passwordChanged'), { variant: 'success', autoHideDuration: 3000 });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setPasswordError(Array.isArray(msg) ? msg.join(' | ') : msg || t('profile.passwordError'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <UserIcon size={24} />
        <Typography variant="h5" fontWeight={700}>{t('profile.title')}</Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Dados pessoais */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                {t('profile.personalData')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.personalDataSub')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.phone')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('profile.email')}
                    value={userProfile?.email ?? ''}
                    disabled
                    helperText={t('profile.emailLocked')}
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
                  {savingProfile ? t('common.saving') : t('profile.saveChanges')}
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
                {t('profile.changePassword')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.changePasswordSub')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.newPassword')}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('profile.confirmPassword')}
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
                  {savingPassword ? t('profile.changing') : t('profile.changePasswordBtn')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
