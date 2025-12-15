import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify"; // import do toast
import 'react-toastify/dist/ReactToastify.css';

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, senha });
      const { access_token, usuario } = response.data;

      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      onLoginSuccess(access_token);
      toast.success(`Bem-vindo(a), ${usuario.nome.split(" ")[0]}!`);
      setLoading(false);

      if (usuario.role === "admin") navigate("/dashboard");
      else navigate("/client");
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Erro no login. Tente novamente.";
      toast.error(msg); // exibe erro com toast
    }
  };

  return (
    <div className="container">
      <div className="login-header-group">
        <img src="/assets/logoamarela.png" alt="Logo" style={{ width: "120px" }} />
        <h2 className="store-name">PowerFit Suplementos</h2>
      </div>

      <div className="form-header">
        <h1>Login</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit(e);
        }}
      >
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Não tem conta?{" "}
        <a href="#" onClick={() => navigate("/register")}>
          Criar conta
        </a>
      </p>
    </div>
  );
}

export default LoginPage;

