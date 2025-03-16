import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import UserDashboard from './pages/UserDashboard';
import BingoGame from './pages/BingoGame';
import CartellaManagement from './pages/CartellaManagement';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    // Store the attempted URL to redirect back after login
    sessionStorage.setItem('redirectUrl', window.location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const AuthenticatedRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) {
    // If already logged in, redirect to role-specific dashboard
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <AuthenticatedRoute>
                  <Login />
                </AuthenticatedRoute>
              }
            />
            
            {/* Default route - redirect to login */}
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
            
            {/* Protected routes */}
            <Route
              path="/superadmin"
              element={
                <PrivateRoute roles={['superadmin']}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/agent"
              element={
                <PrivateRoute roles={['agent']}>
                  <AgentDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/user"
              element={
                <PrivateRoute roles={['user']}>
                  <UserDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="/game"
              element={
                <PrivateRoute roles={['user']}>
                  <BingoGame />
                </PrivateRoute>
              }
            />

            <Route
              path="/cartellas"
              element={
                <PrivateRoute roles={['superadmin', 'agent']}>
                  <CartellaManagement />
                </PrivateRoute>
              }
            />

            {/* Catch all - redirect to login */}
            <Route
              path="*"
              element={<Navigate to="/login" replace />}
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
