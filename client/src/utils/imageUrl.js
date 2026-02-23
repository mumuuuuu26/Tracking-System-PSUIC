export const getImageUrl = (path) => {
  if (!path) return '/default-profile.svg';
  if (path.startsWith('http')) return path;
  
  // Use env URL when provided, otherwise keep it same-origin via /api.
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  
  // Remove '/api' from the end of apiUrl if present, because uploads are at root level
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};
