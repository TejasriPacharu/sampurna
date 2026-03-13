// src/api/authApi.js
// Central API service for all auth-related calls

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.122:8000/api/auth'; 

const api = axios.create({ baseURL: BASE_URL, timeout: 8000 });

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

// =================================================================
// ── NEW: Shared axios factory (reuses JWT interceptor) ───────────
// =================================================================

function makeApi(baseURL) {
  const instance = axios.create({ baseURL, timeout: 8000 });
  instance.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          const refresh = await AsyncStorage.getItem('refresh_token');
          const res = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });
          await AsyncStorage.setItem('access_token', res.data.access);
          error.config.headers.Authorization = `Bearer ${res.data.access}`;
          return instance(error.config);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
}

// ── NEW: Food Listing API (/api/food) ────────────────────────────

const foodApi = makeApi('http://192.168.0.122:8000/api/food');

/**
 * Donor — create a new food listing.
 * FormData fields: food_type, quantity, unit, prepared_time, expiry_time,
 *                  location, pickup_available (bool string), notes, photo (optional file)
 */
export const createFoodListing = async (formData) => {
  const res = await foodApi.post('/listings/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

/** Donor — fetch own listings. Optional params: { status } */
export const getDonorListings = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await foodApi.get(`/listings/mine/${q ? '?' + q : ''}`);
  return res.data;
};

/** Donor — update a listing (PATCH, JSON body) */
export const updateFoodListing = async (listingId, payload) => {
  const res = await foodApi.patch(`/listings/${listingId}/`, payload);
  return res.data;
};

/** Donor — cancel/delete a listing (only when status === 'active') */
export const deleteFoodListing = async (listingId) => {
  const res = await foodApi.delete(`/listings/${listingId}/`);
  return res.data;
};

/** NGO — browse all active listings. Optional params: { pickup_available, food_type, page } */
export const getAvailableListings = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await foodApi.get(`/listings/available/${q ? '?' + q : ''}`);
  return res.data;
};

/** Admin — get ALL listings across all statuses (admin only endpoint). */
export const getAdminAllListings = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await foodApi.get(`/listings/admin-all/${q ? '?' + q : ''}`);
  return res.data;
};

/** NGO — claim a listing. Backend sets status → 'claimed', records claimed_by. */
export const claimListing = async (listingId) => {
  const res = await foodApi.post(`/listings/${listingId}/claim/`);
  return res.data;
};

/** NGO — fetch own claimed listings. Optional params: { status } */
export const getNGOClaims = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await foodApi.get(`/listings/my-claims/${q ? '?' + q : ''}`);
  return res.data;
};

/** NGO — confirm food received from delivery. Backend sets status → 'delivered'. */
export const confirmDeliveryReceived = async (listingId) => {
  const res = await foodApi.post(`/listings/${listingId}/confirm-received/`);
  return res.data;
};

/** Delivery — fetch listings with status='claimed' and no delivery_guy yet. */
export const getAvailablePickups = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await foodApi.get(`/listings/pickups/${q ? '?' + q : ''}`);
  return res.data;
};

/** Delivery — accept a pickup; backend assigns delivery_guy to the listing. */
export const acceptPickup = async (listingId) => {
  const res = await foodApi.post(`/listings/${listingId}/accept-pickup/`);
  return res.data;
};

/** Delivery — confirm food picked up from donor. Backend sets status → 'picked_up'. */
export const confirmPickedUp = async (listingId) => {
  const res = await foodApi.post(`/listings/${listingId}/picked-up/`);
  return res.data;
};

/** Delivery — confirm food delivered to NGO. Backend sets status → 'delivered'. */
export const confirmDelivered = async (listingId) => {
  const res = await foodApi.post(`/listings/${listingId}/delivered/`);
  return res.data;
};

/** Delivery — fetch own active (in-progress) deliveries. */
export const getMyActiveDeliveries = async () => {
  const res = await foodApi.get('/listings/my-deliveries/?status=active');
  return res.data;
};

/** Delivery — fetch completed delivery history. */
export const getMyDeliveryHistory = async () => {
  const res = await foodApi.get('/listings/my-deliveries/?status=delivered');
  return res.data;
};

// ── NEW: Rating / Review API (/api/ratings) ──────────────────────

const ratingApi = makeApi('http://192.168.0.122:8000/api/ratings');

/**
 * Submit a star rating after a completed delivery.
 * payload: { rated_user_id, listing_id, rating (1-5), comment }
 */
export const submitRating = async (payload) => {
  // Try /submit/ first; if that fails try root path
  try {
    const res = await ratingApi.post('/submit/', payload);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const res = await ratingApi.post('/', payload);
      return res.data;
    }
    throw err;
  }
};

/** Get all ratings received by a specific user (by user_id). */
export const getUserRatings = async (userId) => {
  const res = await ratingApi.get(`/?rated_user=${userId}`);
  return res.data;
};

/** Get ratings received by the currently logged-in user. */
export const getMyRatings = async () => {
  const res = await ratingApi.get('/mine/');
  return res.data;
};

// ── NEW: Leaderboard API (/api/leaderboard) ──────────────────────

const lbApi = makeApi('http://192.168.0.122:8000/api/leaderboard');

/** Donor leaderboard — ranked by total meals shared. */
export const getDonorLeaderboard = async () => {
  const res = await lbApi.get('/donors/');
  return res.data;
};

/** Delivery leaderboard — ranked by completed deliveries. */
export const getDeliveryLeaderboard = async () => {
  const res = await lbApi.get('/delivery/');
  return res.data;
};

// ── NEW: Profile API (/api/auth/me) ──────────────────────────────

/** Fetch full profile of the logged-in user. */
export const getMyProfile = async () => {
  const res = await api.get('/me/');
  return res.data;
};

/** PATCH profile fields: name, phone, location, etc. */
export const updateMyProfile = async (payload) => {
  const res = await api.patch('/me/', payload);
  return res.data;
};

// ── NEW: Notification API (/api/auth/notifications) ──────────────

/** Get unread notification badge count. Returns { count: N } */
export const getNotificationCount = async () => {
  const res = await api.get('/notifications/count/');
  return res.data;
};

/** Get paginated notifications list. */
export const getNotifications = async (page = 1) => {
  const res = await api.get(`/notifications/?page=${page}`);
  return res.data;
};

/** Mark all notifications as read. */
export const markNotificationsRead = async () => {
  const res = await api.post('/notifications/mark-read/');
  return res.data;
};

export { foodApi, ratingApi, lbApi };
export default api;