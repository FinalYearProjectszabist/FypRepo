import api from './client';

export const authApi = {
  signup: (body) => api.post('/auth/signup', body).then((r) => r.data),
  verifyEmail: (body) => api.post('/auth/verify-email', body).then((r) => r.data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  loginMfa: (body) => api.post('/auth/login/mfa', body).then((r) => r.data),
  resendMfa: (mfaToken) => api.post('/auth/login/mfa/resend', { mfaToken }).then((r) => r.data),
  google: (body) => api.post('/auth/google', body).then((r) => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (body) => api.post('/auth/reset-password', body).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const profileApi = {
  get: () => api.get('/profile').then((r) => r.data),
  update: (body) => api.put('/profile', body).then((r) => r.data),
  changePassword: (body) => api.put('/profile/password', body).then((r) => r.data),
  mfaSendCode: () => api.post('/profile/mfa/send-code').then((r) => r.data),
  mfaEnable: (code) => api.post('/profile/mfa/enable', { code }).then((r) => r.data),
  mfaDisable: (code) => api.post('/profile/mfa/disable', { code }).then((r) => r.data),
};

export const vehicleApi = {
  list: () => api.get('/vehicles').then((r) => r.data),
  create: (body) => api.post('/vehicles', body).then((r) => r.data),
  update: (id, body) => api.put(`/vehicles/${id}`, body).then((r) => r.data),
  remove: (id) => api.delete(`/vehicles/${id}`),
};

export const adminApi = {
  users: () => api.get('/admin/users').then((r) => r.data),
  setEnabled: (id, value) => api.patch(`/admin/users/${id}/enabled`, null, { params: { value } }).then((r) => r.data),
};
