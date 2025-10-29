export const getUserRole = (token) => {
  if (!token) {
    token = localStorage.getItem('accessToken');
  }

  if (!token) return null;

  try {
    const parts = token.split('.');
    const payload = parts[1];
    
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64 + '==='.slice((base64.length + 3) % 4));

    const payloadObject = JSON.parse(decoded);
    
    return payloadObject.role;

  } catch (e) {
    return null;
  }
};