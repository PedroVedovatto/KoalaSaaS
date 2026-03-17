import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

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

export default api
