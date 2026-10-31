// Backend ke saare API calls yahan hain. Components seedha axios use nahi karte.
import api, { getErrorMessage } from './api';

const body = (promise) => promise.then((response) => response.data);

export const authService = {
  register: (formData) => body(api.post('/auth/register', formData)),
  login: (credentials) => body(api.post('/auth/login', credentials)),
  getProfile: () => body(api.get('/auth/profile')),
  updateProfile: (formData) => body(api.put('/auth/profile', formData)),
};

// Workouts, diet, exercises aur progress ek jaisi CRUD API rakhte hain
const crud = (path) => ({
  list: (params) => body(api.get(path, { params })),
  get: (id) => body(api.get(`${path}/${id}`)),
  create: (data) => body(api.post(path, data)),
  update: (id, data) => body(api.put(`${path}/${id}`, data)),
  remove: (id) => body(api.delete(`${path}/${id}`)),
});

export const workoutService = crud('/workouts');
export const exerciseService = crud('/exercises');
export const progressService = crud('/progress');
export const dietService = {
  ...crud('/diet'),
  summary: (params) => body(api.get('/diet/summary', { params })),
};

export const dashboardService = { get: (params) => body(api.get('/dashboard', { params })) };
export const contactService = { send: (data) => body(api.post('/contact', data)) };

// Report download: file blob ke taur par aati hai, phir browser download trigger karte hain
export const reportService = {
  async download(path, params) {
    try {
      const response = await api.get(path, { params, responseType: 'blob' });
      const disposition = response.headers['content-disposition'] || '';
      const fileName = (disposition.match(/filename="?([^"]+)"?/) || [])[1] || 'fitcloud-report';

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        fileName,
        threadId: response.headers['x-worker-thread-id'],
        workerMs: response.headers['x-worker-time-ms'],
        totalMs: response.headers['x-total-time-ms'],
        rows: response.headers['x-report-rows'],
      };
    } catch (error) {
      // Error blob mein aati hai, usay JSON bana kar message nikalte hain
      if (error.response?.data instanceof Blob) {
        try {
          const parsed = JSON.parse(await error.response.data.text());
          error.response.data = parsed;
        } catch { /* ignore */ }
      }
      throw error;
    }
  },
};

export { getErrorMessage };
