import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../index.css'; // Assumindo que index.css está um nível acima, ou ajuste para './index.css' se estiver na mesma pasta src/

// Função utilitária para extrair o nome do cliente (assumindo que o token ou localStorage tem essa informação)
const getClientName = () => {
    // Você deve ajustar esta lógica para onde o nome do cliente está armazenado (ex: decodificando o token, ou em localStorage)
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            return user.nome || 'Cliente';
        } catch (e) {
            return 'Cliente';
        }
    }
    return 'Cliente';
};


function ClientDashboard({ onLogout }) {
    const [produtos, setProdutos] = useState([]);
    const [search, setSearch] = useState('');
    const [carrinho, setCarrinho] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);
    const clientName = getClientName();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const token = localStorage.getItem('accessToken');
    const axiosAuth = axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
        carregarProdutos();
        // Você também deve carregar o carrinho e histórico aqui, se eles forem persistentes no backend
        // carregarCarrinho();
        // carregarHistorico();
    }, []);

    const carregarProdutos = async () => {
        try {
            const res = await axiosAuth.get('/produtos');
            setProdutos(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error("Erro ao carregar produtos:", err); }
    };
    
    // Simulação de Carrinho
    const adicionarAoCarrinho = (produtoId, quantidade) => {
        const produto = produtos.find(p => p.id === produtoId);
        if (!produto || quantidade <= 0) return;

        setCarrinho(prevCart => {
            const itemIndex = prevCart.findIndex(item => item.id === produtoId);

            if (itemIndex > -1) {
                // Se o produto já está no carrinho, atualiza a quantidade
                const newCart = [...prevCart];
                newCart[itemIndex].quantidade += quantidade;
                return newCart;
            } else {
                // Se for um novo produto
                return [...prevCart, { ...produto, quantidade }];
            }
        });
    };

    const atualizarQuantidadeCarrinho = (produtoId, novaQuantidade) => {
        if (novaQuantidade <= 0) {
            removerDoCarrinho(produtoId);
            return;
        }

        setCarrinho(prevCart =>
            prevCart.map(item =>
                item.id === produtoId ? { ...item, quantidade: novaQuantidade } : item
            )
        );
    };

    const removerDoCarrinho = (produtoId) => {
        setCarrinho(prevCart => prevCart.filter(item => item.id !== produtoId));
    };

    const limparCarrinho = () => {
        setCarrinho([]);
    };
    
    // Simulação de Finalizar Pedido
    const finalizarPedido = async () => {
        if (carrinho.length === 0) return;

        try {
            // Lógica real de API para finalizar pedido
            // const res = await axiosAuth.post('/pedidos', { itens: carrinho });

            // Simulação de sucesso
            const novoPedido = { 
                id: Date.now(), 
                data: new Date().toLocaleString(), 
                itens: carrinho, 
                total: carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0)
            };
            
            setHistory(prevHistory => [novoPedido, ...prevHistory]);
            limparCarrinho();
            setShowCart(false);
            alert('Pedido finalizado com sucesso!');

        } catch (err) {
            console.error("Erro ao finalizar pedido:", err);
            alert('Erro ao finalizar pedido. Tente novamente.');
        }
    };

    const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.descricao.toLowerCase().includes(search.toLowerCase())
    );
    
    // Componente de Card de Produto
    const ProdutoCard = ({ p }) => {
        const [quantidade, setQuantidade] = useState(1);
        
        const handleAdd = () => {
            adicionarAoCarrinho(p.id, quantidade);
            setQuantidade(1);
        }

        return (
            <div key={p.id} className="produto-card">
                {p.imagem && <img src={`${API_URL}/${p.imagem}`} alt={p.nome} />}
                <h4>{p.nome}</h4>
                <p className="produto-descricao">{p.descricao}</p>
                <p className="produto-preco">R$ {parseFloat(p.preco).toFixed(2)}</p>
                <p className="produto-estoque">Estoque: {p.estoque}</p>
                <div className="card-actions client-actions">
                    <input 
                        type="number" 
                        min="1" 
                        max={p.estoque} 
                        value={quantidade} 
                        onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                        className="quantity-input"
                    />
                    <button onClick={handleAdd} className="button submit-button small-button">
                        + Carrinho
                    </button>
                </div>
            </div>
        );
    };
    
    // Componente do Modal/Painel do Carrinho
    const CarrinhoPanel = () => {
        const total = carrinho.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

        return (
            <div className="side-panel clients-section">
                <h3>🛒 Seu Carrinho ({carrinho.length} itens)</h3>
                <div className="clientes-list">
                    {carrinho.length === 0 ? (
                        <p>O carrinho está vazio.</p>
                    ) : (
                        carrinho.map(item => (
                            <div key={item.id} className="cliente-card cart-item">
                                <p><strong>{item.nome}</strong></p>
                                <p>Preço unitário: R$ {parseFloat(item.preco).toFixed(2)}</p>
                                <div className="cart-actions-row">
                                    <label>Qtd:</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={item.quantidade} 
                                        onChange={(e) => atualizarQuantidadeCarrinho(item.id, parseInt(e.target.value) || 1)}
                                        className="quantity-input-small"
                                    />
                                    <button onClick={() => removerDoCarrinho(item.id)} className="button remove-button small-button">
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {carrinho.length > 0 && (
                    <div className="cart-summary">
                        <h4>Total: R$ {total.toFixed(2)}</h4>
                        <button onClick={limparCarrinho} className="button cancel-button full-width-button">Limpar Carrinho</button>
                        <button onClick={finalizarPedido} className="button submit-button full-width-button">Finalizar Pedido</button>
                    </div>
                )}
            </div>
        );
    };

    // Componente do Modal/Painel de Histórico
    const HistoricoPanel = () => (
        <div className="side-panel clients-section">
            <h3>📜 Histórico de Pedidos ({history.length})</h3>
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
                            {/* Você pode adicionar um botão para ver detalhes dos itens aqui */}
                        </div>
                    ))
                )}
            </div>
        </div>
    );


    return (
        <div className="admin-dashboard">
            {/* CABEÇALHO */}
            <header className="dashboard-header">
                <h2>Olá, {clientName}</h2>
                <input
                    type="text"
                    placeholder="Pesquisar produtos..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button onClick={onLogout} className="logout-desktop">Logout</button>
            </header>

            {/* CORPO PRINCIPAL */}
            <div className="dashboard-body-container">
                <div className="produtos-section-wrapper">
                    <div className="produtos-section">
                        <h3>Produtos Disponíveis</h3>
                        <div className="produtos-carousel client-carousel">
                            {produtosFiltrados.map(p => <ProdutoCard key={p.id} p={p} />)}
                            {produtosFiltrados.length === 0 && <p className="no-products-message">Nenhum produto encontrado.</p>}
                        </div>
                    </div>
                </div>

                {/* PAINEL LATERAL: Carrinho ou Histórico */}
                {showCart ? <CarrinhoPanel /> : showHistory ? <HistoricoPanel /> : (
                    // Painel Padrão (pode ser um placeholder ou uma promoção)
                    <div className="side-panel clients-section">
                        <h3>Bem-vindo!</h3>
                        <p>Use os botões abaixo para ver seu carrinho ou histórico de pedidos.</p>
                    </div>
                )}
                
            </div>

            {/* RODAPÉ E NAVEGAÇÃO DE CLIENTE */}
            <footer className="dashboard-footer client-footer">
                <button 
                    onClick={() => { setShowHistory(false); setShowCart(true); }} 
                    className="button footer-button cart-button"
                >
                    🛒 Carrinho ({carrinho.reduce((acc, item) => acc + item.quantidade, 0)})
                </button>
                <button 
                    onClick={() => { setShowCart(false); setShowHistory(true); }} 
                    className="button footer-button history-button"
                >
                    📜 Histórico de Pedidos
                </button>
                <button onClick={onLogout} className="button footer-button logout-mobile">
                    Logout
                </button>
            </footer>
        </div>
    );
}

export default ClientDashboard;
