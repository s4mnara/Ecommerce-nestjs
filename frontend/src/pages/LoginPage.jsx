import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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

      if (usuario.role === "admin") navigate("/dashboard");
      else navigate("/client");
    } catch (error) {
      const raw = error.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(", ")
        : raw || "Erro no login. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img
            src="/assets/logoamarela.png"
            alt="PowerFit"
            className="auth-logo"
          />
          <div className="auth-brand-text">
            <span className="auth-brand-name">PowerFit</span>
            <span className="auth-brand-sub">Suplementos</span>
          </div>
        </div>

        <div className="auth-heading">
          <h1>Entrar</h1>
          <p>Acesse sua conta e continue treinando.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>E-mail</span>
            <input
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            <span>Senha</span>
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/register")}
          >
            Criar conta
          </button>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
