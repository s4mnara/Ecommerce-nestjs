import React, { useEffect, useState } from 'react';
import api from '../api';
import "../index.css";

const BASE_IMAGE_URL = 'http://localhost:8080/uploads/';

const InventoryTable = ({ produtos, editarProduto, removerProduto }) => (
    <div className="produto-form-panel" style={{ marginTop: '20px' }}>
        <h3>Itens no Inventário</h3>
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
);

const UsuariosTable = ({ usuarios, removerUsuario }) => (
    <div className="produto-form-panel" style={{ marginTop: '20px' }}>
        <h3>Usuários Cadastrados</h3>
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

const LogsPanel = ({ logs }) => (
    <div className="produto-form-panel" style={{ marginTop: '20px' }}>
        <h3>Logs de Acesso</h3>
        {logs.length === 0 ? (
            <p>Nenhum log encontrado.</p>
        ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {logs.map((log, i) => (
                    <li key={i} style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px',
                        marginBottom: '8px',
                        borderRadius: '8px'
                    }}>
                        <strong>{log.usuario || "Desconhecido"}</strong> — {log.acao}
                        <br />
                        <small>{new Date(log.data).toLocaleString()}</small>
                    </li>
                ))}
            </ul>
        )}
    </div>
);


function AdminDashboard({ onLogout }) {
    const [produtos, setProdutos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [logs, setLogs] = useState([]);
    const [form, setForm] = useState({
        id: null,
        nome: '',
        descricao: '',
        preco: '',
        estoque: '',
        imagem: null
    });
    const [editando, setEditando] = useState(false);
    const [activeMenu, setActiveMenu] = useState('Dashboard');
    const adminName = "Admin";

    useEffect(() => {
        if (activeMenu === 'Dashboard') carregarProdutos();
        if (activeMenu === 'Usuários') carregarUsuarios();
        if (activeMenu === 'Logs') carregarLogs();
    }, [activeMenu]);

    const carregarProdutos = async () => {
        try {
            const res = await api.get('/produtos');
            setProdutos(res.data);
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
        }
    };

    const carregarUsuarios = async () => {
        try {
            const res = await api.get('/usuarios');
            setUsuarios(res.data);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
        }
    };

    const carregarLogs = async () => {
        try {
            const res = await api.get('/logs');
            setLogs(res.data);
        } catch (err) {
            console.error('Erro ao carregar logs:', err);
        }
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
            if (editando) {
                await api.put(`/produtos/${form.id}`, formData);
            } else {
                await api.post('/produtos', formData);
            }
            
            setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
            setEditando(false);
            carregarProdutos();
        } catch (err) {
            console.error('Erro ao salvar produto:', err);
        }
    };

    const editarProduto = (produto) => {
        setForm({ 
            ...produto, 
            imagem: null,
            preco: String(produto.preco), 
            estoque: String(produto.estoque) 
        });
        setEditando(true);
    };

    const removerProduto = async (id) => {
        if (!window.confirm("Tem certeza que deseja remover este item?")) return;
        try {
            await api.delete(`/produtos/${id}`);
            carregarProdutos();
        } catch (err) {
            console.error('Erro ao remover produto:', err);
        }
    };

    const removerUsuario = async (id) => {
        if (!window.confirm("Remover este usuário permanentemente?")) return;
        try {
            await api.delete(`/usuarios/${id}`);
            carregarUsuarios();
        } catch (err) {
            console.error('Erro ao remover usuário:', err);
        }
    };

    const Sidebar = () => (
        <nav className="sidebar">
            <a href="#" className={activeMenu === 'Dashboard' ? 'active' : ''} onClick={() => setActiveMenu('Dashboard')}>
                <i className="fas fa-box"></i> Produtos
            </a>
            <a href="#" className={activeMenu === 'Usuários' ? 'active' : ''} onClick={() => setActiveMenu('Usuários')}>
                <i className="fas fa-users"></i> Usuários
            </a>
            <a href="#" className={activeMenu === 'Logs' ? 'active' : ''} onClick={() => setActiveMenu('Logs')}>
                <i className="fas fa-history"></i> Logs de Acesso
            </a>
            <a href="#" onClick={onLogout}>
                <i className="fas fa-sign-out-alt"></i> Sair
            </a>
        </nav>
    );

    let fileName = '';
    if (form.imagem) {
        fileName = form.imagem.name;
    } else if (editando && produtos.find(p => p.id === form.id)?.imagem) {
        fileName = 'Arquivo atual: ' + produtos.find(p => p.id === form.id).imagem;
    } else {
        fileName = 'Nenhum arquivo selecionado';
    }


    return (
        <div className="admin-dashboard">
            <header className="dashboard-header" style={{ justifyContent: 'space-between' }}>
                <div className="client-greeting-group">
                    <img src="/assets/logoamarela.png" alt="Logo" className="client-logo-header" />
                    <h2 className="dashboard-title">{activeMenu}</h2>
                </div>
                <div className="client-greeting-group">
                    Bem-vindo(a), <strong style={{color: 'var(--color-secondary)'}}>{adminName}</strong>
                </div>
            </header>

            <div className="dashboard-body-container">
                <Sidebar />

                <div className="produtos-section-wrapper main-content-full">
                    {activeMenu === 'Dashboard' && (
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
                                        <input 
                                            id="imagem-upload" 
                                            type="file" 
                                            name="imagem" 
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            className="hidden-file-input" 
                                        />
                                    </div>

                                    <label>Preço</label>
                                    <input type="number" step="0.01" name="preco" value={form.preco} onChange={handleChange} required />

                                    <label>Estoque</label>
                                    <input type="number" name="estoque" value={form.estoque} onChange={handleChange} required />

                                    <button type="submit" className="button submit-button">{editando ? 'Salvar Alterações' : 'Salvar Item'}</button>
                                </form>
                            </div>

                            <InventoryTable produtos={produtos} editarProduto={editarProduto} removerProduto={removerProduto} />
                        </>
                    )}

                    {activeMenu === 'Usuários' && <UsuariosTable usuarios={usuarios} removerUsuario={removerUsuario} />}
                    {activeMenu === 'Logs' && <LogsPanel logs={logs} />}
                </div>
            </div>

            <footer className="dashboard-footer client-footer">
                <button onClick={onLogout} className="button footer-button logout-mobile">Logout</button>
            </footer>
        </div>
    );
}

export default AdminDashboard;
