import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Alert, Snackbar, Button } from '@mui/material';
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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CssBaseline />
          <NetworkMonitor />
          <BrowserRouter>
            <Routes>
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
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;