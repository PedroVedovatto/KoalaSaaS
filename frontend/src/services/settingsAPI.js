import api from './api'

export const settingsAPI = {
  // Contract Types
  getContractTypes: () => api.get('/settings/contract-types'),
  getContractType: (id) => api.get(`/settings/contract-types/${id}`),
  createContractType: (data) => api.post('/settings/contract-types', data),
  updateContractType: (id, data) => api.put(`/settings/contract-types/${id}`, data),
  deleteContractType: (id) => api.delete(`/settings/contract-types/${id}`),

  // Contract Statuses
  getContractStatuses: () => api.get('/settings/contract-statuses'),
  getContractStatus: (id) => api.get(`/settings/contract-statuses/${id}`),
  createContractStatus: (data) => api.post('/settings/contract-statuses', data),
  updateContractStatus: (id, data) => api.put(`/settings/contract-statuses/${id}`, data),
  deleteContractStatus: (id) => api.delete(`/settings/contract-statuses/${id}`)
}
