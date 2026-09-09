const API_URL = import.meta.env.VITE_API_URL || 'https://tts-app-ccpr.onrender.com';
export const api = {
  auth: {
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`,
    me: `${API_URL}/api/auth/me`,
  },
  tts: {
    convert: `${API_URL}/api/tts/convert`,
  },
  dashboard: {
    history: `${API_URL}/api/dashboard/history`,
    stats: `${API_URL}/api/dashboard/stats`,
  },
};
