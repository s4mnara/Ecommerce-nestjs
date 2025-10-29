// src/App.js (Apenas a lógica do App.js)
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // NOVO
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { getUserRole } from './utils/auth'; 

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [userRole, setUserRole] = useState(null);
  // NOVO ESTADO: Controla a view atual
  const [view, setView] = useState('login'); // Pode ser 'login', 'register', 'dashboard'

  useEffect(() => {
    if (token) {
      setUserRole(getUserRole());
      // Se há token, vá para o dashboard (a próxima checagem definirá Admin ou Client)
      setView('dashboard'); 
    } else {
      setUserRole(null);
      // Se não há token, volte para a view padrão (login)
      setView('login');
    }
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };
  
  // Funções de navegação simples
  const handleGoToRegister = () => setView('register');
  const handleGoToLogin = () => setView('login');


  // [Lógica de Recarga de Carrinho OMITIDA por brevidade]
  const [recarregarCarrinhoKey, setRecarregarCarrinhoKey] = useState(0);
  const handleItemAdicionado = () => setRecarregarCarrinhoKey(prevKey => prevKey + 1); 

  
  let content;

  if (view === 'register') {
    content = <RegisterPage 
                onGoToLogin={handleGoToLogin} 
                onRegistrationSuccess={handleGoToLogin} 
              />;

  } else if (view === 'login') {
    content = <LoginPage 
                onLoginSuccess={handleLogin} 
                onGoToRegister={handleGoToRegister} 
              />;

  } else if (view === 'dashboard' && userRole === 'admin') {
    content = <AdminDashboard />;
  
  } else if (view === 'dashboard' && userRole === 'user') {
    content = (
      <ClientDashboard 
        recarregarCarrinhoKey={recarregarCarrinhoKey} 
        handleItemAdicionado={handleItemAdicionado} 
      />
    );
  } else {
    content = <p>Carregando...</p>;
  }


  return (
    <div>
      {content}
    </div>
  );
}

export default App;