import api from './api'

export const usersAPI = {
  // Get all users for current company
  getUsers: async () => {
    const response = await api.get('/users')
    return response.data
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Toggle user active status
  toggleUserStatus: async (id) => {
    const response = await api.patch(`/users/${id}/toggle-status`)
    return response.data
  },

  // Change user password
  changePassword: async (id, passwordData) => {
    const response = await api.patch(`/users/${id}/change-password`, passwordData)
    return response.data
  }
}
