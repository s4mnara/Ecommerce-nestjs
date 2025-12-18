import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-toastify"; // import do toast
import 'react-toastify/dist/ReactToastify.css';

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
      const response = await api.post("/auth/cliente/register", { nome, email, senha });
      toast.success(`Usuário ${response.data.email} registrado com sucesso!`);
      setLoading(false);
      navigate("/login");
    } catch (error) {
      setLoading(false);
      const msg = error.response?.data?.message || "Erro no registro. Tente novamente.";
      toast.error(msg); // exibe mensagem de erro com toast
    }
  };

  return (
    <div className="container">
      <div className="login-header-group">
        <img src="/assets/logoamarela.png" alt="Logo" style={{ width: "120px" }} />
        <h2 className="store-name">PowerFit Suplementos</h2>
      </div>

      <div className="form-header">
        <h1>Criar Conta</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit(e);
        }}
      >
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
      </form>

      <p style={{ textAlign: "center", marginTop: "15px" }}>
        Já tem conta?{" "}
        <button type="button" className="link-button" onClick={() => navigate("/login")}>
  Fazer login
</button>

      </p>
    </div>
  );
}

export default RegisterPage;


