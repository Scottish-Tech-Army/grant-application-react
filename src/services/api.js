// ============================================================
// FundSight — Centralized API Service
// Base URL: /api  (proxied by Vite to http://localhost:3001/api)
// ============================================================

async function parseJson(r) {
  const text = await r.text()
  if (!text) throw new Error('No response from server — make sure the backend is running (cd backend && npm start)')
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Server returned an unexpected response — make sure the backend is running (cd backend && npm start)')
  }
}

function authHeaders() {
  const token = localStorage.getItem('fundsight_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function authGet() {
  const token = localStorage.getItem('fundsight_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ------------------------------------
// Auth
// ------------------------------------

export const login = (username, password) =>
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(parseJson)

export const register = (username, password) =>
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then(parseJson)

export const verifyToken = () =>
  fetch('/api/auth/me', { headers: authGet() }).then(parseJson)

// ------------------------------------
// Field Groups
// ------------------------------------

export const getFieldGroups = () =>
  fetch('/api/field-groups', { headers: authGet() }).then(parseJson)

export const createFieldGroup = (data) =>
  fetch('/api/field-groups', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const updateFieldGroup = (id, data) =>
  fetch(`/api/field-groups/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const deleteFieldGroup = (id) =>
  fetch(`/api/field-groups/${id}`, { method: 'DELETE', headers: authGet() }).then(parseJson)

// ------------------------------------
// Common Fields
// ------------------------------------

export const getCommonFields = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return fetch(`/api/common-fields${q ? '?' + q : ''}`, { headers: authGet() }).then(parseJson)
}

export const getCommonField = (id) =>
  fetch(`/api/common-fields/${id}`, { headers: authGet() }).then(parseJson)

export const createCommonField = (data) =>
  fetch('/api/common-fields', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const updateCommonField = (id, data) =>
  fetch(`/api/common-fields/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const deleteCommonField = (id) =>
  fetch(`/api/common-fields/${id}`, { method: 'DELETE', headers: authGet() }).then(parseJson)

// ------------------------------------
// Applications
// ------------------------------------

export const getApplications = (params = {}) => {
  const q = new URLSearchParams(params).toString()
  return fetch(`/api/applications${q ? '?' + q : ''}`, { headers: authGet() }).then(parseJson)
}

export const getApplication = (id) =>
  fetch(`/api/applications/${id}`, { headers: authGet() }).then(parseJson)

export const createApplication = (data) =>
  fetch('/api/applications', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const updateApplication = (id, data) =>
  fetch(`/api/applications/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).then(parseJson)

export const deleteApplication = (id) =>
  fetch(`/api/applications/${id}`, { method: 'DELETE', headers: authGet() }).then(parseJson)

export const getApplicationExport = (id) =>
  fetch(`/api/applications/${id}/export`, { headers: authGet() }).then(parseJson)
