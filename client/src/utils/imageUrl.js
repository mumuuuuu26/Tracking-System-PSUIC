export const getImageUrl = (path) => {
  if (!path) return '/default-profile.png';
  if (path.startsWith('http')) return path;
  
  // Get API URL from env
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
  
  // Remove '/api' from the end of apiUrl if present, because uploads are at root level
  const baseUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};
