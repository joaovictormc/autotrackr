import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, Chip, Switch, IconButton, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert,
} from '@mui/material';
import { Plus, Trash2, Play, Star } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { aiApi, AiModel, AiModelInput, AiProvider } from '../../api/ai.api';

const PROVIDERS: { value: AiProvider; label: string; hint: string }[] = [
  { value: 'ANTHROPIC', label: 'Anthropic (Claude)', hint: 'claude-haiku-4-5' },
  { value: 'OPENAI', label: 'OpenAI', hint: 'gpt-4o-mini' },
  { value: 'GEMINI', label: 'Google Gemini', hint: 'gemini-1.5-flash' },
  { value: 'OLLAMA', label: 'Ollama (self-hosted)', hint: 'llama3.1' },
];

const EMPTY: AiModelInput = {
  provider: 'ANTHROPIC', label: '', model: '', temperature: 0.7, enabled: true, isDefault: false,
  systemPrompt: 'Você é um assistente que escreve lembretes de manutenção veicular amigáveis e curtos em português.',
};

export default function AiModelsManager() {
  const { enqueueSnackbar } = useSnackbar();
  const [models, setModels] = useState<AiModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AiModelInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [testOut, setTestOut] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    aiApi.list()
      .then(setModels)
      .catch(() => enqueueSnackbar('Erro ao carregar modelos.', { variant: 'error' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const create = async () => {
    if (!form.label.trim() || !form.model.trim()) {
      return enqueueSnackbar('Informe rótulo e modelo.', { variant: 'warning' });
    }
    setSaving(true);
    try {
      await aiApi.create(form);
      enqueueSnackbar('Modelo criado.', { variant: 'success' });
      setDialogOpen(false);
      setForm(EMPTY);
      load();
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Erro ao criar modelo.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const patch = async (m: AiModel, dto: Partial<AiModelInput>) => {
    try {
      await aiApi.update(m.id, dto);
      load();
    } catch {
      enqueueSnackbar('Erro ao atualizar.', { variant: 'error' });
    }
  };

  const remove = async (m: AiModel) => {
    try {
      await aiApi.remove(m.id);
      setModels((prev) => prev.filter((x) => x.id !== m.id));
    } catch {
      enqueueSnackbar('Erro ao remover.', { variant: 'error' });
    }
  };

  const test = async (m: AiModel) => {
    setTestOut(null);
    try {
      const r = await aiApi.test(m.id);
      setTestOut(r.output);
    } catch {
      enqueueSnackbar('Erro ao testar modelo.', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>Modelos de IA</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Configure os provedores de IA usados para gerar os lembretes de manutenção (recurso Pro).
      </Typography>

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>Novo modelo</Button>
      </Stack>

      {testOut && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setTestOut(null)}>
          <strong>Saída de teste:</strong> {testOut}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rótulo</TableCell>
                  <TableCell>Provedor</TableCell>
                  <TableCell>Modelo</TableCell>
                  <TableCell>Padrão</TableCell>
                  <TableCell>Ativo</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>{m.label}</TableCell>
                    <TableCell>{m.provider}</TableCell>
                    <TableCell><code>{m.model}</code></TableCell>
                    <TableCell>
                      {m.isDefault ? (
                        <Chip size="small" color="primary" icon={<Star size={13} />} label="Padrão" />
                      ) : (
                        <Button size="small" onClick={() => patch(m, { isDefault: true })}>Definir</Button>
                      )}
                    </TableCell>
                    <TableCell><Switch size="small" checked={m.enabled} onChange={() => patch(m, { enabled: !m.enabled })} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => test(m)} title="Testar"><Play size={16} /></IconButton>
                      <IconButton size="small" color="error" onClick={() => remove(m)}><Trash2 size={16} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>Nenhum modelo configurado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Novo modelo de IA</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Provedor" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as AiProvider })} fullWidth>
              {PROVIDERS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <TextField label="Rótulo" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} fullWidth />
            <TextField label="Modelo" placeholder={PROVIDERS.find((p) => p.value === form.provider)?.hint} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} fullWidth />
            <TextField label="API Key" type="password" value={form.apiKey ?? ''} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} fullWidth />
            {form.provider === 'OLLAMA' && (
              <TextField label="Base URL" placeholder="http://localhost:11434" value={form.baseUrl ?? ''} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} fullWidth />
            )}
            <TextField label="System prompt" multiline rows={2} value={form.systemPrompt ?? ''} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} fullWidth />
            <TextField type="number" label="Temperatura" inputProps={{ step: 0.1, min: 0, max: 2 }} value={form.temperature} onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" disabled={saving} onClick={create}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
