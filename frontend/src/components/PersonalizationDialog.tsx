import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '../contexts/ThemeContext';

interface PersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function PersonalizationDialog({ open, onClose }: PersonalizationDialogProps) {
  const { accent, setAccent, accentOptions, mode, toggleColorMode } = useThemeContext();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('personalization.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          {t('personalization.accentColor')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
            gap: 1.5,
            mb: 3,
          }}
        >
          {accentOptions.map((opt) => (
            <Box
              key={opt.key}
              onClick={() => setAccent(opt.key)}
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                p: 0.5,
                border: '2px solid',
                borderColor: accent === opt.key ? opt.main : 'transparent',
                transition: 'border-color 0.15s',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  height: 40,
                  borderRadius: 1.5,
                  backgroundColor: opt.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {accent === opt.key && <Check size={18} />}
              </Box>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {opt.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('personalization.theme')}
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant={mode === 'light' ? 'contained' : 'outlined'}
            onClick={() => { if (mode !== 'light') toggleColorMode(); }}
            fullWidth
          >
            {t('personalization.light')}
          </Button>
          <Button
            variant={mode === 'dark' ? 'contained' : 'outlined'}
            onClick={() => { if (mode !== 'dark') toggleColorMode(); }}
            fullWidth
          >
            {t('personalization.dark')}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained">{t('common.done')}</Button>
      </DialogActions>
    </Dialog>
  );
}
