import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { getUserRole } from './utils/auth';

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [userRole, setUserRole] = useState(token ? getUserRole(token) : null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (newToken) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);

    const role = getUserRole(newToken);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUserRole(null);
  };

  let content;
  if (token && userRole) {
    // Redireciona para dashboard de acordo com a role
    if (userRole === 'admin') {
      content = <AdminDashboard onLogout={handleLogout} />;
    } else if (userRole === 'cliente') {
      content = <ClientDashboard onLogout={handleLogout} />;
    }
  } else if (token && !userRole) {
    content = <p style={{ textAlign: 'center', marginTop: '40px' }}>Carregando perfil...</p>;
  } else {
    content = isRegistering ? (
      <RegisterPage
        onRegistrationSuccess={() => setIsRegistering(false)}
        onGoToLogin={() => setIsRegistering(false)}
      />
    ) : (
      <LoginPage
        onLoginSuccess={handleLogin}
        onGoToRegister={() => setIsRegistering(true)}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#ffeb3b', minHeight: '100vh' }}>
      <Router>
        <Routes>
          <Route path="/*" element={content} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;




