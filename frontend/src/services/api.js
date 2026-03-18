import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
}

export const contractsAPI = {
  getContracts: (params) => api.get('/contracts', { params }),
  getContract: (id) => api.get(`/contracts/${id}`),
  createContract: (formData) => api.post('/contracts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateContract: (id, data) => api.put(`/contracts/${id}`, data),
  deleteContract: (id) => api.delete(`/contracts/${id}`),
  getDashboardStats: () => api.get('/contracts/dashboard/stats'),
}

export const alertsAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  generateAlerts: () => api.post('/alerts/generate'),
}

export default api
