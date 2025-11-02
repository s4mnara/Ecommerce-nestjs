import React, { useEffect, useState } from "react";
import axios from "axios";
import "../index.css";

const getClientName = () => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            return user.nome ? user.nome.split(' ')[0] : "Cliente";
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
    const [history, setHistory] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const clientName = getClientName();
    
    const storedUser = localStorage.getItem("usuario");
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    const API_URL = "http://localhost:8080";
    const token = localStorage.getItem("accessToken");
    const axiosAuth = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` },
    });

    const carregarCarrinho = async () => {
        if (!userId) return;
        try {
            const res = await axiosAuth.get(`/carrinho/${userId}`);
            setCarrinho(res.data.itens || res.data || []); 
        } catch (err) {
            console.error("Erro ao carregar carrinho persistente:", err);
            setCarrinho([]);
        }
    };
    
    const carregarPedidos = async () => {
        if (!userId) return;
        try {
            const res = await axiosAuth.get(`/pedidos/usuario/${userId}`);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Erro ao carregar histórico de pedidos:", err);
            setHistory([]);
        }
    };

    useEffect(() => {
        carregarProdutos();
        carregarCarrinho();
        carregarPedidos();
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

    const handleAddToCart = async (produto) => {
        if (!userId) return alert("Usuário não autenticado.");
        try {
            await axiosAuth.post(`/carrinho/${userId}/adicionar`, {
                produtoId: produto.id,
                quantidade: 1,
            });
            carregarCarrinho(); 
        } catch (err) {
            alert("Erro ao adicionar produto ao carrinho.");
            console.error("Erro ao adicionar produto:", err);
        }
    };

    const handleRemoveFromCart = async (produtoId) => {
        if (!userId) return;
        try {
            await axiosAuth.delete(`/carrinho/${userId}/remover/${produtoId}`);
            carregarCarrinho();
        } catch (err) {
            alert("Erro ao remover produto do carrinho.");
            console.error("Erro ao remover produto:", err);
        }
    };

    const handleUpdateQuantity = async (produtoId, change) => {
        if (!userId) return;
        
        const item = carrinho.find(i => i.id === produtoId);
        if (!item) return;

        const novaQuantidade = item.quantidade + change;

        if (novaQuantidade <= 0) {
            await handleRemoveFromCart(produtoId);
            return;
        }

        try {
            await axiosAuth.put(`/carrinho/${userId}/atualizar/${produtoId}`, {
                quantidade: novaQuantidade, 
            });
            
            carregarCarrinho();
        } catch (err) {
             console.error("Erro ao atualizar quantidade:", err);
        }
    };
    
    const handleClearCart = async () => {
        if (!userId) return;
        try {
            await axiosAuth.delete(`/carrinho/${userId}/limpar`);
            carregarCarrinho();
        } catch (err) {
            alert("Erro ao limpar carrinho.");
            console.error("Erro ao limpar carrinho:", err);
        }
    };

    const handleShowCart = () => {
        setShowHistory(false);
        setShowCart((prev) => !prev);
        if (!showCart) {
             carregarCarrinho(); 
        }
    };

    const handleShowHistory = () => {
        setShowCart(false);
        setShowHistory((prev) => !prev);
        if (!showHistory) {
             carregarPedidos(); 
        }
    };

    const finalizarPedido = async () => {
        if (carrinho.length === 0) {
             alert("O carrinho está vazio.");
             return;
        }
        if (!userId) return;

        try {
            await axiosAuth.post(`/pedidos/usuario/${userId}`);
            
            alert("Pedido finalizado com sucesso!");
            carregarPedidos();
            carregarCarrinho(); 
            
        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            alert("Erro ao finalizar pedido. Verifique a API de pedidos e o CarrinhoService.");
        }
        setShowCart(false);
    };

    const produtosFiltrados = produtos.filter(
        (p) =>
            p.nome?.toLowerCase().includes(search.toLowerCase()) ||
            p.descricao?.toLowerCase().includes(search.toLowerCase())
    );

    const totalCarrinho = carrinho
        .reduce((acc, item) => item.preco && item.quantidade ? acc + item.preco * item.quantidade : acc, 0)
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
        <div className="cart-container side-panel clients-section side-panel-fixed">
            <h2>🛒 Seu Carrinho</h2>
            <button onClick={() => setShowCart(false)} className="button close-cart-button small-button">Fechar</button> 
            
            {carrinho.length === 0 ? (
                <p>Carrinho vazio.</p>
            ) : (
                <>
                    <ul className="clientes-list" style={{ padding: 0, listStyle: 'none' }}>
                        {carrinho.map((item) => {
                            const itemTotal = (item.preco && item.quantidade) ? (item.preco * item.quantidade) : 0;
                            const itemTotalDisplay = `R$ ${itemTotal.toFixed(2)}`;

                            return (
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
                                        <span style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.nome}
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.9em', color: 'var(--color-secondary)' }}>
                                            {itemTotalDisplay}
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
                            );
                        })}
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
        <div className="side-panel clients-section side-panel-fixed">
            <h3>📜 Histórico de Pedidos ({history.length})</h3>
            <button onClick={() => setShowHistory(false)} className="button close-cart-button small-button">Fechar</button> 

            <div className="clientes-list">
                {history.length === 0 ? (
                    <p>Você não possui pedidos finalizados.</p>
                ) : (
                    history.map(pedido => (
                        <div key={pedido.id} className="cliente-card history-item">
                            <p><strong>Pedido #{(pedido.id || 'N/A')}</strong></p>
                            <p>Data: {pedido.data || new Date().toLocaleDateString()}</p>
                            <p>Total: R$ {parseFloat(pedido.total || 0).toFixed(2)}</p>
                            <p>Itens: {pedido.itens?.length || '0'}</p>
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
                        ({carrinho.reduce((acc, item) => item.quantidade ? acc + item.quantidade : acc, 0)})
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
                <div className={`produtos-section-wrapper ${activePanel ? 'space-for-panel' : ''}`}>
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

