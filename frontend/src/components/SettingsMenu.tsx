import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
} from '@mui/material';
import {
  Bell,
  Palette,
  Languages,
  Download,
  Check as CheckIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PersonalizationDialog from './PersonalizationDialog';
import ExportDataDialog from './ExportDataDialog';
import { setLanguage } from '../i18n';

interface SettingsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ anchorEl, open, onClose }: SettingsMenuProps) {
  const { t, i18n } = useTranslation();

  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState(
    () => (localStorage.getItem('notificationsEnabled') ?? 'true') === 'true'
  );

  const handleToggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('notificationsEnabled', String(next));
    window.dispatchEvent(new Event('preferences:changed'));
  };

  const openPersonalization = () => {
    onClose();
    setPersonalizationOpen(true);
  };

  const openExport = () => {
    onClose();
    setExportOpen(true);
  };

  const chooseLanguage = (lng: 'pt' | 'en') => {
    setLanguage(lng);
    setLangAnchor(null);
    onClose();
  };

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'pt';

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 240,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleToggleNotifications}>
          <ListItemIcon>
            <Bell size={20} />
          </ListItemIcon>
          <ListItemText>{t('settings.notifications')}</ListItemText>
          <Switch
            edge="end"
            size="small"
            checked={notifications}
            onClick={handleToggleNotifications}
          />
        </MenuItem>

        <MenuItem onClick={openPersonalization}>
          <ListItemIcon>
            <Palette size={20} />
          </ListItemIcon>
          <ListItemText>{t('settings.personalization')}</ListItemText>
        </MenuItem>

        <MenuItem onClick={(e) => setLangAnchor(e.currentTarget)}>
          <ListItemIcon>
            <Languages size={20} />
          </ListItemIcon>
          <ListItemText>{t('settings.language')}</ListItemText>
          <ListItemText sx={{ textAlign: 'right', flex: 'unset', color: 'text.secondary' }}>
            {currentLang === 'en' ? 'EN' : 'PT'}
          </ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={openExport}>
          <ListItemIcon>
            <Download size={20} />
          </ListItemIcon>
          <ListItemText>{t('settings.exportData')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Submenu de idioma */}
      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <MenuItem onClick={() => chooseLanguage('pt')}>
          <ListItemIcon>{currentLang === 'pt' ? <CheckIcon size={18} /> : null}</ListItemIcon>
          <ListItemText>{t('language.portuguese')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => chooseLanguage('en')}>
          <ListItemIcon>{currentLang === 'en' ? <CheckIcon size={18} /> : null}</ListItemIcon>
          <ListItemText>{t('language.english')}</ListItemText>
        </MenuItem>
      </Menu>

      <PersonalizationDialog open={personalizationOpen} onClose={() => setPersonalizationOpen(false)} />
      <ExportDataDialog open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
