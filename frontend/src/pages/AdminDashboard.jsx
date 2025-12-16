import React, { useEffect, useState } from 'react';
import api from '../api';
import "../index.css";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_IMAGE_URL = 'http://localhost:8080/uploads/';

/* ====================== COMPONENTES (sem alterações) ====================== */
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
                  style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px" }}
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

/* ====================== PAINEL DE LOGS (sem alterações) ====================== */
const LogsPanel = ({ logs }) => {
  const [usuarioFiltro, setUsuarioFiltro] = useState('');
  const [metodoFiltro, setMetodoFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const metodoCor = { GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", DELETE: "#F44336" };

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
      <h3>Logs de Acesso</h3>
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
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "10px", marginBottom: "8px", borderRadius: "8px", borderLeft: `5px solid ${metodoCor[log.metodo] || "#999"}` }}>
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

/* ====================== ADMIN DASHBOARD ====================== */
function AdminDashboard({ onLogout }) {
  const [produtos, setProdutos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
  const [editando, setEditando] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const adminName = "Admin";

  useEffect(() => {
    if (activeMenu === 'Dashboard') carregarProdutos();
    if (activeMenu === 'Usuários') carregarUsuarios();
    if (activeMenu === 'Logs') {
      carregarLogs();
      const interval = setInterval(carregarLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeMenu]);

  const carregarProdutos = async () => {
    try {
      const res = await api.get('/produtos');
      setProdutos(res.data);
    } catch (err) {
      toast.error('Erro ao carregar produtos');
      console.error(err);
    }
  };

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      toast.error('Erro ao carregar usuários');
      console.error(err);
    }
  };

  const carregarLogs = async () => {
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      toast.error('Erro ao carregar logs');
      console.error(err);
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
      let res;
      if (editando) {
        res = await api.put(`/produtos/${form.id}`, formData);
        setProdutos(prev => prev.map(p => p.id === form.id ? { ...p, ...res.data } : p));
        toast.success('Produto atualizado com sucesso!');
      } else {
        res = await api.post('/produtos', formData);
        setProdutos(prev => [...prev, res.data]);
        toast.success('Produto adicionado com sucesso!');
      }
      setForm({ id: null, nome: '', descricao: '', preco: '', estoque: '', imagem: null });
      setEditando(false);
    } catch (err) {
      toast.error('Erro ao salvar produto');
      console.error(err);
    }
  };

  const editarProduto = (produto) => {
    setForm({ ...produto, imagem: null, preco: String(produto.preco), estoque: String(produto.estoque) });
    setEditando(true);
  };

  const removerProduto = async (id) => {
    if (!window.confirm("Tem certeza que deseja remover este item?")) return;
    try {
      await api.delete(`/produtos/${id}`);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover produto');
      console.error(err);
    }
  };

  const removerUsuario = async (id) => {
    if (!window.confirm("Remover este usuário permanentemente?")) return;
    try {
      await api.delete(`/usuarios/${id}`);
      setUsuarios(prev => prev.filter(u => u.id !== id));
      toast.success('Usuário removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover usuário');
      console.error(err);
    }
  };

  const Sidebar = () => (
    <nav className="sidebar">
      <a href="#" className={activeMenu === 'Dashboard' ? 'active' : ''} onClick={() => setActiveMenu('Dashboard')}><i className="fas fa-box"></i> Produtos</a>
      <a href="#" className={activeMenu === 'Usuários' ? 'active' : ''} onClick={() => setActiveMenu('Usuários')}><i className="fas fa-users"></i> Usuários</a>
      <a href="#" className={activeMenu === 'Logs' ? 'active' : ''} onClick={() => setActiveMenu('Logs')}><i className="fas fa-history"></i> Logs de Acesso</a>
      <a href="#" onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Sair</a>
    </nav>
  );

  let fileName = '';
  if (form.imagem) fileName = form.imagem.name;
  else if (editando && produtos.find(p => p.id === form.id)?.imagem) fileName = 'Arquivo atual: ' + produtos.find(p => p.id === form.id).imagem;
  else fileName = 'Nenhum arquivo selecionado';

  return (
    <div className="admin-dashboard">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
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
        <div className="produtos-section-wrapper main-content-full"
         >
          {activeMenu === 'Dashboard' && (
            <>
              <div className="produto-form-panel"
              >
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

