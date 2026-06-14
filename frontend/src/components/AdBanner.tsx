import { Box, Stack, Typography, Button } from '@mui/material';
import { Megaphone, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Banner de anúncio placeholder — exibido apenas para usuários do plano Free.
 * A rede de anúncios real (AdMob/AdSense) será integrada futuramente.
 */
export default function AdBanner() {
  const { t } = useTranslation();
  const { isPro } = useAuth();
  const navigate = useNavigate();

  if (isPro) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {t('plan.adLabel')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 0.5 }}>
        <Megaphone size={16} />
        <Typography variant="body2" color="text.secondary">
          {t('plan.adUpgrade')}
        </Typography>
        <Button size="small" variant="contained" startIcon={<Crown size={14} />} onClick={() => navigate('/pro')}>
          {t('plan.upgrade')}
        </Button>
      </Stack>
    </Box>
  );
}
