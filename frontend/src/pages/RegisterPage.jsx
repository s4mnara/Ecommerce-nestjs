import React, { useState } from "react";
import api from "../api";

function RegisterPage({ onRegistrationSuccess, onGoToLogin }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/cliente/register", {
        nome,
        email,
        senha,
      });
      alert(`Usuário ${response.data.email} registrado com sucesso!`);
      setLoading(false);
      onRegistrationSuccess();
    } catch (error) {
      setLoading(false);
      const msg =
        error.response?.data?.message || "Erro no registro. Tente novamente.";
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
      <h1>Criar Conta</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

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
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        {erro && <p style={{ color: "red", marginTop: "10px" }}>{erro}</p>}
      </form>

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Já tem conta?{" "}
        <a href="#" onClick={onGoToLogin}>
          Fazer login
        </a>
      </p>
    </div>
  );
}

export default RegisterPage;

