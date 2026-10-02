import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/cliente/register", {
        nome,
        email,
        senha,
      });
      const msg =
        response.data?.message ||
        `Conta criada para ${response.data?.email || email}. Verifique seu email.`;
      toast.success(msg);
      navigate("/login");
    } catch (error) {
      const raw = error.response?.data?.message;
      const msg = Array.isArray(raw)
        ? raw.join(", ")
        : raw || "Erro no registro. Tente novamente.";
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
          <h1>Criar conta</h1>
          <p>Comece sua jornada fitness com a gente.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Nome</span>
            <input
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoComplete="name"
            />
          </label>

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
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/login")}
          >
            Fazer login
          </button>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
