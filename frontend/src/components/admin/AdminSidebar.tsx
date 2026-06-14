import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Home as HomeIcon,
  Car,
  LogOut as LogOutIcon,
  ChevronLeft,
  ChevronRight,
  Tag as TagIcon,
  ListIcon,
  ChevronsLeft,
  ChevronsRight,
  UserCog,
  CreditCard,
  Sparkles,
  BellRing
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Largura fixa do drawer lateral
const drawerWidth = 240;

export default function AdminSidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Lista de itens do menu
  const menuItems: { text: string; icon: React.ReactNode; path: string; adminOnly?: boolean }[] = [
    {
      text: 'Dashboard Admin',
      icon: <HomeIcon size={20} />,
      path: '/admin',
    },
    {
      text: 'Marcas',
      icon: <TagIcon size={20} />,
      path: '/admin/brands',
    },
    {
      text: 'Modelos',
      icon: <ListIcon size={20} />,
      path: '/admin/models',
    },
    {
      text: 'Usuários',
      icon: <UserCog size={20} />,
      path: '/admin/users',
    },
    {
      text: 'Pagamentos',
      icon: <CreditCard size={20} />,
      path: '/admin/payments',
      adminOnly: true,
    },
    {
      text: 'Modelos de IA',
      icon: <Sparkles size={20} />,
      path: '/admin/ai-models',
      adminOnly: true,
    },
    {
      text: 'Lembretes',
      icon: <BellRing size={20} />,
      path: '/admin/reminders',
      adminOnly: true,
    },
  ].filter((item) => !item.adminOnly || isAdmin);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : theme.spacing(7),
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : theme.spacing(7),
          boxSizing: 'border-box',
          overflowX: 'hidden',
          backgroundColor: theme.palette.background.paper,
          backdropFilter: 'blur(10px)',
          transition: theme.transitions.create(['width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: theme.spacing(1),
          justifyContent: open ? 'space-between' : 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {open && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              ml: 1,
            }}
          >
            <Car size={24} color={theme.palette.primary.main} />
            <Box component="span" sx={{ fontWeight: 'bold' }}>AutoTrackr</Box>
          </Box>
        )}
        <IconButton onClick={handleDrawerToggle}>
          {open ? (
            <ChevronsLeft size={24} />
          ) : (
            <ChevronsRight size={24} />
          )}
        </IconButton>
      </Box>

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor: location.pathname === item.path
                  ? `${theme.palette.primary.main}${theme.palette.mode === 'dark' ? '33' : '14'}`
                  : 'transparent',
                '&:hover': {
                  backgroundColor: `${theme.palette.primary.main}1f`,
                },
              }}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  },
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
            onClick={() => navigate('/dashboard')}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}
            >
              <Car size={20} />
            </ListItemIcon>
            <ListItemText primary="Área do Cliente" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
            onClick={signOut}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}
            >
              <LogOutIcon size={20} />
            </ListItemIcon>
            <ListItemText primary="Sair" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
} 