// src/api/authApi.js
// Central API service for all auth-related calls

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.100:8000/api/auth'; // Update with your server IP

const api = axios.create({ baseURL: BASE_URL });

// ── Attach JWT token to every request ──────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto refresh on 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const refresh = await AsyncStorage.getItem('refresh_token');
        const res = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });
        await AsyncStorage.setItem('access_token', res.data.access);
        error.config.headers.Authorization = `Bearer ${res.data.access}`;
        return api(error.config);
      } catch {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth Calls ──────────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await api.post('/login/', { email, password });
  await AsyncStorage.setItem('access_token',  res.data.access);
  await AsyncStorage.setItem('refresh_token', res.data.refresh);
  await AsyncStorage.setItem('user', JSON.stringify({
    email:   res.data.email,
    role:    res.data.role,
    status:  res.data.status,
    user_id: res.data.user_id,
  }));
  return res.data;
};

export const signupDonor = async (formData) => {
  const res = await api.post('/signup/donor/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const signupNGO = async (formData) => {
  const res = await api.post('/signup/ngo/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const signupDelivery = async (formData) => {
  const res = await api.post('/signup/delivery/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const checkMyStatus = async () => {
  const res = await api.get('/me/status/');
  return res.data;
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
};

export const getStoredUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ── Admin Calls ─────────────────────────────────────────────────

export const adminGetUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`/admin/users/${params ? '?' + params : ''}`);
  return res.data;
};

export const adminGetUserDetail = async (userId) => {
  const res = await api.get(`/admin/users/${userId}/`);
  return res.data;
};

export const adminUpdateUserStatus = async (userId, status) => {
  const res = await api.patch(`/admin/users/${userId}/action/`, { status });
  return res.data;
};

export const adminGetStats = async () => {
  const res = await api.get('/admin/stats/');
  return res.data;
};

export default api;