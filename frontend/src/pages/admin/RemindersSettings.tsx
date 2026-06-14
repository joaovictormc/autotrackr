import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Switch, FormControlLabel, TextField, Button,
  CircularProgress, Divider, Alert, Chip,
} from '@mui/material';
import { Play } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { remindersApi, RemindersConfig, EvolutionConfig, RunResult } from '../../api/reminders.api';

export default function RemindersSettings() {
  const { enqueueSnackbar } = useSnackbar();
  const [reminders, setReminders] = useState<RemindersConfig | null>(null);
  const [evolution, setEvolution] = useState<EvolutionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingR, setSavingR] = useState(false);
  const [savingE, setSavingE] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    remindersApi.getConfig()
      .then((c) => { setReminders(c.reminders); setEvolution(c.evolution); })
      .catch(() => enqueueSnackbar('Erro ao carregar config.', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  const saveReminders = async () => {
    if (!reminders) return;
    setSavingR(true);
    try {
      await remindersApi.updateReminders({
        enabled: reminders.enabled,
        emailEnabled: reminders.channels.email,
        whatsappEnabled: reminders.channels.whatsapp,
        hour: reminders.hour,
      });
      enqueueSnackbar('Lembretes salvos.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao salvar.', { variant: 'error' });
    } finally {
      setSavingR(false);
    }
  };

  const saveEvolution = async () => {
    if (!evolution) return;
    setSavingE(true);
    try {
      await remindersApi.updateEvolution(evolution);
      enqueueSnackbar('Evolution salvo.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao salvar.', { variant: 'error' });
    } finally {
      setSavingE(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setResult(null);
    try {
      setResult(await remindersApi.runNow());
    } catch {
      enqueueSnackbar('Erro ao rodar.', { variant: 'error' });
    } finally {
      setRunning(false);
    }
  };

  if (loading || !reminders || !evolution) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Lembretes</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Lembretes automáticos de manutenção atrasada (recurso Pro), enviados por e-mail e WhatsApp.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Canais</Typography>
          <Stack spacing={1}>
            <FormControlLabel
              control={<Switch checked={reminders.enabled} onChange={(e) => setReminders({ ...reminders, enabled: e.target.checked })} />}
              label="Lembretes habilitados"
            />
            <FormControlLabel
              control={<Switch checked={reminders.channels.email} onChange={(e) => setReminders({ ...reminders, channels: { ...reminders.channels, email: e.target.checked } })} />}
              label="E-mail"
            />
            <FormControlLabel
              control={<Switch checked={reminders.channels.whatsapp} onChange={(e) => setReminders({ ...reminders, channels: { ...reminders.channels, whatsapp: e.target.checked } })} />}
              label="WhatsApp (Evolution API)"
            />
            <TextField
              type="number" label="Hora do disparo (0-23)" size="small" sx={{ maxWidth: 200 }}
              inputProps={{ min: 0, max: 23 }}
              value={reminders.hour}
              onChange={(e) => setReminders({ ...reminders, hour: Number(e.target.value) })}
            />
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
            <Button variant="contained" disabled={savingR} onClick={saveReminders}>Salvar</Button>
            <Button variant="outlined" startIcon={running ? <CircularProgress size={16} /> : <Play size={16} />} disabled={running} onClick={runNow}>
              Rodar agora
            </Button>
            {result && (
              <Chip
                color={result.enabled ? 'success' : 'default'}
                label={result.enabled ? `${result.processed} processados · ${result.sent} enviados` : 'Lembretes desabilitados'}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Evolution API (WhatsApp)</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Configure sua instância do Evolution API. Enquanto desabilitado, os envios de WhatsApp são apenas registrados (modo stub).
          </Alert>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={evolution.enabled} onChange={(e) => setEvolution({ ...evolution, enabled: e.target.checked })} />}
              label="Habilitar envio real"
            />
            <TextField label="Base URL" placeholder="https://evolution.seudominio.com" value={evolution.baseUrl} onChange={(e) => setEvolution({ ...evolution, baseUrl: e.target.value })} fullWidth />
            <TextField label="Instância" value={evolution.instance} onChange={(e) => setEvolution({ ...evolution, instance: e.target.value })} fullWidth />
            <TextField label="API Key" type="password" value={evolution.apiKey} onChange={(e) => setEvolution({ ...evolution, apiKey: e.target.value })} fullWidth />
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Button variant="contained" disabled={savingE} onClick={saveEvolution}>Salvar Evolution</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
