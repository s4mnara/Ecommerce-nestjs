import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../index.css';

function AdminDashboard({ onLogout }) {
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
  const [editando, setEditando] = useState(false);
  const [search, setSearch] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
  const token = localStorage.getItem('token');
  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    carregarProdutos();
    carregarClientes();
  }, []);

  const carregarProdutos = async () => {
    try {
      const res = await axiosAuth.get('/produtos');
      setProdutos(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const carregarClientes = async () => {
    try {
      const res = await axiosAuth.get('/clientes');
      setClientes(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nome', form.nome);
    formData.append('descricao', form.descricao);
    formData.append('preco', form.preco);
    formData.append('estoque', form.estoque);
    if(form.imagem) formData.append('imagem', form.imagem);

    try {
      if (editando) {
        await axiosAuth.put(`/produtos/${form.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      } else {
        await axiosAuth.post('/produtos', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
      setEditando(false);
      carregarProdutos();
    } catch (err) { console.error(err); }
  };

  const editarProduto = (p) => {
    setForm({...p, imagem: null}); 
    setEditando(true);
  }
  
  const removerProduto = async (id) => { 
    try {
      await axiosAuth.delete(`/produtos/${id}`); 
      carregarProdutos(); 
    } catch (err) { console.error(err); }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.descricao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h2>Olá Admin</h2>
        <input
          type="text"
          placeholder="Pesquisar clientes ou produtos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={onLogout} className="logout-desktop">Logout</button>
      </header>

      <div className="dashboard-body-container">
        <div className="produtos-section-wrapper">
          <div className="produto-form-panel">
            <h3>{editando ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
            <form onSubmit={handleSubmit} className="produto-form">
              <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
              <input type="text" name="descricao" placeholder="Descrição" value={form.descricao} onChange={handleChange} />
              <input type="number" step="0.01" name="preco" placeholder="Preço" value={form.preco} onChange={handleChange} required />
              <input type="number" name="estoque" placeholder="Estoque" value={form.estoque} onChange={handleChange} required />
              
              <div className="file-input-group">
                <label htmlFor="imagem-upload" className="custom-file-upload-label">
                  {form.imagem ? form.imagem.name : 'Escolher Imagem...'}
                </label>
                <input 
                  id="imagem-upload"
                  type="file" 
                  name="imagem" 
                  onChange={handleChange} 
                  accept="image/*" 
                  className="hidden-file-input"
                />
              </div>
              
              <button type="submit" className="button submit-button">{editando ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
              {editando && <button type="button" onClick={() => { setEditando(false); setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null }); }} className="button cancel-button">Cancelar Edição</button>}
            </form>
          </div>
          
          <div className="produtos-section">
            <h3>Lista/Carrossel de Produtos</h3>
            <div className="produtos-carousel">
              {produtosFiltrados.map(p => (
                <div key={p.id} className="produto-card">
                  {p.imagem && <img src={`${API_URL}/${p.imagem}`} alt={p.nome} />}
                  <h4>{p.nome}</h4>
                  <p className="produto-descricao">{p.descricao}</p>
                  <p className="produto-preco">R$ {parseFloat(p.preco).toFixed(2)}</p>
                  <p className="produto-estoque">Estoque: {p.estoque}</p>
                  <div className="card-actions">
                    <button onClick={() => editarProduto(p)} className="button edit-button">Editar</button>
                    <button onClick={() => removerProduto(p.id)} className="button remove-button">Remover</button>
                  </div>
                </div>
              ))}
              {produtosFiltrados.length === 0 && <p className="no-products-message">Nenhum produto encontrado.</p>}
            </div>
          </div>
        </div>

        <div className="clientes-section">
          <h3>Clientes</h3>
          <div className="clientes-list">
            {clientes.map(c => (
              <div key={c.id} className="cliente-card">
                <p><strong>{c.nome}</strong></p>
                <p>Email: {c.email}</p>
                <p>Pedidos finalizados: {c.pedidos?.length || 0}</p>
                <p>Carrinho: {c.carrinho?.length || 0} itens</p>
              </div>
            ))}
            {clientes.length === 0 && <p>Nenhum cliente cadastrado.</p>}
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <button onClick={onLogout} className="logout-mobile">Logout</button>
      </footer>
    </div>
  );
}

export default AdminDashboard;



