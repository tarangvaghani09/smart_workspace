export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiUrl = (path) => {
  if (!path) return API_BASE;
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
};
