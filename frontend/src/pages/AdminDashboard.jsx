import React from 'react';

function AdminDashboard({ onLogout }) {
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
      <h1>Admin Dashboard</h1>
      <p>Bem-vindo, Admin!</p>
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

export default AdminDashboard;
