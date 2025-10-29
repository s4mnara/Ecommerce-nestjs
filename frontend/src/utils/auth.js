// src/utils/auth.js

import { jwtDecode } from 'jwt-decode'; 

export const getUserRole = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    // Retorna a role ('admin' ou 'user') que está no payload
    return decoded.role; 
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return null;
  }
};

export const handleLogout = () => {
  localStorage.removeItem('accessToken');
  window.location.reload();
};