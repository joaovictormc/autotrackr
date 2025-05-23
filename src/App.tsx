import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { CssBaseline, Alert, Snackbar, Button, Box } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AddVehicle from './pages/AddVehicle';
import AuthLayout from './layouts/AuthLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import BrandsManager from './pages/admin/BrandsManager';
import ModelsManager from './pages/admin/ModelsManager';
import SystemError from './pages/SystemError';

// Componente para monitorar estado da rede
function NetworkMonitor() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      // Esconder mensagem após 5 segundos
      setTimeout(() => setShowReconnected(false), 5000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClose = () => {
    setShowReconnected(false);
  };

  return (
    <>
      {isOffline && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 9999,
            borderRadius: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          Conexão com a internet perdida. Verificando conexão automaticamente...
        </Alert>
      )}
      
      <Snackbar
        open={showReconnected}
        autoHideDuration={5000}
        onClose={handleClose}
        message="Conexão com a internet restaurada"
        action={
          <Button color="inherit" size="small" onClick={handleClose}>
            OK
          </Button>
        }
      />
    </>
  );
}

// Definir tipos para o ErrorBoundary
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Componente para monitorar erros gerais da aplicação
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Erro capturado pela ErrorBoundary:', error, info);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          maxWidth: '600px', 
          margin: '40px auto' 
        }}>
          <h2>Algo deu errado</h2>
          <p>Ocorreu um erro inesperado na aplicação.</p>
          <p>Erro: {this.state.error?.message || 'Erro desconhecido'}</p>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReload}
            style={{ marginTop: '20px' }}
          >
            Recarregar Aplicação
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vehicles/new" element={<AddVehicle />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/brands" element={<BrandsManager />} />
        <Route path="/admin/models" element={<ModelsManager />} />
      </Route>
      <Route path="/system-error" element={<SystemError />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);

  // Detectar Ctrl+Alt+R para mostrar botão de emergência
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 'r') {
        setShowEmergencyReset(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEmergencyReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split("=");
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      alert('Emergência: Todos os dados foram limpos! A página será recarregada.');
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      alert('Erro ao limpar dados: ' + (error as Error).message);
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CssBaseline />
          <NetworkMonitor />
          <RouterProvider router={router} />

          {showEmergencyReset && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 9999,
              }}
            >
              <Button
                variant="contained"
                color="error"
                onClick={handleEmergencyReset}
                sx={{
                  boxShadow: '0 0 10px rgba(255,0,0,0.5)',
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(255,0,0,0.7)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(255,0,0,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(255,0,0,0)' },
                  },
                }}
              >
                Limpar Dados (Emergência)
              </Button>
            </Box>
          )}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;