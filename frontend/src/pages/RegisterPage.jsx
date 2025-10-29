import React, { useState } from 'react';
import api from '../api';

function RegisterPage({ onRegistrationSuccess, onGoToLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      // Endpoint que você deve ter criado no seu AuthController
      const response = await api.post('/auth/register', { nome, email, senha, telegramChatId });
      
      setLoading(false);
      // Chama a função para mudar a visualização de volta para o Login
      onRegistrationSuccess(); 
      alert(`Usuário ${response.data.email} registrado com sucesso! Faça login.`);

    } catch (error) {
      setLoading(false);
      // Se a API retornar erro (ex: 400 Bad Request, email já existe)
      const msg = error.response?.data?.message || 'Erro no registro. Tente novamente.';
      setErro(msg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Cadastro de Novo Usuário</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome:</label>
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Senha:</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <div>
          <label>Telegram Chat ID (Opcional):</label>
          <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} />
        </div>
        
        <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        {erro && <p style={{ color: 'red', marginTop: '10px' }}>{erro}</p>}
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Já tem conta? <button onClick={onGoToLogin} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}>Fazer Login</button>
      </p>
    </div>
  );
}

export default RegisterPage;