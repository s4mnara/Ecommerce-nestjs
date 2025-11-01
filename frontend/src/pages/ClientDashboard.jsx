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
      console.error("Erro ao buscar produtos:", err);
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
      {/* Botão de Fechar */}
      <button onClick={() => setShowCart(false)} className="button close-cart-button small-button">Fechar</button> 
      
      {carrinho.length === 0 ? (
        <p>Carrinho vazio.</p>
      ) : (
        <>
          <ul className="clientes-list">
            {carrinho.map((item) => (
              <li key={item.id} className="cliente-card cart-item">
                <span>{item.nome}</span>
                <span>Qtd: {item.quantidade}</span>
                <span>R${(item.preco * item.quantidade).toFixed(2)}</span>
                <button
                  className="button remove-button small-button"
                  onClick={() => handleRemoveFromCart(item.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <div className="cart-summary">
            <p className="cart-total">Total: R${totalCarrinho}</p>
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
        {/* Botão de Fechar */}
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

