import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
} from '@mui/material';
import { Settings, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SettingsMenu from '../SettingsMenu';
import ProfileMenu from '../ProfileMenu';

export default function AdminAppBar() {
  const theme = useTheme();
  const { user } = useAuth();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backdropFilter: 'blur(6px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          AutoTrackr Admin
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user?.email && (
            <Typography
              variant="body2"
              sx={{
                mr: 2,
                color: theme.palette.text.secondary,
              }}
            >
              {user.email}
            </Typography>
          )}

          <IconButton
            onClick={handleSettingsClick}
            size="large"
            edge="end"
            color="inherit"
            aria-label="configurações"
          >
            <Settings size={24} />
          </IconButton>

          <IconButton
            onClick={handleProfileClick}
            size="large"
            edge="end"
            color="inherit"
            aria-label="perfil"
          >
            <User size={24} />
          </IconButton>
        </Box>

        <SettingsMenu
          anchorEl={settingsAnchorEl}
          open={Boolean(settingsAnchorEl)}
          onClose={handleSettingsClose}
        />

        <ProfileMenu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
        />
      </Toolbar>
    </AppBar>
  );
} 