import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Button, CircularProgress, Stack, TextField, InputAdornment, Select, MenuItem,
} from '@mui/material';
import { Crown, Search, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { adminApi, AdminUser } from '../../api/admin.api';
import { useAuth } from '../../contexts/AuthContext';

type AppRole = 'USER' | 'OPERADOR' | 'ADMIN';
const ROLE_LABELS: Record<AppRole, string> = { USER: 'Cliente', OPERADOR: 'Operador', ADMIN: 'Admin' };

export default function UsersManager() {
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => enqueueSnackbar('Erro ao carregar usuários.', { variant: 'error' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const togglePlan = async (u: AdminUser) => {
    const next = u.plan === 'PRO' ? 'FREE' : 'PRO';
    setBusyId(u.id);
    try {
      await adminApi.updatePlan(u.id, next);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan: next } : x)));
      enqueueSnackbar(`Plano de ${u.email} alterado para ${next}.`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao alterar plano.', { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (u: AdminUser, next: AppRole) => {
    if (next === u.role) return;
    setBusyId(u.id);
    try {
      await adminApi.updateRole(u.id, next);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
      enqueueSnackbar(`Função de ${u.email} alterada para ${ROLE_LABELS[next]}.`, { variant: 'success' });
    } catch {
      enqueueSnackbar('Erro ao alterar função.', { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users.filter((u) =>
    `${u.email} ${u.name ?? ''}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciar Usuários
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Controle a função (Admin/Usuário) e o plano (Free/Pro) de cada usuário.
      </Typography>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <TextField
            size="small"
            placeholder="Buscar por e-mail ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2, width: { xs: '100%', sm: 360 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>E-mail</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Função</TableCell>
                    <TableCell>Plano</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.name ?? '—'}</TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Select
                            size="small"
                            value={u.role}
                            disabled={busyId === u.id}
                            onChange={(e) => changeRole(u, e.target.value as AppRole)}
                            sx={{ minWidth: 130 }}
                          >
                            <MenuItem value="USER">{ROLE_LABELS.USER}</MenuItem>
                            <MenuItem value="OPERADOR">{ROLE_LABELS.OPERADOR}</MenuItem>
                            <MenuItem value="ADMIN">{ROLE_LABELS.ADMIN}</MenuItem>
                          </Select>
                        ) : (
                          <Chip
                            size="small"
                            icon={u.role === 'ADMIN' ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
                            label={ROLE_LABELS[u.role as AppRole] ?? u.role}
                            color={u.role === 'ADMIN' ? 'warning' : 'default'}
                            variant={u.role === 'USER' ? 'outlined' : 'filled'}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={u.plan === 'PRO' ? <Crown size={14} /> : undefined}
                          label={u.plan === 'PRO' ? 'Pro' : 'Gratuito'}
                          color={u.plan === 'PRO' ? 'primary' : 'default'}
                          variant={u.plan === 'PRO' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {isAdmin ? (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={busyId === u.id}
                            onClick={() => togglePlan(u)}
                          >
                            {u.plan === 'PRO' ? 'Tornar Free' : 'Tornar Pro'}
                          </Button>
                        ) : (
                          <Typography variant="caption" color="text.disabled">Somente leitura</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
