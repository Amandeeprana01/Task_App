import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export const taskApi = {
  getAll: (params = {}) => api.get('/tasks/', { params }).then(r => r.data),
  create: (data) => api.post('/tasks/', data).then(r => r.data),
  update: (id, data) => api.patch(`/tasks/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
  toggleComplete: (id, completed) => api.patch(`/tasks/${id}`, { completed }).then(r => r.data),
}

export default api
