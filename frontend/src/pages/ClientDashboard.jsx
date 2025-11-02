import React, { useEffect, useState } from "react";
import axios from "axios";
import "../index.css";

const getClientName = () => {
  const storedUser = localStorage.getItem("usuario");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.nome || "Cliente";
    } catch (e) {
      return "Cliente";
    }
  }
  return "Cliente";
};

function ClientDashboard({ onLogout }) {
  const [produtos, setProdutos] = useState([]);
  const [search, setSearch] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const clientName = getClientName();

  const API_URL = "http://localhost:8080";
  const token = localStorage.getItem("accessToken");
  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const res = await axiosAuth.get("/produtos");
      setProdutos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      axios
        .get("http://localhost:8080/produtos")
        .then((res) => setProdutos(res.data))
        .catch((err) => console.error("Erro ao buscar produtos:", err));
    }
  };

  const handleAddToCart = (produto) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.id === produto.id);
      if (itemExistente) {
        return prev.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prev, { ...produto, quantidade: 1, preco: produto.preco }];
      }
    });
  };

  const handleRemoveFromCart = (id) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id, change) => {
    setCarrinho(prev => {
        return prev.map(item => {
            if (item.id === id) {
                const newQuantity = item.quantidade + change;
                if (newQuantity <= 0) {
                    return null;
                }
                return { ...item, quantidade: newQuantity };
            }
            return item;
        }).filter(item => item !== null);
    });
  };
  
  const handleClearCart = () => {
    setCarrinho([]);
  };

  const handleShowCart = () => {
    setShowHistory(false);
    setShowCart((prev) => !prev);
  };

  const handleShowHistory = () => {
    setShowCart(false);
    setShowHistory((prev) => !prev);
  };

  const finalizarPedido = () => {
    if (carrinho.length === 0) return;

    const novoPedido = {
      id: Date.now(),
      data: new Date().toLocaleString(),
      itens: carrinho,
      total: carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0),
    };
    setHistory((prevHistory) => [novoPedido, ...prevHistory]);
    setCarrinho([]);
    setShowCart(false);
    alert("Pedido finalizado com sucesso!");
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCarrinho = carrinho
    .reduce((acc, item) => acc + item.preco * item.quantidade, 0)
    .toFixed(2);

  const ProdutoCard = ({ p }) => (
    <div key={p.id} className="produto-card">
      <h3>{p.nome}</h3>
      <p className="produto-descricao">{p.descricao}</p>
      <p className="produto-preco">R$ {parseFloat(p.preco).toFixed(2)}</p>
      <button
        className="button add-button submit-button small-button"
        onClick={() => handleAddToCart(p)}
      >
        + Carrinho
      </button>
    </div>
  );

  const CarrinhoPanel = () => (
    <div className="cart-container side-panel clients-section">
      <h2>🛒 Seu Carrinho</h2>
      <button onClick={() => setShowCart(false)} className="button close-cart-button small-button">Fechar</button> 
      
      {carrinho.length === 0 ? (
        <p>Carrinho vazio.</p>
      ) : (
        <>
          <ul className="clientes-list" style={{ padding: 0, listStyle: 'none' }}>
            {carrinho.map((item) => (
              <li key={item.id} className="cliente-card cart-item" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 80px 100px', 
                  gap: '10px', 
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--color-gray-border)'
              }}>
                <div>
                    <span style={{ fontWeight: 'bold' }}>{item.nome}</span>
                    <span style={{ display: 'block', fontSize: '0.9em', color: 'var(--color-secondary)' }}>
                        R${(item.preco * item.quantidade).toFixed(2)}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <button
                        className="button icon-button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        style={{ width: '25px', height: '25px', padding: '0', backgroundColor: 'var(--color-primary)', color: 'var(--color-white)' }}
                    >
                        -
                    </button>
                    <span style={{ fontWeight: 'bold' }}>{item.quantidade}</span>
                    <button
                        className="button icon-button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        style={{ width: '25px', height: '25px', padding: '0', backgroundColor: 'var(--color-primary)', color: 'var(--color-white)' }}
                    >
                        +
                    </button>
                </div>
                <button
                    className="button remove-button"
                    onClick={() => handleRemoveFromCart(item.id)}
                    style={{ padding: '5px 10px', fontSize: '0.8em', minWidth: '70px' }} 
                >
                    Remover
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary" style={{ marginTop: '20px' }}>
            <p className="cart-total" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Total: R${totalCarrinho}</p>
            
            <button 
                onClick={handleClearCart} 
                className="button remove-button"
                style={{ marginBottom: '10px', backgroundColor: '#8B0000' }}
            >
                Limpar Carrinho
            </button>

            <button onClick={finalizarPedido} className="button submit-button full-width-button">
              Finalizar Pedido
            </button>
          </div>
        </>
      )}
    </div>
  );

  const HistoricoPanel = () => (
    <div className="side-panel clients-section">
        <h3>📜 Histórico de Pedidos ({history.length})</h3>
        <button onClick={() => setShowHistory(false)} className="button close-cart-button small-button">Fechar</button> 

        <div className="clientes-list">
            {history.length === 0 ? (
                <p>Você não possui pedidos finalizados.</p>
            ) : (
                history.map(pedido => (
                    <div key={pedido.id} className="cliente-card history-item">
                        <p><strong>Pedido #{pedido.id}</strong></p>
                        <p>Data: {pedido.data}</p>
                        <p>Total: R$ {pedido.total.toFixed(2)}</p>
                        <p>Itens: {pedido.itens.length}</p>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  const activePanel = showCart ? <CarrinhoPanel /> : showHistory ? <HistoricoPanel /> : null;

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="client-greeting-group">
          <img
            src="/assets/logoamarela.png"
            alt="Logo"
            className="client-logo-header"
          />
          <h2 className="dashboard-title">Olá, {clientName}</h2>
        </div>
        
        <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
        />

        <button 
            onClick={handleShowHistory} 
            className="button pedidos-button"
        >
            Pedidos
        </button>

        <button
          onClick={handleShowCart}
          className="button icon-button header-cart-button"
        >
          <img
            src="/assets/carrinho.png"
            alt="Carrinho"
            className="icon-img"
          />
          <span className="cart-count">
            ({carrinho.reduce((acc, item) => acc + item.quantidade, 0)})
          </span>
        </button>

        <button onClick={onLogout} className="button icon-button logout-desktop">
          <img
            src="/assets/logout.png"
            alt="Sair"
            className="icon-img-white"
          />
          <span>Sair</span>
        </button>
      </header>

      <div className="dashboard-body-container">
        <div className={`produtos-section-wrapper ${!activePanel ? 'main-content-full' : ''}`}>
            <div className="produtos-section">
                <h3>Produtos Disponíveis</h3>
                <div className="produtos-carousel client-carousel">
                    {produtosFiltrados.map((p) => (
                        <ProdutoCard key={p.id} p={p} />
                    ))}
                    {produtosFiltrados.length === 0 && <p className="no-products-message">Nenhum produto encontrado.</p>}
                </div>
            </div>
        </div>
        
        {activePanel}
      </div>
      
      <footer className="dashboard-footer client-footer">
          <button onClick={onLogout} className="button footer-button logout-mobile">
              Logout
          </button>
      </footer>
    </div>
  );
}

export default ClientDashboard;

