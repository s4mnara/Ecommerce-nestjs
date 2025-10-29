// src/components/Carrinho.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

function Carrinho() {
  const [carrinho, setCarrinho] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    // 🚨 IMPORTANTE: Seu endpoint usa o ID do usuário (ex: /carrinho/2). 
    // Você precisa de um ID fixo (2) ou deve decodificar o ID do token.
    const usuarioId = 2; // Substitua com o ID do usuário logado (ex: o ID que tem a role 'admin')
    
    const buscarCarrinho = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/carrinho/${usuarioId}`);
        setCarrinho(response.data);
        setErro(null);
      } catch (err) {
        setErro('Falha ao carregar o carrinho. (Requisição Protegida)');
      } finally {
        setLoading(false);
      }
    };

    buscarCarrinho();
  // O array vazio [] faz o fetch rodar apenas na montagem.
  // A recarga é forçada pela 'key' no componente pai.
  }, []); 

  if (loading) return <div style={{ minWidth: '300px' }}>Carregando carrinho...</div>;
  if (erro) return <div style={{ color: 'red', minWidth: '300px' }}>{erro}</div>;
  if (!carrinho || carrinho.itens.length === 0) return <div style={{ minWidth: '300px', border: '1px solid #ccc', padding: '15px' }}>Seu carrinho está vazio.</div>;

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginTop: '20px', minWidth: '300px' }}>
      <h3>Meu Carrinho (Total: R${carrinho.total.toFixed(2)})</h3>
      <ul>
        {carrinho.itens.map(item => (
          <li key={item.id} style={{ marginBottom: '10px' }}>
            {item.produto.nome} - Qtd: {item.quantidade} 
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Carrinho;