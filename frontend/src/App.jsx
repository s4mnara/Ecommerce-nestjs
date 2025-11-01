import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { getUserRole } from "./utils/auth";

function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userRole, setUserRole] = useState(token ? getUserRole(token) : null);

  const handleLogin = (newToken) => {
    localStorage.setItem("accessToken", newToken);
    const role = getUserRole(newToken);
    setUserRole(role);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("usuario");
    setToken(null);
    setUserRole(null);
  };

  return (
    <Router>
      <div style={{ textAlign: "center", padding: "20px", backgroundColor: "#ffeb3b", minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLogin} />}
          />
          <Route
            path="/register"
            element={<RegisterPage onRegistrationSuccess={() => <Navigate to="/login" />} />}
          />
          <Route
            path="/dashboard"
            element={
              token && userRole === "admin" ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/client"
            element={
              token && userRole === "cliente" ? (
                <ClientDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;




