// src/pages/ClientDashboard.jsx
import React from 'react';
import ListaProdutos from '../components/ListaProdutos';
import Carrinho from '../components/Carrinho';
import { handleLogout } from '../utils/auth'; // Usaremos a função de logout

function ClientDashboard({ recarregarCarrinhoKey, handleItemAdicionado }) {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '30px' }}>
      <button 
        onClick={handleLogout}
        style={{ position: 'absolute', top: 20, right: 20 }}
      >
        Sair
      </button>

      {/* Coluna de Produtos */}
      <div style={{ flex: '1 1 50%' }}>
        <h1>Loja Online</h1>
        <ListaProdutos onItemAdicionado={handleItemAdicionado} /> 
      </div>

      {/* Coluna do Carrinho */}
      <div style={{ flex: '1 1 50%' }}>
        <h1>Meu Carrinho</h1>
        <Carrinho key={recarregarCarrinhoKey} /> 
      </div>
    </div>
  );
}

export default ClientDashboard;