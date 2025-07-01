import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Cuentas from './pages/Cuentas';
import Clientes from './pages/Clientes';
import Calculadora from './pages/Calculadora';
import Usuarios from './pages/Usuarios';
import ImportExport from './pages/ImportExport';
import { DataProvider } from './contexts/DataContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Componente para proteger rutas
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="cuentas" element={<Cuentas />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="calculadora" element={<Calculadora />} />
        <Route 
          path="usuarios" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Usuarios />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="import-export" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ImportExport />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

// Componente raíz de la aplicación
const App: React.FC = () => {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <DataProvider>
          <Router>
            <AppContent />
          </Router>
        </DataProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App;
