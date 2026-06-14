import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import SettingsMenu from '../components/SettingsMenu';
import ProfileMenu from '../components/ProfileMenu';
import NotificationsBell from '../components/NotificationsBell';
import {
  AlertTriangle,
  BarChart3,
  Car,
  Fuel,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Route,
  Settings,
  Shield,
  TrendingUp,
  User,
  Wrench,
} from 'lucide-react';

const DRAWER_WIDTH = 260;

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, to, onClick }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  const theme = useTheme();

  return (
    <ListItemButton
      onClick={() => { navigate(to); onClick(); }}
      selected={active}
      sx={{
        mx: 1,
        borderRadius: 2,
        mb: 0.5,
        '&.Mui-selected': {
          backgroundColor: `${theme.palette.primary.main}18`,
          '&:hover': { backgroundColor: `${theme.palette.primary.main}28` },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
        <Icon size={20} />
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 14,
          fontWeight: active ? 600 : 400,
          color: active ? 'primary.main' : 'text.primary',
        }}
      />
    </ListItemButton>
  );
}

export default function ProtectedLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { user, loading, loadingError, isStaff, retryConnection } = useAuth();

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoadingTimeout(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>{t('common.loading')}</Typography>

        {(loadingTimeout || loadingError) && (
          <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <AlertTriangle color="#f44336" size={24} />
              <Typography variant="body1" color="error" sx={{ ml: 1 }}>
                {loadingError ? 'Erro de conexão com o servidor.' : 'O carregamento está demorando.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={() => { setLoadingTimeout(false); retryConnection(); }} startIcon={<RefreshCw size={16} />}>
                Reconectar
              </Button>
              <Button variant="contained" onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* AppBar global */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton size="large" edge="start" sx={{ mr: { xs: 0.5, sm: 1 } }} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </IconButton>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 1 }}>
            <Car size={26} color={theme.palette.primary.main} />
          </Box>
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}
          >
            AutoTrackr
          </Typography>
          <Stack direction="row" spacing={{ xs: 0, sm: 0.5 }} alignItems="center">
            <NotificationsBell />
            <IconButton size="large" onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
              <Settings size={22} />
            </IconButton>
            <IconButton size="large" onClick={(e) => setProfileAnchorEl(e.currentTarget)}>
              <User size={22} />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Menus */}
      <SettingsMenu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
      />
      <ProfileMenu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
      />

      {/* Sidebar drawer */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{ sx: { width: DRAWER_WIDTH } }}
      >
        <Box sx={{ px: 2, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Car size={24} color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={700}>AutoTrackr</Typography>
        </Box>
        <Divider />
        <List sx={{ pt: 1 }}>
          <NavItem icon={LayoutDashboard} label={t('nav.dashboard')} to="/dashboard" onClick={() => setSidebarOpen(false)} />
          <NavItem icon={Wrench} label={t('nav.maintenance')} to="/maintenance" onClick={() => setSidebarOpen(false)} />
          <NavItem icon={Fuel} label={t('nav.fuel')} to="/fuel" onClick={() => setSidebarOpen(false)} />
          <NavItem icon={Route} label={t('nav.trips')} to="/trips" onClick={() => setSidebarOpen(false)} />
          <NavItem icon={TrendingUp} label={t('nav.revenue')} to="/revenue" onClick={() => setSidebarOpen(false)} />
          <NavItem icon={BarChart3} label={t('nav.reports')} to="/reports" onClick={() => setSidebarOpen(false)} />
          {isStaff && (
            <NavItem icon={Shield} label={t('nav.admin')} to="/admin" onClick={() => setSidebarOpen(false)} />
          )}
        </List>
      </Drawer>

      {/* Page content */}
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
