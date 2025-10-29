// src/components/ListaProdutos.jsx
import React, { useState, useEffect } from 'react';
import api from '../api';

function ListaProdutos({ onItemAdicionado }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        // GET /produtos é uma rota livre, mas usa o token se existir
        const response = await api.get('/produtos');
        setProdutos(response.data);
      } catch (err) {
        setErro('Falha ao carregar produtos.');
      } finally {
        setLoading(false);
      }
    };
    buscarProdutos();
  }, []);

  const handleAdicionarAoCarrinho = async (produtoId) => {
    const usuarioId = 2; // 🚨 ID Fixo para Teste!
    
    try {
      // POST /carrinho/:usuarioId/adicionar
      await api.post(`/carrinho/${usuarioId}/adicionar`, {
        produtoId: produtoId,
        quantidade: 1,
      });
      
      // Notifica o Dashboard para recarregar o carrinho
      onItemAdicionado(); 
      alert('Produto adicionado!');
      
    } catch (err) {
      alert('Erro ao adicionar produto. Verifique se está logado!');
      console.error(err);
    }
  };

  if (loading) return <div>Carregando produtos...</div>;
  if (erro) return <div style={{ color: 'red' }}>{erro}</div>;

  return (
    <div style={{ marginTop: '20px', flexGrow: 1 }}>
      <h2>Produtos Disponíveis</h2>
      {produtos.map(produto => (
        <div 
          key={produto.id} 
          style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
        >
          <h4>{produto.nome} - R${produto.preco.toFixed(2)}</h4>
          <p>Estoque: {produto.estoque}</p>
          <button onClick={() => handleAdicionarAoCarrinho(produto.id)}>
            Adicionar ao Carrinho
          </button>
        </div>
      ))}
    </div>
  );
}

export default ListaProdutos;