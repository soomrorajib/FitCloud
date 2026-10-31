// Backend API ka base URL sirf yahin se aayega (kahin aur hardcode nahi karna).
// Development: frontend/.env  ->  VITE_API_URL=http://localhost:5000/api
// Production : VITE_API_URL=https://YOUR-AWS-BACKEND/api
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
