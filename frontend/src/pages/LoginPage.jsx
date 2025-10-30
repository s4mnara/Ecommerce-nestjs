import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function LoginPage({ onLoginSuccess, onGoToRegister }) {
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
      const { access_token } = response.data;

      onLoginSuccess(access_token);
      setLoading(false);

      // Redireciona para dashboard
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Erro no login. Tente novamente.";
      setErro(msg);
    }
  };

  return (
    <div className="container">
      <img
        src="/assets/logoamarela.png"
        alt="Logo PowerFit"
        style={{ display: "block", margin: "0 auto 20px auto", width: "120px" }}
      />
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
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
        {erro && <p style={{ color: "red", marginTop: "10px" }}>{erro}</p>}
      </form>
      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Não tem conta?{" "}
        <a href="#" onClick={onGoToRegister}>
          Criar conta
        </a>
      </p>
    </div>
  );
}

export default LoginPage;
