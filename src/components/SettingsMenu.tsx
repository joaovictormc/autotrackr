import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Settings,
  Sun,
  Moon,
  Bell,
  Palette,
  Languages,
} from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

interface SettingsMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ anchorEl, open, onClose }: SettingsMenuProps) {
  const { mode, toggleColorMode } = useThemeContext();

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
      <MenuItem onClick={toggleColorMode}>
        <ListItemIcon>
          {mode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </ListItemIcon>
        <ListItemText>
          {mode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
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
    </Menu>
  );
}