import React from 'react';

function ClientDashboard({ onLogout }) {
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
      <h1>Client Dashboard</h1>
      <p>Bem-vindo, Cliente!</p>
      <button
        onClick={onLogout}
        style={{
          marginTop: '20px',
          background: 'black',
          color: 'yellow',
          padding: '10px 20px',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '5px'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ClientDashboard;
