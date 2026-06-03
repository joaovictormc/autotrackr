import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Settings,
  Sun,
  Moon,
  Bell,
  Palette,
  Languages,
  Database,
} from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

interface SettingsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ anchorEl, open, onClose }: SettingsMenuProps) {
  const theme = useTheme();
  const { toggleColorMode } = useThemeContext();

  const handleThemeToggle = () => {
    toggleColorMode();
    onClose();
  };

  return (
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
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={handleThemeToggle}>
        <ListItemIcon>
          {theme.palette.mode === 'dark' ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}
        </ListItemIcon>
        <ListItemText>
          {theme.palette.mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </ListItemText>
      </MenuItem>
      <MenuItem>
        <ListItemIcon>
          <Bell size={20} />
        </ListItemIcon>
        <ListItemText>Notificações</ListItemText>
      </MenuItem>
      <MenuItem>
        <ListItemIcon>
          <Palette size={20} />
        </ListItemIcon>
        <ListItemText>Personalização</ListItemText>
      </MenuItem>
      <MenuItem>
        <ListItemIcon>
          <Languages size={20} />
        </ListItemIcon>
        <ListItemText>Idioma</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem>
        <ListItemIcon>
          <Database size={20} />
        </ListItemIcon>
        <ListItemText>Backup & Sincronização</ListItemText>
      </MenuItem>
    </Menu>
  );
}