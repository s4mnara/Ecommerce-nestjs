import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const API_URL = process.env.REACT_APP_API_URL + '/auth/login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_URL, { email, senha });
      // 🔹 Salva token e usuário no localStorage
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));

      // 🔹 Se for admin, chama callback onLogin
      if (res.data.usuario.role === 'admin') {
        onLogin();
      } else {
        setErro('Acesso negado: apenas administradores podem entrar.');
      }
    } catch (err) {
      setErro('Credenciais inválidas');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        /><br />
        <button type="submit">Entrar</button>
      </form>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  );
}

export default Login;
