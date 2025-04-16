import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
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
  Settings,
  LogOut,
  UserCog,
  Car,
  Heart,
  Layout,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function ProfileMenu({ anchorEl, open, onClose }: ProfileMenuProps) {
  const navigate = useNavigate();
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
      // Forçar navegação para a página de login
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
          Dashboard
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/profile')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <User size={18} />
          </ListItemIcon>
          Meu Perfil
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/vehicles')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <Car size={18} />
          </ListItemIcon>
          Meus Veículos
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/favorites')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <Heart size={18} />
          </ListItemIcon>
          Favoritos
        </MenuItem>
        
        <MenuItem onClick={() => handleNavigation('/settings')} sx={{ my: 0.5 }}>
          <ListItemIcon>
            <Settings size={18} />
          </ListItemIcon>
          Configurações
        </MenuItem>

        {isAdmin && (
          <>
            <Divider />
            <MenuItem onClick={() => handleNavigation('/admin')} sx={{ my: 0.5 }}>
              <ListItemIcon>
                <ShieldAlert size={18} color="#FF9800" />
              </ListItemIcon>
              Área Administrativa
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
            sx={{ 
              mt: 0.5, 
              borderRadius: 1,
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
            }}
          >
            Sair da conta
          </Button>
        </Box>
      </Menu>

      {/* Diálogo de confirmação de logout */}
      <Dialog
        open={confirmLogoutOpen}
        onClose={() => !loggingOut && setConfirmLogoutOpen(false)}
      >
        <DialogTitle>Sair da conta</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar seus dados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmLogoutOpen(false)} 
            color="primary"
            disabled={loggingOut}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSignOut} 
            color="error" 
            variant="contained"
            startIcon={<LogOut size={16} />}
            disabled={loggingOut}
          >
            {loggingOut ? 'Saindo...' : 'Sair'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}