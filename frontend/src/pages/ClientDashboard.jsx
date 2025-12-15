// src/pages/ClientDashboard.jsx
import React, { useEffect, useState } from "react";
import apiAuth from "../api"; // Axios com token já configurado
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import "../index.css";

// ======== UTIL ========
const getClientName = () => {
  const storedUser = localStorage.getItem("usuario");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.nome ? user.nome.split(" ")[0] : "Cliente";
    } catch {
      return "Cliente";
    }
  }
  return "Cliente";
};

function ClientDashboard({ onLogout }) {
  // ======== ESTADOS ========
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [search, setSearch] = useState("");

  const [carrinho, setCarrinho] = useState([]);
  const [loadingCarrinho, setLoadingCarrinho] = useState(false);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [showCart, setShowCart] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const clientName = getClientName();
  const storedUser = localStorage.getItem("usuario");
  const userId = storedUser ? JSON.parse(storedUser).id : null;

  // ======== CARREGAR DADOS ========
  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const res = await apiAuth.get("/produtos");
      setProdutos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      toast.error("Erro ao carregar produtos.");
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  };

  const carregarCarrinho = async () => {
    if (!userId) return;
    setLoadingCarrinho(true);
    try {
      const res = await apiAuth.get(`/carrinho/${userId}`);
      setCarrinho(res.data.itens || res.data || []);
    } catch (err) {
      console.error("Erro ao carregar carrinho:", err);
      toast.error("Erro ao carregar carrinho.");
      setCarrinho([]);
    } finally {
      setLoadingCarrinho(false);
    }
  };

  const carregarPedidos = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const res = await apiAuth.get(`/pedidos/usuario/${userId}`);
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      toast.error("Erro ao carregar histórico de pedidos.");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
    carregarCarrinho();
    carregarPedidos();
  }, []);

  // ======== CARRINHO ========
  const handleAddToCart = async (produto) => {
    if (!userId) return toast.error("Usuário não autenticado.");
    try {
      await apiAuth.post(`/carrinho/${userId}/adicionar`, { produtoId: produto.id, quantidade: 1 });
      carregarCarrinho();
      setShowCart(true);
      setShowHistory(false);
      toast.success(`${produto.nome} adicionado ao carrinho!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar produto ao carrinho.");
    }
  };

  const handleRemoveFromCart = async (produtoId) => {
    if (!userId) return;
    try {
      await apiAuth.delete(`/carrinho/${userId}/remover/${produtoId}`);
      carregarCarrinho();
      toast.info("Produto removido do carrinho.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover produto do carrinho.");
    }
  };

  const handleUpdateQuantity = async (produtoId, change) => {
    if (!userId) return;
    const item = carrinho.find((i) => i.id === produtoId);
    if (!item) return;

    const novaQuantidade = item.quantidade + change;
    if (novaQuantidade <= 0) {
      handleRemoveFromCart(produtoId);
      return;
    }

    try {
      await apiAuth.put(`/carrinho/${userId}/atualizar/${produtoId}`, { quantidade: novaQuantidade });
      carregarCarrinho();
    } catch (err) {
      console.error("Erro ao atualizar quantidade:", err);
      toast.error("Erro ao atualizar quantidade do item.");
    }
  };

  const handleClearCart = async () => {
    if (!userId) return;
    try {
      await apiAuth.delete(`/carrinho/${userId}/limpar`);
      carregarCarrinho();
      toast.info("Carrinho limpo com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao limpar carrinho.");
    }
  };

  const finalizarPedido = async () => {
    if (!userId) return;
    if (carrinho.length === 0) return toast.warn("Carrinho vazio.");

    try {
      const res = await apiAuth.post(`/pagamentos/iniciar/${userId}`);
      const { url, success } = res.data;
      if (success) window.location.href = url;
      else {
        toast.error("Erro no pagamento. Pedido criado como pendente.");
        carregarPedidos();
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao iniciar pagamento.");
      carregarPedidos();
    }
    setShowCart(false);
  };

  const tentarFinalizarPedido = async (pedidoId) => {
    if (!userId) return;
    try {
      const res = await apiAuth.post(`/pagamentos/reprocessar/${pedidoId}`);
      const { url, success } = res.data;
      if (success) window.location.href = url;
      else toast.error("Erro ao processar pagamento.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao tentar finalizar pedido.");
    }
  };

  // ======== UI Dinâmica ========
  const handleShowCart = () => {
    setShowHistory(false);
    setShowCart((prev) => !prev);
    if (!showCart) carregarCarrinho();
  };

  const handleShowHistory = () => {
    setShowCart(false);
    setShowHistory((prev) => !prev);
    if (!showHistory) carregarPedidos();
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCarrinho = carrinho
    .reduce((acc, item) => item.preco && item.quantidade ? acc + item.preco * item.quantidade : acc, 0)
    .toFixed(2);

  const countCarrinho = carrinho.reduce((acc, item) => item.quantidade ? acc + item.quantidade : acc, 0);

  // ======== COMPONENTES INTERNOS ========
  const ProdutoCard = ({ p }) => (
    <div key={p.id} className="produto-card">
      {p.imagem && <img src={`http://localhost:8080/uploads/${p.imagem}`} alt={p.nome} className="produto-imagem" />}
      <h3>{p.nome}</h3>
      <p className="produto-descricao">{p.descricao}</p>
      <p className="produto-preco">R$ {parseFloat(p.preco).toFixed(2)}</p>
      <button className="button add-button submit-button small-button" onClick={() => handleAddToCart(p)}>
        + Carrinho
      </button>
    </div>
  );

  const CarrinhoPanel = () => (
    <div className="cart-container side-panel clients-section side-panel-fixed">
      <h2>🛒 Seu Carrinho {loadingCarrinho && "(Carregando...)"}</h2>
      <button onClick={() => setShowCart(false)} className="button close-cart-button small-button">Fechar</button>
      {carrinho.length === 0 ? <p>Carrinho vazio.</p> : (
        <>
          <ul style={{ padding: 0, listStyle: 'none' }}>
            {carrinho.map(item => (
              <li key={item.id} className="cliente-card cart-item" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '10px', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--color-gray-border)' }}>
                <div>
                  <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nome}</span>
                  <span style={{ display: 'block', fontSize: '0.9em', color: 'var(--color-secondary)' }}>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => handleUpdateQuantity(item.id, -1)} className="button icon-button">-</button>
                  <span style={{ fontWeight: 'bold' }}>{item.quantidade}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, 1)} className="button icon-button">+</button>
                </div>
                <button onClick={() => handleRemoveFromCart(item.id)} className="button remove-button">Remover</button>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>Total: R${totalCarrinho}</p>
            <button onClick={handleClearCart} className="button remove-button" style={{ marginBottom: '10px', backgroundColor: '#8B0000' }}>Limpar Carrinho</button>
            <button onClick={finalizarPedido} className="button submit-button full-width-button">Finalizar Pedido</button>
          </div>
        </>
      )}
    </div>
  );

  const HistoricoPanel = () => (
    <div className="side-panel clients-section side-panel-fixed">
      <h3>📜 Histórico de Pedidos ({history.length}) {loadingHistory && "(Carregando...)"}</h3>
      <button onClick={() => setShowHistory(false)} className="button close-cart-button small-button">Fechar</button>
      <div className="clientes-list">
        {history.length === 0 ? <p>Você não possui pedidos.</p> :
          history.map((pedido, index) => {
            const status = pedido.status || 'pendente';
            return (
              <div key={pedido.id + index} className="cliente-card history-item">
                <p><strong>Pedido #{pedido.id}</strong></p>
                <p>Data: {pedido.data || new Date().toLocaleDateString()}</p>
                <p>Total: R$ {parseFloat(pedido.total || 0).toFixed(2)}</p>
                <p>Status: <span style={{ color: status === 'pendente' ? 'orange' : 'green', fontWeight: 'bold' }}>{status.toUpperCase()}</span></p>
                <p>Itens: {pedido.itens?.length || '0'}</p>
                {status === 'pendente' && <button onClick={() => tentarFinalizarPedido(pedido.id)} className="button submit-button full-width-button">Finalizar Pedido</button>}
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const activePanel = showCart ? <CarrinhoPanel /> : showHistory ? <HistoricoPanel /> : null;

  // ======== RENDER ========
  return (
    <div className="client-dashboard-layout">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="dashboard-header">
        <div className="client-greeting-group">
          <img src="/assets/logoamarela.png" alt="Logo" className="client-logo-header" />
          <h2 className="dashboard-title">Olá, {clientName}</h2>
        </div>

        <input type="text" placeholder="Pesquisar produtos..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={handleShowHistory} className="button pedidos-button">Pedidos</button>
        <button onClick={handleShowCart} className="button icon-button header-cart-button">
          <img src="/assets/carrinho.png" alt="Carrinho" className="icon-img" />
          <span className="cart-count">({countCarrinho})</span>
        </button>
        <button onClick={onLogout} className="button icon-button logout-desktop">
          <img src="/assets/logout.png" alt="Sair" className="icon-img-white" />
          <span>Sair</span>
        </button>
      </header>

      <div className="dashboard-body-container-client">
        <div className={`produtos-section-wrapper ${activePanel ? 'space-for-panel' : ''}`}>
          <div className="produtos-section">
            <h3>Produtos Disponíveis {loadingProdutos && "(Carregando...)"}</h3>
            <div className="produtos-carousel client-carousel">
              {produtosFiltrados.map(p => <ProdutoCard key={p.id} p={p} />)}
              {produtosFiltrados.length === 0 && <p className="no-products-message">Nenhum produto encontrado.</p>}
            </div>
          </div>
        </div>
        {activePanel}
      </div>

      <footer className="-footer client-footer">
        <button onClick={onLogout} className="button footer-button logout-mobile">Logout</button>
      </footer>
    </div>
  );
}

export default ClientDashboard;
