// src/App.js
import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // NOVO IMPORT
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { getUserRole } from './utils/auth'; 

function App() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [userRole, setUserRole] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false); 

  useEffect(() => {
    if (token) {
      setUserRole(getUserRole());
    } else {
      setUserRole(null);
    }
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
  };
  
  // Lógica de estado e recarga de carrinho (mantida)
  const [recarregarCarrinhoKey, setRecarregarCarrinhoKey] = useState(0);
  const handleItemAdicionado = () => {
    setRecarregarCarrinhoKey(prevKey => prevKey + 1); 
  };


  let content;

  if (token) {
    // 1. Roteamento logado
    if (userRole === 'admin') {
      content = <AdminDashboard />;
    } else if (userRole === 'user') {
      content = (
        <ClientDashboard 
          recarregarCarrinhoKey={recarregarCarrinhoKey} 
          handleItemAdicionado={handleItemAdicionado} 
        />
      );
    } else {
      content = <p>Carregando perfil...</p>;
    }
  } else {
    // 2. Roteamento deslogado
    if (isRegistering) {
      // Se isRegistering for true, mostra a página de Cadastro
      content = (
        <RegisterPage 
          onRegistrationSuccess={() => setIsRegistering(false)} // Volta para o Login
          onGoToLogin={() => setIsRegistering(false)} // Vai para o Login
        />
      );
    } else {
      // Se isRegistering for false, mostra a página de Login
      content = (
        <LoginPage 
          onLoginSuccess={handleLogin} 
          // Adiciona a função para ir para o Cadastro
          onGoToRegister={() => setIsRegistering(true)} 
        />
      );
    }
  }

 return (
    <div style={{ /* ... */ }}>
      {/* ... formulário de login ... */}
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Não tem conta? <button onClick={onGoToRegister} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>Criar Conta</button>
      </p>
    </div>
  );
}

export default LoginPage;