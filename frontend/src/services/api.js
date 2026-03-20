import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error)
    console.log('Error status:', error.response?.status)
    console.log('Error URL:', error.config?.url)
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - logging out')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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

export const alertsAPI = {
  getAlerts: (params) => api.get('/alerts', { params }),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  generateAlerts: () => api.post('/alerts/generate'),
}

export default api
