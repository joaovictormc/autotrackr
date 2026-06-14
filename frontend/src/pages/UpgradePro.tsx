import { useEffect, useState } from 'react';
import {
  Container, Card, CardContent, Typography, Stack, TextField, Button, Box, Chip,
  List, ListItem, ListItemIcon, ListItemText, Divider, CircularProgress, Alert, Paper,
} from '@mui/material';
import { Crown, Check, Copy, ExternalLink } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { billingApi, AvailableGateway, PaymentProvider, Subscription, PricePreview } from '../api/billing.api';

const BENEFITS = [
  'Cadastro de veículos ilimitado',
  'Sem anúncios',
  'Exportação de relatórios (PDF e CSV)',
  'Lembretes inteligentes de manutenção (e-mail e WhatsApp)',
];

export default function UpgradePro() {
  const { user, refreshProfile } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [gateways, setGateways] = useState<AvailableGateway[]>([]);
  const [method, setMethod] = useState<PaymentProvider | null>(null);
  const [coupon, setCoupon] = useState('');
  const [price, setPrice] = useState<PricePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [sub, setSub] = useState<Subscription | null>(null);

  const isPro = user?.plan === 'PRO';

  useEffect(() => {
    Promise.all([billingApi.availableGateways(), billingApi.preview()])
      .then(([gs, p]) => {
        setGateways(gs);
        setMethod(gs.find((g) => g.isDefault)?.provider ?? gs[0]?.provider ?? null);
        setPrice(p);
      })
      .catch(() => enqueueSnackbar('Erro ao carregar planos.', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  const applyCoupon = async () => {
    try {
      const p = await billingApi.preview(coupon || undefined);
      setPrice(p);
      enqueueSnackbar(coupon ? 'Cupom aplicado.' : 'Cupom removido.', { variant: 'success' });
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Cupom inválido.', { variant: 'error' });
    }
  };

  const startCheckout = async () => {
    if (!method) return;
    setChecking(true);
    try {
      const s = await billingApi.checkout(method, coupon || undefined);
      setSub(s);
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Erro ao iniciar checkout.', { variant: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const confirmPayment = async () => {
    if (!sub) return;
    setChecking(true);
    try {
      await billingApi.confirm(sub.id);
      await refreshProfile();
      enqueueSnackbar('Bem-vindo ao Pro! 🎉', { variant: 'success' });
      navigate('/dashboard');
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message ?? 'Erro ao confirmar pagamento.', { variant: 'error' });
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Crown size={28} color="#f59e0b" />
        <Typography variant="h4" fontWeight={700}>AutoTrackr Pro</Typography>
      </Stack>

      {isPro ? (
        <Alert severity="success">Você já é Pro. Obrigado pelo apoio!</Alert>
      ) : (
        <Card>
          <CardContent>
            <List dense>
              {BENEFITS.map((b) => (
                <ListItem key={b} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}><Check size={18} color="#22c55e" /></ListItemIcon>
                  <ListItemText primary={b} />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {price && (
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 2 }}>
                <Typography variant="h4" fontWeight={800}>R$ {price.finalAmount.toFixed(2)}</Typography>
                {price.discount > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                    R$ {price.basePrice.toFixed(2)}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary">/ mês</Typography>
              </Stack>
            )}

            {!sub ? (
              <>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <TextField size="small" label="Cupom" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} fullWidth />
                  <Button onClick={applyCoupon}>Aplicar</Button>
                </Stack>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>Método de pagamento</Typography>
                {gateways.length === 0 ? (
                  <Alert severity="info">Nenhum método de pagamento disponível no momento.</Alert>
                ) : (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {gateways.map((g) => (
                      <Chip
                        key={g.provider}
                        label={g.label}
                        color={method === g.provider ? 'primary' : 'default'}
                        variant={method === g.provider ? 'filled' : 'outlined'}
                        onClick={() => setMethod(g.provider)}
                      />
                    ))}
                  </Stack>
                )}

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={!method || checking}
                  onClick={startCheckout}
                  startIcon={checking ? <CircularProgress size={18} /> : <Crown size={18} />}
                >
                  Assinar Pro
                </Button>
              </>
            ) : (
              <Box>
                {sub.pixPayload && (
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Pix copia e cola</Typography>
                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13 }}>
                      {sub.pixPayload}
                    </Paper>
                    <Button
                      size="small"
                      startIcon={<Copy size={14} />}
                      onClick={() => { navigator.clipboard.writeText(sub.pixPayload!); enqueueSnackbar('Copiado.', { variant: 'success' }); }}
                      sx={{ mb: 2 }}
                    >
                      Copiar código Pix
                    </Button>
                  </>
                )}
                {sub.checkoutUrl && (
                  <Button
                    variant="outlined"
                    fullWidth
                    href={sub.checkoutUrl}
                    target="_blank"
                    rel="noopener"
                    startIcon={<ExternalLink size={16} />}
                    sx={{ mb: 2 }}
                  >
                    Abrir checkout
                  </Button>
                )}
                <Alert severity="info" sx={{ mb: 2 }}>
                  Após pagar, confirme abaixo para liberar o Pro. (Confirmação automática via webhook entra na versão final.)
                </Alert>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={checking}
                  onClick={confirmPayment}
                  startIcon={checking ? <CircularProgress size={18} /> : <Check size={18} />}
                >
                  Já paguei / Confirmar
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
