import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddVehicle from './pages/AddVehicle';
import AuthLayout from './layouts/AuthLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import BrandsManager from './pages/admin/BrandsManager';
import ModelsManager from './pages/admin/ModelsManager';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
    </ThemeProvider>
  );
}

export default App;