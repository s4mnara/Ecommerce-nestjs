import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, senha });
      const { access_token, usuario } = response.data;

      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("usuario", JSON.stringify(usuario));

      onLoginSuccess(access_token);
      setLoading(false);

      if (usuario.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/client");
      }
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Erro no login. Tente novamente.";
      setErro(msg);
    }
  };

  return (
    <div className="container">
      <img src="/assets/logoamarela.png" alt="Logo" style={{ marginBottom: "20px", width: "120px" }} />
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {erro && <p style={{ color: "red" }}>{erro}</p>}
      </form>
      <p>
        Não tem conta?{" "}
        <a href="#" onClick={() => navigate("/register")}>
          Criar conta
        </a>
      </p>
    </div>
  );
}

export default LoginPage;

