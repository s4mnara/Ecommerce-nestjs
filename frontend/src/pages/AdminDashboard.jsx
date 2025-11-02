import React, { useEffect, useState } from 'react';
import api from '../api';
import "../index.css";

// Componente Tabela de Itens (para reutilização e melhor separação)
const InventoryTable = ({ produtos, editarProduto, removerProduto }) => (
    <div className="produto-form-panel" style={{ marginTop: '20px' }}>
        <h3>Itens no Inventário</h3>
        <table className="inventory-table" width="100%">
            <thead>
                <tr>
                    <th>ID</th>
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
                        <td>{p.nome}</td>
                        <td>{p.descricao}</td>
                        <td>R$ {parseFloat(p.preco).toFixed(2)}</td>
                        <td>{p.estoque}</td>
                        <td className="card-actions actions-icons">
                            <button 
                                onClick={() => editarProduto(p)} 
                                className="button edit-button"
                            >
                                Editar
                            </button>
                            <button 
                                onClick={() => removerProduto(p.id)} 
                                className="button remove-button"
                            >
                                Remover
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


function AdminDashboard({ onLogout }) {
    const [produtos, setProdutos] = useState([]);
    const [form, setForm] = useState({
        id: null,
        nome: '',
        descricao: '',
        preco: '',
        estoque: '',
        imagem: null // Novo campo para a imagem
    });
    const [editando, setEditando] = useState(false);
    // Removemos 'Inventário' do state, pois não é mais uma opção de navegação
    const [activeMenu, setActiveMenu] = useState('Dashboard'); 
    
    // Simplificada a saudação conforme pedido
    const adminName = "Admin"; 

    useEffect(() => {
        carregarProdutos();
    }, []);

    const carregarProdutos = async () => {
        try {
            const res = await api.get('/produtos');
            const data = res.data.map(p => ({
                ...p,
                preco: String(p.preco),
                estoque: String(p.estoque)
            }));
            setProdutos(data);
        } catch (err) {
            console.error('Erro ao carregar produtos:', err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Novo manipulador para o campo de arquivo
    const handleImageChange = (e) => {
        setForm({ ...form, imagem: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Crie um FormData para enviar o arquivo
        const formData = new FormData();
        formData.append('nome', form.nome);
        formData.append('descricao', form.descricao);
        formData.append('preco', parseFloat(form.preco));
        formData.append('estoque', parseInt(form.estoque));
        
        // Anexar a imagem, se existir
        if (form.imagem) {
            formData.append('imagem', form.imagem);
        }

        try {
            if (editando) {
                // Para PUT com arquivos, use o formData
                await api.put(`/produtos/${form.id}`, formData);
            } else {
                // Para POST com arquivos, use o formData
                await api.post('/produtos', formData);
            }
            // Resetar o formulário
            setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
            setEditando(false);
            carregarProdutos();
        } catch (err) {
            console.error('Erro ao salvar produto:', err);
        }
    };

    const editarProduto = (produto) => {
        // Ao editar, não preenchemos o campo 'imagem' com o path (por segurança e funcionalidade), 
        // e deixamos 'imagem: null' para que o usuário possa re-selecionar
        setForm({ ...produto, imagem: null, preco: String(produto.preco), estoque: String(produto.estoque) });
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
    
    const Sidebar = () => (
        <nav className="sidebar">
            <a href="#" className={activeMenu === 'Dashboard' ? 'active' : ''} onClick={() => setActiveMenu('Dashboard')}>
                <i className="fas fa-tachometer-alt"></i> Dashboard
            </a>
            {/* O item 'Inventário' foi removido daqui */}
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

    // Texto para o campo de upload
    const fileName = form.imagem ? form.imagem.name : 'Nenhum arquivo selecionado';

    return (
        <div className="admin-dashboard">
            <header className="dashboard-header" style={{ justifyContent: 'space-between' }}>
                <div className="client-greeting-group">
                    <img
                        src="/assets/logoamarela.png"
                        alt="Gotham Lock Logo"
                        className="client-logo-header"
                    />
                    <h2 className="dashboard-title">Gerenciamento de Inventário</h2>
                </div>
                <div className="client-greeting-group">
                    Bem-vindo(a), <strong style={{color: 'var(--color-secondary)'}}>{adminName}</strong>
                </div>
            </header>

            <div className="dashboard-body-container">
                <Sidebar /> 

                <div className="produtos-section-wrapper main-content-full">
                    
                    <div className="produto-form-panel">
                        <div className="form-header" style={{ borderBottom: '2px solid var(--color-secondary)' }}>
                           <h3 style={{ margin: '0', color: 'var(--color-white)', textAlign: 'left' }}>
                             {editando ? '✏️ Editar Item' : '➕ Cadastrar Novo Item'}
                           </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ gap: '15px' }} encType="multipart/form-data">
                            
                            {/* Linha 1: Nome do Item */}
                            <label style={{ color: 'var(--color-white)', fontWeight: 'bold' }}>Nome do Item</label>
                            <input type="text" name="nome" placeholder="Nome do Item" value={form.nome} onChange={handleChange} required />
                            
                            {/* Linha 2: Descrição */}
                            <label style={{ color: 'var(--color-white)', fontWeight: 'bold' }}>Descrição</label>
                            <input type="text" name="descricao" placeholder="Descrição (Opcional)" value={form.descricao} onChange={handleChange} />

                            {/* Linha 3: Imagem do Produto (Campo recuperado) */}
                            <label style={{ color: 'var(--color-white)', fontWeight: 'bold' }}>Foto do Produto</label>
                            <div className="file-input-group">
                                <label htmlFor="imagem-upload" className="custom-file-upload-label">
                                    {fileName}
                                </label>
                                <input 
                                    id="imagem-upload"
                                    type="file" 
                                    name="imagem" 
                                    accept="image/*"
                                    onChange={handleImageChange} 
                                    className="hidden-file-input"
                                />
                                {form.imagem && (
                                    <button 
                                        type="button" 
                                        onClick={() => setForm({...form, imagem: null})}
                                        className="button remove-button"
                                        style={{ padding: '8px 15px', fontSize: '14px', margin: '0 5px' }}
                                    >
                                        X
                                    </button>
                                )}
                            </div>

                            {/* Linha 4: Preço e Estoque */}
                            <div style={{display: 'flex', gap: '15px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{ color: 'var(--color-white)', fontWeight: 'bold' }}>Preço</label>
                                    <input type="number" step="0.01" name="preco" placeholder="Preço" value={form.preco} onChange={handleChange} required />
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={{ color: 'var(--color-white)', fontWeight: 'bold' }}>Estoque</label>
                                    <input type="number" name="estoque" placeholder="Estoque" value={form.estoque} onChange={handleChange} required />
                                </div>
                            </div>
                            
                            {/* Linha 5: Botões de Ação */}
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px'}}>
                                {editando && (
                                    <button type="button" 
                                            onClick={() => {setEditando(false); setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });}}
                                            className="button cancel-button"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button type="submit" className="button submit-button save-item-button">
                                    {editando ? 'Salvar Alterações' : 'Salvar Item'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabela de Itens no Inventário */}
                    <InventoryTable 
                        produtos={produtos} 
                        editarProduto={editarProduto} 
                        removerProduto={removerProduto} 
                    />
                </div>
                
            </div>
            
            <footer className="dashboard-footer client-footer">
                <button onClick={onLogout} className="button footer-button logout-mobile">
                    Logout
                </button>
            </footer>
        </div>
    );
}

export default AdminDashboard;
