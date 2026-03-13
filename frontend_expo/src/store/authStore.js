// src/store/authStore.js
// isNetworkError — true for timeout/offline, false for server errors (4xx/5xx)
function isNetworkError(err) {
  return !err.response && (
    err.code === 'ECONNABORTED' ||      // axios timeout
    err.code === 'ERR_NETWORK' ||       // offline / no route
    err.code === 'ERR_CONNECTION_TIMED_OUT' ||
    err.message?.includes('timeout') ||
    err.message?.includes('Network Error')
  );
}
// Zustand store for global auth state

import { create } from 'zustand';
import { login, logout, getStoredUser, checkMyStatus } from '../api/authApi';

// ── NEW: additional API imports ──────────────────────────────────
import {
  createFoodListing, getDonorListings, updateFoodListing, deleteFoodListing,
  getAvailableListings, claimListing, getNGOClaims, confirmDeliveryReceived,
  getAvailablePickups, acceptPickup, confirmPickedUp, confirmDelivered,
  getMyActiveDeliveries, getMyDeliveryHistory,
  submitRating, getMyRatings,
  getDonorLeaderboard, getDeliveryLeaderboard,
  getMyProfile, updateMyProfile,
  getNotificationCount, getNotifications, markNotificationsRead,
} from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user:      null,
  isLoading: true,
  error:     null,

  // ── Bootstrap: load persisted user on app start ──────────────
  loadUser: async () => {
    try {
      const user = await getStoredUser();
      if (user) {
        // Re-fetch live status in case admin changed it
        try {
          const fresh = await checkMyStatus();
          set({ user: { ...user, status: fresh.status }, isLoading: false });
        } catch {
          set({ user, isLoading: false });
        }
        // Refresh full profile in background — gets latest address/phone from backend
        try {
          const profile = await getMyProfile();
          set((s) => ({
            user: s.user ? {
              ...s.user,
              name:               profile.name               || profile.org_name || profile.ngo_name || profile.full_name || s.user.email,
              phone:              profile.phone              || s.user.phone     || '',
              location:           profile.location           || profile.address  || s.user.location  || '',
              address:            profile.address            || profile.location || s.user.address   || '',
              org_name:           profile.org_name           || '',
              ngo_name:           profile.ngo_name           || '',
              full_name:          profile.full_name          || '',
              responsible_person: profile.responsible_person || '',
              volunteer_name:     profile.volunteer_name     || '',
            } : s.user
          }));
        } catch {}
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────
  login: async (email, password) => {
    set({ error: null });
    try {
      const data = await login(email, password);
      // Store basic user first so screens can load
      const basicUser = { email: data.email, role: data.role, status: data.status, user_id: data.user_id };
      set({ user: basicUser });

      // Immediately fetch full profile (name, phone, location/address)
      // so food listings show real addresses instead of seed data
      try {
        const profile = await getMyProfile();
        set({ user: {
          ...basicUser,
          name:               profile.name               || profile.org_name || profile.ngo_name || profile.full_name || email,
          phone:              profile.phone              || '',
          location:           profile.location           || profile.address  || '',
          address:            profile.address            || profile.location || '',
          org_name:           profile.org_name           || '',
          ngo_name:           profile.ngo_name           || '',
          full_name:          profile.full_name          || '',
          responsible_person: profile.responsible_person || '',
          volunteer_name:     profile.volunteer_name     || '',
          ngo_type:           profile.ngo_type           || '',
          vehicle_type:       profile.vehicle_type       || '',
        }});
      } catch {
        // Profile fetch failed — basic user is enough to continue
      }

      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      set({ error: msg });
      throw err;
    }
  },

  // ── Logout ─────────────────────────────────────────────────
  logout: async () => {
    await logout();
    set({ user: null, error: null });
  },

  // ── Refresh status (for waiting screen polling) ────────────
  refreshStatus: async () => {
    try {
      const fresh = await checkMyStatus();
      set((state) => ({
        user: state.user ? { ...state.user, status: fresh.status } : null
      }));
      return fresh.status;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),

  // =============================================================
  // ── NEW: Food Listings ────────────────────────────────────────
  // =============================================================

  listings:          [],   // always the master list - all roles read from here
  availableListings: [],
  availablePickups:  [],
  activeDeliveries:  [],
  deliveryHistory:   [],
  listingsLoading:   false,
  listingsError:     null,

  // ── Local-only helper: patch any listing by id (fallback for API failures) ──
  patchListing: (id, patch) => {
    set((s) => {
      const update = (arr) => arr.map(l => l.id === id ? { ...l, ...patch } : l);
      return {
        listings:          update(s.listings),
        availableListings: update(s.availableListings),
        availablePickups:  update(s.availablePickups),
        activeDeliveries:  update(s.activeDeliveries),
        deliveryHistory:   update(s.deliveryHistory),
      };
    });
  },

  // ── Seed listings into store (called on app start for dev/preview) ──
  seedListings: (seeds) => {
    set((s) => ({
      listings: s.listings.length === 0 ? seeds : s.listings,
      availableListings: s.availableListings.length === 0
        ? seeds.filter(l => l.status === 'active')
        : s.availableListings,
    }));
  },

  // Donor: load own listings
  fetchDonorListings: async (params = {}) => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getDonorListings(params);
      set({ listings: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 = endpoint not yet on backend, fall back to local seed data
      const { INITIAL_LISTINGS } = require('../data/seedData');
      const { user } = get();
      const mySeeds = INITIAL_LISTINGS.filter(l => l.donorEmail === user?.email);
      if (get().listings.length === 0) set({ listings: mySeeds });
      set({ listingsLoading: false });
    }
  },

  // Donor: create listing — tries API, falls back to local store
  addListing: async (formDataOrObj) => {
    set({ listingsError: null });
    try {
      const listing = await createFoodListing(formDataOrObj);
      set((s) => ({
        listings: [listing, ...s.listings],
      }));
      return listing;
    } catch (err) {
      // If API not available, the caller already passed a local obj — just add it
      if (formDataOrObj && typeof formDataOrObj === 'object' && !(formDataOrObj instanceof FormData)) {
        set((s) => ({ listings: [formDataOrObj, ...s.listings] }));
        return formDataOrObj;
      }
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Failed to create listing.';
      set({ listingsError: msg });
      throw err;
    }
  },

  // Donor: edit a listing
  editListing: async (listingId, payload) => {
    set({ listingsError: null });
    try {
      const updated = await updateFoodListing(listingId, payload);
      set((s) => ({ listings: s.listings.map((l) => (l.id === listingId ? updated : l)) }));
      return updated;
    } catch (err) {
      set({ listingsError: err.response?.data?.detail || 'Failed to update listing.' });
      throw err;
    }
  },

  // Donor: delete/cancel a listing
  removeListing: async (listingId) => {
    set({ listingsError: null });
    try {
      await deleteFoodListing(listingId);
      set((s) => ({ listings: s.listings.filter((l) => l.id !== listingId) }));
    } catch (err) {
      set({ listingsError: err.response?.data?.detail || 'Failed to remove listing.' });
      throw err;
    }
  },

  // NGO: browse available listings
  fetchAvailableListings: async (params = {}) => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getAvailableListings(params);
      set({ availableListings: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 fallback: show all active listings from local store or seed
      const { INITIAL_LISTINGS } = require('../data/seedData');
      const localActive = get().listings.filter(l => l.status === 'active');
      const fallback = localActive.length ? localActive : INITIAL_LISTINGS.filter(l => l.status === 'active');
      if (get().availableListings.length === 0) set({ availableListings: fallback });
      set({ listingsLoading: false });
    }
  },

  // NGO: claim a listing
  claimFood: async (listingId) => {
    set({ listingsError: null });
    const { user } = get();
    try {
      const updated = await claimListing(listingId);
      // Move from availableListings → listings, update master listings
      set((s) => ({
        availableListings: s.availableListings.filter((l) => l.id !== listingId),
        listings: s.listings.find(l => l.id === listingId)
          ? s.listings.map(l => l.id === listingId ? updated : l)
          : [updated, ...s.listings],
      }));
      return updated;
    } catch (err) {
      // 404: apply locally using live user profile (set during login from /api/auth/me/)
      const patch = {
        status:           'claimed',
        claimedBy:        user?.email,
        claimedByName:    user?.ngo_name  || user?.name  || user?.email,
        claimed_by:       user?.email,
        claimed_by_name:  user?.ngo_name  || user?.name  || user?.email,
        // Use the address collected at NGO signup (stored in user.location / user.address)
        ngoLocation:      user?.location  || user?.address || 'NGO Address',
        ngo_location:     user?.location  || user?.address || 'NGO Address',
        ngoPhone:         user?.phone     || '',
        ngo_phone:        user?.phone     || '',
      };
      set((s) => ({
        availableListings: s.availableListings.filter((l) => l.id !== listingId),
        listings: s.listings.map(l => l.id === listingId ? { ...l, ...patch } : l),
      }));
    }
  },

  // NGO: load claimed listings
  fetchNGOClaims: async (params = {}) => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getNGOClaims(params);
      set({ listings: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 fallback: show listings claimed by this user from local store
      const { user } = get();
      const localClaims = get().listings.filter(l => l.claimedBy === user?.email);
      set({ listingsLoading: false });
    }
  },

  // NGO: confirm received
  confirmReceived: async (listingId) => {
    set({ listingsError: null });
    try {
      const updated = await confirmDeliveryReceived(listingId);
      set((s) => ({ listings: s.listings.map((l) => (l.id === listingId ? updated : l)) }));
      return updated;
    } catch (err) {
      set({ listingsError: err.response?.data?.detail || 'Failed to confirm delivery.' });
      throw err;
    }
  },

  // Delivery: load available pickups
  fetchAvailablePickups: async (params = {}) => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getAvailablePickups(params);
      set({ availablePickups: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 fallback: show claimed listings without delivery from local store
      const { INITIAL_LISTINGS } = require('../data/seedData');
      const localPickups = get().listings.filter(l => l.status === 'claimed' && !l.deliveryId);
      const fallback = localPickups.length ? localPickups : INITIAL_LISTINGS.filter(l => l.status === 'claimed' && !l.deliveryId);
      if (get().availablePickups.length === 0) set({ availablePickups: fallback });
      set({ listingsLoading: false });
    }
  },

  // Delivery: accept pickup request
  acceptDelivery: async (listingId) => {
    set({ listingsError: null });
    const { user } = get();
    try {
      const updated = await acceptPickup(listingId);
      // API returns full listing with donor + ngo details
      set((s) => ({
        availablePickups: s.availablePickups.filter((l) => l.id !== listingId),
        activeDeliveries: [updated, ...s.activeDeliveries],
        listings: s.listings.map(l => l.id === listingId ? updated : l),
      }));
      return updated;
    } catch (err) {
      // 404: apply locally — find full listing so we keep donor + NGO address
      const patch = {
        deliveryId:    user?.email,
        deliveryName:  user?.name,
        delivery_id:   user?.email,
        delivery_name: user?.name,
      };
      set((s) => {
        // Look in all state slices for the full listing data
        const listing =
          s.availablePickups.find(l => l.id === listingId) ||
          s.listings.find(l => l.id === listingId);

        if (!listing) return {};   // nothing to update

        const updated = { ...listing, ...patch };
        return {
          availablePickups: s.availablePickups.filter((l) => l.id !== listingId),
          activeDeliveries: [updated, ...s.activeDeliveries],
          listings: s.listings.map(l => l.id === listingId ? updated : l),
        };
      });
    }
  },

  // Delivery: mark picked up from donor
  markPickedUp: async (listingId) => {
    set({ listingsError: null });
    try {
      const updated = await confirmPickedUp(listingId);
      set((s) => ({
        activeDeliveries: s.activeDeliveries.map((l) => (l.id === listingId ? updated : l)),
        listings: s.listings.map(l => l.id === listingId ? updated : l),
      }));
      return updated;
    } catch (err) {
      // 404: apply locally
      set((s) => ({
        activeDeliveries: s.activeDeliveries.map(l => l.id === listingId ? { ...l, status: 'picked_up' } : l),
        listings: s.listings.map(l => l.id === listingId ? { ...l, status: 'picked_up' } : l),
      }));
    }
  },

  // Delivery: mark delivered to NGO
  markDelivered: async (listingId) => {
    set({ listingsError: null });
    try {
      const updated = await confirmDelivered(listingId);
      set((s) => ({
        activeDeliveries: s.activeDeliveries.filter((l) => l.id !== listingId),
        deliveryHistory:  [updated, ...s.deliveryHistory],
        listings: s.listings.map(l => l.id === listingId ? updated : l),
      }));
      return updated;
    } catch (err) {
      // 404: apply locally
      set((s) => {
        const listing = s.activeDeliveries.find(l => l.id === listingId);
        const done = listing ? { ...listing, status: 'delivered' } : null;
        return {
          activeDeliveries: s.activeDeliveries.filter((l) => l.id !== listingId),
          deliveryHistory:  done ? [done, ...s.deliveryHistory] : s.deliveryHistory,
          listings: s.listings.map(l => l.id === listingId ? { ...l, status: 'delivered' } : l),
        };
      });
    }
  },

  // Delivery: load in-progress deliveries
  fetchActiveDeliveries: async () => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getMyActiveDeliveries();
      set({ activeDeliveries: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 fallback: use local store
      const { user } = get();
      const local = get().listings.filter(l => l.deliveryId === user?.email && ['claimed','picked_up'].includes(l.status));
      if (get().activeDeliveries.length === 0) set({ activeDeliveries: local });
      set({ listingsLoading: false });
    }
  },

  // Delivery: load completed history
  fetchDeliveryHistory: async () => {
    set({ listingsLoading: true, listingsError: null });
    try {
      const data = await getMyDeliveryHistory();
      set({ deliveryHistory: data.results ?? data, listingsLoading: false });
    } catch (err) {
      // 404 fallback: use local store
      const { user } = get();
      const local = get().listings.filter(l => l.deliveryId === user?.email && l.status === 'delivered');
      if (get().deliveryHistory.length === 0) set({ deliveryHistory: local });
      set({ listingsLoading: false });
    }
  },

  // =============================================================
  // ── NEW: Ratings ──────────────────────────────────────────────
  // =============================================================

  myRatings:      [],
  ratingsLoading: false,
  ratingsError:   null,

  // Local ratings map: { [email]: [{ id, reviewer, role, rating, comment, date }] }
  // Used as fallback when API is unavailable
  ratings: {},

  // addRating: local-only fallback used by dashboards when API fails
  addRating: (targetEmail, reviewObj) => {
    set((s) => ({
      ratings: {
        ...s.ratings,
        [targetEmail]: [reviewObj, ...(s.ratings[targetEmail] || [])],
      },
    }));
  },

  fetchMyRatings: async () => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      const data = await getMyRatings();
      set({ myRatings: data.results ?? data, ratingsLoading: false });
    } catch (err) {
      // Network timeout or server down — silently stay on seed/empty data
      set({ ratingsLoading: false });
    }
  },

  // payload: { rated_user_id, listing_id, rating (1-5), comment }
  rateUser: async (payload) => {
    set({ ratingsError: null });
    try {
      const review = await submitRating(payload);
      return review;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit rating.';
      set({ ratingsError: msg });
      throw err;
    }
  },

  // =============================================================
  // ── NEW: Leaderboard ─────────────────────────────────────────
  // =============================================================

  donorLeaderboard:    [],
  deliveryLeaderboard: [],
  leaderboardLoading:  false,

  fetchDonorLeaderboard: async () => {
    set({ leaderboardLoading: true });
    try {
      const data = await getDonorLeaderboard();
      set({ donorLeaderboard: data.results ?? data, leaderboardLoading: false });
    } catch (err) {
      // Network timeout OR 404 — fall back to seed data so UI isn't blank
      const { DONOR_LEADERBOARD } = require('../data/seedData');
      if (get().donorLeaderboard.length === 0) set({ donorLeaderboard: DONOR_LEADERBOARD });
      set({ leaderboardLoading: false });
    }
  },

  fetchDeliveryLeaderboard: async () => {
    set({ leaderboardLoading: true });
    try {
      const data = await getDeliveryLeaderboard();
      set({ deliveryLeaderboard: data.results ?? data, leaderboardLoading: false });
    } catch (err) {
      // Network timeout OR 404 — fall back to seed data so UI isn't blank
      const { DELIVERY_LEADERBOARD } = require('../data/seedData');
      if (get().deliveryLeaderboard.length === 0) set({ deliveryLeaderboard: DELIVERY_LEADERBOARD });
      set({ leaderboardLoading: false });
    }
  },

  // =============================================================
  // ── NEW: Profile ─────────────────────────────────────────────
  // =============================================================

  profile:        null,
  profileLoading: false,
  profileError:   null,

  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      const data = await getMyProfile();
      set({ profile: data, profileLoading: false });
      return data;
    } catch (err) {
      set({ profileError: err.response?.data?.detail || 'Failed to load profile.', profileLoading: false });
    }
  },

  updateProfile: async (payload) => {
    set({ profileError: null });
    try {
      const data = await updateMyProfile(payload);
      set({ profile: data });
      if (data.name) set((s) => ({ user: s.user ? { ...s.user, name: data.name } : s.user }));
      return data;
    } catch (err) {
      set({ profileError: err.response?.data?.detail || 'Failed to update profile.' });
      throw err;
    }
  },

  // =============================================================
  // ── NEW: Notifications ───────────────────────────────────────
  // =============================================================

  notifications:        [],
  notificationCount:    0,
  notificationsLoading: false,

  fetchNotificationCount: async () => {
    try {
      const data = await getNotificationCount();
      set({ notificationCount: data.count ?? 0 });
    } catch { /* silently fail */ }
  },

  fetchNotifications: async (page = 1) => {
    set({ notificationsLoading: true });
    try {
      const data = await getNotifications(page);
      set({
        notifications: page === 1
          ? (data.results ?? data)
          : [...get().notifications, ...(data.results ?? data)],
        notificationsLoading: false,
      });
    } catch { set({ notificationsLoading: false }); }
  },

  markNotificationsRead: async () => {
    try {
      await markNotificationsRead();
      set({ notificationCount: 0 });
    } catch { /* silently fail */ }
  },
}));

export default useAuthStore;