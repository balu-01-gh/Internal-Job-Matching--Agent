/**
 * api.js - Centralised Axios client with JWT injection.
 * All routes use this instance to ensure auth headers are set automatically.
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Inject JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401 (but NOT for the login endpoint itself)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginEndpoint = err.config?.url?.includes('/employee/login')
    if (err.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (emailOrUsername, password, hr_id) =>
    api.post('/login', { email: emailOrUsername, password, hr_id }),
  signup: (data) =>
    api.post('/employee/signup', data),
  me: () =>
    api.get('/employee/me'),
  updateMe: (data) =>
    api.put('/employee/me', data),
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/employee/upload-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  topProjects: () =>
    api.get('/employee/top-projects'),
  updateEmbedding: () =>
    api.post('/employee/update-embedding'),
}

// ── Registration ─────────────────────────────────────────────
export const registerAPI = {
  employee: (data)  => api.post('/register/employee', data),
  teamlead: (data)  => api.post('/register/teamlead', data),
  hr: (data)        => api.post('/register/hr', data),
  teamLookup: (code) => api.get(`/register/team-lookup/${code}`),
}

// ── Teams ────────────────────────────────────────────────────
export const teamAPI = {
  list: () => api.get('/team/'),
  get: (id) => api.get(`/team/${id}`),
  members: (id) => api.get(`/team/${id}/members`),
  heatmap: (id) => api.get(`/team/${id}/heatmap`),
  skillGap: (teamId, employeeId, projectId) =>
    api.get(`/team/${teamId}/skill-gap/${employeeId}?project_id=${projectId}`),
  create: (data) => api.post('/team/', data),
}

// ── Projects ─────────────────────────────────────────────────
export const projectAPI = {
  list: (hr_id) => api.get('/project/', { params: { hr_id } }),
  get: (id) => api.get(`/project/${id}`),
  create: (data) => api.post('/project/', data),
  update: (id, data) => api.put(`/project/${id}`, data),
  delete: (id) => api.delete(`/project/${id}`),
}

// ── HR ───────────────────────────────────────────────────────
export const hrAPI = {
  rankTeams: (projectId) => api.get(`/hr/rank-teams/${projectId}`),
  top5Teams: (projectId) => api.get(`/hr/top-teams/${projectId}`),
  teamDetails: (teamId) => api.get(`/hr/team-details/${teamId}`),
  allTeams: () => api.get('/hr/teams'),
  evaluate: (projectId) => api.post(`/hr/evaluate/${projectId}`),
  applications: (projectId) => api.get(`/hr/applications/${projectId}`),
}
