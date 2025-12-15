import React, { useEffect, useState } from 'react';
import api from '../api';
import "../index.css";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const BASE_IMAGE_URL = 'http://localhost:8080/uploads/';

const InventoryTable = ({ produtos, editarProduto, removerProduto, loading }) => (
    <div
        className="produto-form-panel"
        style={{
            marginTop: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0 // Importante para flexbox evitar overflow
        }}
    >
        <h3>Itens no Inventário {loading && "(Carregando...)"}</h3>
        <div style={{
            flex: 1, // Ocupa todo o espaço vertical restante
            overflowY: 'auto',
            paddingRight: '10px',
            // maxHeight: '400px', // Esta linha não é mais necessária, pois usamos flex: 1
        }}>
            <table className="inventory-table" width="100%">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Imagem</th>
                        <th>Nome</th>
                        <th>Descrição</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td style={{ textAlign: 'center' }}>
                                {p.imagem && (
                                    <img
                                        src={`${BASE_IMAGE_URL}${p.imagem}`}
                                        alt={p.nome}
                                        className="produto-imagem-tabela"
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            objectFit: "cover",
                                            borderRadius: "5px"
                                        }}
                                    />
                                )}
                            </td>
                            <td>{p.nome}</td>
                            <td>{p.descricao}</td>
                            <td>R$ {parseFloat(p.preco).toFixed(2)}</td>
                            <td>{p.estoque}</td>
                            <td className="card-actions actions-icons">
                                <button onClick={() => editarProduto(p)} className="button edit-button">Editar</button>
                                <button onClick={() => removerProduto(p.id)} className="button remove-button">Remover</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const UsuariosTable = ({ usuarios, removerUsuario, loading }) => (
    <div className="produto-form-panel" style={{ marginTop: '20px' }}>
        <h3>Usuários Cadastrados {loading && "(Carregando...)"}</h3>
        <table className="inventory-table" width="100%">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Função</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {usuarios.map(u => (
                    <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.nome}</td>
                        <td>{u.email}</td>
                        <td>{u.role || "cliente"}</td>
                        <td>
                            <button onClick={() => removerUsuario(u.id)} className="button remove-button">
                                Remover
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const LogsPanel = ({ logs, loading }) => {
    const [usuarioFiltro, setUsuarioFiltro] = useState('');
    const [metodoFiltro, setMetodoFiltro] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [pagina, setPagina] = useState(1);
    const porPagina = 10;

    const metodoCor = {
        GET: "#4CAF50",
        POST: "#2196F3",
        PUT: "#FF9800",
        DELETE: "#F44336"
    };

    const filtrarLogs = logs.filter(log => {
        const nomeUsuario = log.usuario?.nome?.toLowerCase() || "desconhecido";
        const passaUsuario = usuarioFiltro === '' || nomeUsuario.includes(usuarioFiltro.toLowerCase());
        const passaMetodo = metodoFiltro === '' || log.metodo === metodoFiltro;
        const dataLog = new Date(log.criadoEm);
        const passaInicio = !dataInicio || dataLog >= new Date(dataInicio + "T00:00");
        const passaFim = !dataFim || dataLog <= new Date(dataFim + "T23:59");
        return passaUsuario && passaMetodo && passaInicio && passaFim;
    });

    const agrupado = filtrarLogs.reduce((acc, log) => {
        const d = new Date(log.criadoEm).toLocaleDateString('pt-BR');
        if (!acc[d]) acc[d] = [];
        acc[d].push(log);
        return acc;
    }, {});

    const dias = Object.keys(agrupado);
    const totalPaginas = Math.max(1, Math.ceil(dias.length / porPagina));
    const diasPaginados = dias.slice((pagina - 1) * porPagina, pagina * porPagina);

    return (
        <div className="produto-form-panel" style={{ marginTop: "20px" }}>
            <h3>Logs de Acesso {loading && "(Carregando...)"}</h3>

            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
                <input type="text" placeholder="Filtrar por usuário" value={usuarioFiltro} onChange={e => setUsuarioFiltro(e.target.value)} />
                <select value={metodoFiltro} onChange={e => setMetodoFiltro(e.target.value)}>
                    <option value="">Método</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                </select>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
                {diasPaginados.map(dia => (
                    <div key={dia} style={{ marginBottom: "20px" }}>
                        <h4 style={{ borderBottom: "1px solid #555", paddingBottom: "5px" }}>{dia}</h4>
                        {agrupado[dia].map((log, i) => (
                            <div key={i} style={{
                                background: "rgba(255,255,255,0.05)",
                                padding: "10px",
                                marginBottom: "8px",
                                borderRadius: "8px",
                                borderLeft: `5px solid ${metodoCor[log.metodo] || "#999"}`
                            }}>
                                <div>
                                    <strong style={{ color: metodoCor[log.metodo] }}>{log.metodo}</strong> — {log.acao}
                                </div>
                                <div style={{ fontSize: "14px", marginTop: "4px" }}>
                                    Usuário: <strong>{log.usuario?.nome || "Desconhecido"}</strong>
                                </div>
                                <small>{new Date(log.criadoEm).toLocaleString("pt-BR")}</small>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "10px", gap: "10px" }}>
                <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1}>{"<"} Anterior</button>
                <span>Página {pagina} / {totalPaginas}</span>
                <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}>Próxima {">"}</button>
            </div>
        </div>
    );
};

function AdminDashboard({ onLogout }) {
    const [produtos, setProdutos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [logs, setLogs] = useState([]);
    const [form, setForm] = useState({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
    const [editando, setEditando] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Produtos');

    const [loadingProdutos, setLoadingProdutos] = useState(false);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const adminName = "Admin";

    useEffect(() => {
        if (activeMenu === 'Produtos') carregarProdutos();
        if (activeMenu === 'Usuários') carregarUsuarios();
        if (activeMenu === 'Logs') {
            carregarLogs();
            const interval = setInterval(carregarLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [activeMenu]);

    const carregarProdutos = async () => {
        setLoadingProdutos(true);
        try { const res = await api.get('/produtos'); setProdutos(res.data); } 
        catch (err) { console.error('Erro ao carregar produtos:', err); toast.error("Erro ao carregar produtos."); }
        finally { setLoadingProdutos(false); }
    };

    const carregarUsuarios = async () => {
        setLoadingUsuarios(true);
        try { const res = await api.get('/usuarios'); setUsuarios(res.data); } 
        catch (err) { console.error('Erro ao carregar usuários:', err); toast.error("Erro ao carregar usuários."); }
        finally { setLoadingUsuarios(false); }
    };

    const carregarLogs = async () => {
        setLoadingLogs(true);
        try { const res = await api.get('/logs'); setLogs(res.data); } 
        catch (err) { console.error('Erro ao carregar logs:', err); toast.error("Erro ao carregar logs."); }
        finally { setLoadingLogs(false); }
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setForm({ ...form, imagem: e.target.files[0] });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('nome', form.nome);
        formData.append('descricao', form.descricao);
        formData.append('preco', parseFloat(form.preco));
        formData.append('estoque', parseInt(form.estoque));
        if (form.imagem) formData.append('imagem', form.imagem);

        try {
            let res;
            if (editando) {
                res = await api.put(`/produtos/${form.id}`, formData);
                setProdutos(prev => prev.map(p => p.id === form.id ? { ...p, ...res.data } : p));
                toast.success("Produto atualizado com sucesso!");
            } else {
                res = await api.post('/produtos', formData);
                setProdutos(prev => [...prev, res.data]);
                toast.success("Produto adicionado com sucesso!");
            }
            setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
            setEditando(false);
        } catch (err) { console.error('Erro ao salvar produto:', err); toast.error("Erro ao salvar produto."); }
    };

    const editarProduto = (produto) => {
        setForm({ ...produto, imagem: null, preco: String(produto.preco), estoque: String(produto.estoque) });
        setEditando(true);
    };

    const removerProduto = async (id) => {
        try {
            if (!window.confirm("Tem certeza que deseja remover este item?")) return;
            await api.delete(`/produtos/${id}`);
            setProdutos(prev => prev.filter(p => p.id !== id));
            toast.info("Produto removido!");
        } catch (err) { console.error('Erro ao remover produto:', err); toast.error("Erro ao remover produto."); }
    };

    const removerUsuario = async (id) => {
        try {
            if (!window.confirm("Remover este usuário permanentemente?")) return;
            await api.delete(`/usuarios/${id}`);
            setUsuarios(prev => prev.filter(u => u.id !== id));
            toast.info("Usuário removido!");
        } catch (err) { console.error('Erro ao remover usuário:', err); toast.error("Erro ao remover usuário."); }
    };

    const Sidebar = () => (
        <nav className="sidebar">
            <a href="#" className={activeMenu === 'Produtos' ? 'active' : ''} onClick={() => setActiveMenu('Produtos')}>Produtos</a>
            <a href="#" className={activeMenu === 'Usuários' ? 'active' : ''} onClick={() => setActiveMenu('Usuários')}>Usuários</a>
            <a href="#" className={activeMenu === 'Logs' ? 'active' : ''} onClick={() => setActiveMenu('Logs')}>Logs de Acesso</a>
            <a href="#" onClick={onLogout}>Sair</a>
        </nav>
    );

    let fileName = '';
    if (form.imagem) fileName = form.imagem.name;
    else if (editando && produtos.find(p => p.id === form.id)?.imagem) fileName = 'Arquivo atual: ' + produtos.find(p => p.id === form.id).imagem;
    else fileName = 'Nenhum arquivo selecionado';

    return (
        <div className="admin-dashboard">
            <ToastContainer position="top-right" autoClose={3000} />
            <header className="dashboard-header" style={{ justifyContent: 'space-between' }}>
                <div className="client-greeting-group">
                    <img src="/assets/logoamarela.png" alt="Logo" className="client-logo-header" />
                    <h2 className="dashboard-title">{activeMenu}</h2>
                </div>
                <div className="client-greeting-group">
                    Bem-vindo(a), <strong style={{ color: 'var(--color-secondary)' }}>{adminName}</strong>
                </div>
            </header>

            <div className="dashboard-body-container">
                <Sidebar />
                <div 
                    className="produtos-section-wrapper main-content-full"
                    style={activeMenu === 'Produtos' ? { display: 'flex', flexDirection: 'column', height: '100%' } : {}}
                >
                    {activeMenu === 'Produtos' && (
                        <>
                            <div className="produto-form-panel">
                                <h3>{editando ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
                                <form onSubmit={handleSubmit} encType="multipart/form-data">
                                    <label>Nome</label>
                                    <input type="text" name="nome" value={form.nome} onChange={handleChange} required />
                                    <label>Descrição</label>
                                    <input type="text" name="descricao" value={form.descricao} onChange={handleChange} />
                                    <label>Imagem</label>
                                    <div className="file-input-group">
                                        <label htmlFor="imagem-upload" className="custom-file-upload-label">{fileName}</label>
                                        <input id="imagem-upload" type="file" name="imagem" accept="image/*" onChange={handleImageChange} className="hidden-file-input" />
                                    </div>
                                    <label>Preço</label>
                                    <input type="number" step="0.01" name="preco" value={form.preco} onChange={handleChange} required />
                                    <label>Estoque</label>
                                    <input type="number" name="estoque" value={form.estoque} onChange={handleChange} required />
                                    <button type="submit" className="button submit-button">{editando ? 'Salvar Alterações' : 'Salvar Item'}</button>
                                </form>
                            </div>
                            <InventoryTable produtos={produtos} editarProduto={editarProduto} removerProduto={removerProduto} loading={loadingProdutos} />
                        </>
                    )}

                    {activeMenu === 'Usuários' && (
                        <UsuariosTable usuarios={usuarios} removerUsuario={removerUsuario} loading={loadingUsuarios} />
                    )}

                    {activeMenu === 'Logs' && (
                        <LogsPanel logs={logs} loading={loadingLogs} />
                    )}
                </div>
            </div>

            <footer className="dashboard-footer client-footer">
                <button onClick={onLogout} className="button footer-button logout-mobile">Logout</button>
            </footer>
        </div>
    );
}

export default AdminDashboard;