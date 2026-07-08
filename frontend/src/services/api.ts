import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', new URLSearchParams({ username, password })),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  getMe: () => api.get('/auth/me'),
}

export const chatApi = {
  send: (message: string, sessionId?: number) =>
    api.post('/chat/send', { message, session_id: sessionId }),
  clarify: (message: string, sessionId: number) =>
    api.post('/chat/clarify', { message, session_id: sessionId }),
  getSessions: () => api.get('/chat/sessions'),
  getMessages: (sessionId: number) => api.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (sessionId: number) => api.delete(`/chat/sessions/${sessionId}`),
}

export const feedbackApi = {
  create: (data: any) => api.post('/feedback', data),
  getStats: () => api.get('/feedback/stats'),
}

export const dataApi = {
  getQuotes: (params?: any) => api.get('/data/quotes', { params }),
  getCurrencies: (params?: any) => api.get('/data/currencies', { params }),
  getSummary: () => api.get('/data/summary'),
}

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
  testDB: (data: any) => api.post('/settings/test-db', data),
  testLiteLLM: (data: any) => api.post('/settings/test-litellm', data),
  testLLM: () => api.post('/settings/test-llm'),
}

export default api
