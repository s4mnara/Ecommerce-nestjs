// src/pages/AdminDashboard.jsx
import React from 'react';
import { handleLogout } from '../utils/auth';

function AdminDashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Painel de Administração</h1>
      <button 
        onClick={handleLogout}
        style={{ position: 'absolute', top: 20, right: 20 }}
      >
        Sair
      </button>

      <p style={{ color: 'red', fontWeight: 'bold' }}>
        Acesso Concedido: Você possui a role 'admin'.
      </p>

      <h2>Funcionalidades CRUD:</h2>
      <ul>
        <li>Gerenciamento de Produtos (POST, PUT, DELETE)</li>
        <li>Relatórios e Logs do Kafka (Opcional)</li>
        <li>Gerenciamento de Usuários (Opcional)</li>
      </ul>
      
    </div>
  );
}

export default AdminDashboard;