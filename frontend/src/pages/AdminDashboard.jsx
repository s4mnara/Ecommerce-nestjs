import React, { useEffect, useState } from 'react';
import api from '../api'; // ✅ usa o api.js corretamente

function AdminDashboard({ onLogout }) {
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    id: null,
    nome: '',
    descricao: '',
    preco: '',
    estoque: ''
  });
  const [editando, setEditando] = useState(false);

  // ✅ Carrega produtos ao iniciar
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const res = await api.get('/produtos'); // ✅ usa caminho relativo
      setProdutos(res.data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      preco: parseFloat(form.preco),
      estoque: parseInt(form.estoque)
    };

    try {
      if (editando) {
        await api.put(`/produtos/${form.id}`, payload); // ✅ caminho relativo
      } else {
        await api.post('/produtos', payload); // ✅ caminho relativo
      }
      setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '' });
      setEditando(false);
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao salvar produto:', err);
    }
  };

  const editarProduto = (produto) => {
    setForm(produto);
    setEditando(true);
  };

  const removerProduto = async (id) => {
    try {
      await api.delete(`/produtos/${id}`); // ✅ caminho relativo
      carregarProdutos();
    } catch (err) {
      console.error('Erro ao remover produto:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', textAlign: 'center' }}>
      <h1>Admin Dashboard</h1>
      <p>Bem-vindo, Admin!</p>

      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
        <input type="text" name="descricao" placeholder="Descrição" value={form.descricao} onChange={handleChange} />
        <input type="number" step="0.01" name="preco" placeholder="Preço" value={form.preco} onChange={handleChange} required />
        <input type="number" name="estoque" placeholder="Estoque" value={form.estoque} onChange={handleChange} required />
        <button type="submit" style={{ marginLeft: '10px' }}>
          {editando ? 'Salvar Alterações' : 'Adicionar Produto'}
        </button>
      </form>

      <table border="1" width="100%" style={{ marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>ID</th><th>Nome</th><th>Descrição</th><th>Preço</th><th>Estoque</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nome}</td>
              <td>{p.descricao}</td>
              <td>{p.preco}</td>
              <td>{p.estoque}</td>
              <td>
                <button onClick={() => editarProduto(p)}>Editar</button>
                <button onClick={() => removerProduto(p.id)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={onLogout}
        style={{
          marginTop: '20px',
          background: 'black',
          color: 'yellow',
          padding: '10px 20px',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default AdminDashboard;
