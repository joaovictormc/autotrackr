import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Avatar,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  User,
  LogOut,
  Layout,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function ProfileMenu({ anchorEl, open, onClose }: ProfileMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, userProfile, isAdmin, signOut } = useAuth();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleNavigation = (route: string) => {
    navigate(route);
    onClose();
  };

  const openLogoutConfirmation = () => {
    setConfirmLogoutOpen(true);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      setConfirmLogoutOpen(false);
      window.location.href = '/login';
    } catch (error) {
      setLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          elevation: 4,
          sx: { width: 250, borderRadius: 2, mt: 1 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <User size={18} />
            </Avatar>
          </ListItemIcon>
          <div>
            <Typography variant="body1" component="div" noWrap>
              {userProfile?.name || user?.email || 'Usuário'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </div>
        </MenuItem>
        <Divider />

        <MenuItem onClick={() => handleNavigation('/dashboard')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <Layout size={18} />
          </ListItemIcon>
          {t('profileMenu.dashboard')}
        </MenuItem>

        <MenuItem onClick={() => handleNavigation('/profile')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <User size={18} />
          </ListItemIcon>
          {t('profileMenu.myProfile')}
        </MenuItem>

        {isAdmin && (
          <>
            <Divider />
            <MenuItem onClick={() => handleNavigation('/admin')} sx={{ my: 0.5 }}>
              <ListItemIcon>
                <ShieldAlert size={18} color="#f97316" />
              </ListItemIcon>
              {t('profileMenu.adminArea')}
            </MenuItem>
          </>
        )}

        <Divider />
        <Box sx={{ p: 1 }}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<LogOut size={18} />}
            onClick={openLogoutConfirmation}
            sx={{ mt: 0.5, borderRadius: 1 }}
          >
            {t('profileMenu.logout')}
          </Button>
        </Box>
      </Menu>

      <Dialog
        open={confirmLogoutOpen}
        onClose={() => !loggingOut && setConfirmLogoutOpen(false)}
      >
        <DialogTitle>{t('profileMenu.confirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('profileMenu.confirmText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmLogoutOpen(false)}
            color="primary"
            disabled={loggingOut}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSignOut}
            color="error"
            variant="contained"
            startIcon={<LogOut size={16} />}
            disabled={loggingOut}
          >
            {loggingOut ? t('profileMenu.exiting') : t('profileMenu.exit')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
