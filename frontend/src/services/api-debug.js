import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('Token:', token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  console.log('Request config:', config)
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log('Response:', response)
    return response
  },
  (error) => {
    console.error('Response error:', error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const contractsAPI = {
  getDashboardStats: () => api.get('/contracts/dashboard/stats'),
  getContracts: (params) => api.get('/contracts', { params }),
}

export default api
