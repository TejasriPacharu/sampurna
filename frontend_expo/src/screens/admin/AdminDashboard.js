// src/screens/admin/AdminDashboard.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl,
} from 'react-native';

import { adminGetUsers, adminGetStats, adminUpdateUserStatus } from '../../api/authApi';
import useAuthStore from '../../store/authStore';

const ROLE_COLORS  = { donor: '#4ADE80', ngo: '#60A5FA', delivery: '#FBBF24' };
const ROLE_ICONS   = { donor: '🏨',      ngo: '🤝',      delivery: '🚴'      };
const STATUS_COLORS = { pending: '#FBBF24', approved: '#4ADE80', rejected: '#EF4444' };

// ── Stat Tile ──────────────────────────────────────────────────────
function StatTile({ label, value, color }) {
  return (
    <View style={[styles.tile, { borderColor: color + '33' }]}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

// ── User Card ──────────────────────────────────────────────────────
function UserCard({ user, onApprove, onReject, onView }) {
  const roleColor = ROLE_COLORS[user.role]  || '#888';
  const icon      = ROLE_ICONS[user.role]   || '👤';

  const profileName =
    user.profile?.org_name       ||
    user.profile?.ngo_name       ||
    user.profile?.full_name      ||
    user.email;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onView(user)} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: roleColor + '15' }]}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{profileName}</Text>
          <Text style={styles.cardEmail} numberOfLines={1}>{user.email}</Text>
          <Text style={[styles.cardRole, { color: roleColor }]}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[user.status] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[user.status] }]}>
            {user.status}
          </Text>
        </View>
      </View>

      {user.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(user.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectBtnText}>✕ Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(user.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.approveBtnText}>✓ Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Filter Tabs ────────────────────────────────────────────────────
function FilterTabs({ active, onChange }) {
  const tabs = [
    { key: 'pending',  label: 'Pending'  },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];
  return (
    <View style={styles.tabs}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, active === tab.key && styles.tabActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, active === tab.key && styles.tabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
export default function AdminDashboard({ navigation }) {
  const [users,      setUsers]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [filter,     setFilter]     = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuthStore();

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminGetUsers({ status: filter }),
        adminGetStats(),
      ]);
      setUsers(usersRes.results);
      setStats(statsRes);
    } catch (e) {
      console.error('Admin fetch error:', e);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApprove = async (userId) => {
    try {
      await adminUpdateUserStatus(userId, 'approved');
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleReject = async (userId) => {
    try {
      await adminUpdateUserStatus(userId, 'rejected');
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>sampurna</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <StatTile label="Pending"  value={stats.total_pending}          color="#FBBF24" />
          <StatTile label="Donors"   value={stats.donor?.approved    || 0} color="#4ADE80" />
          <StatTile label="NGOs"     value={stats.ngo?.approved      || 0} color="#60A5FA" />
          <StatTile label="Delivery" value={stats.delivery?.approved || 0} color="#F472B6" />
        </View>
      )}

      {/* Filter Tabs */}
      <FilterTabs active={filter} onChange={setFilter} />

      {/* User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />
        }
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={(u) => navigation.navigate('AdminUserDetail', { user: u })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No {filter} requests</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0A0A0A' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle:  { fontSize: 22, fontWeight: '700', color: '#E5E5E5' },
  headerSub:    { fontSize: 12, color: '#4ADE80', marginTop: 2, letterSpacing: 0.5 },
  logoutBtn:    { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  logoutText:   { color: '#666', fontSize: 12 },

  statsRow:  { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  tile:      { flex: 1, backgroundColor: '#141414', borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  tileValue: { fontSize: 22, fontWeight: '700' },
  tileLabel: { fontSize: 10, color: '#666', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.3 },

  tabs:         { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#141414', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab:          { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive:    { backgroundColor: '#1E1E1E' },
  tabText:      { fontSize: 13, color: '#555', fontWeight: '600' },
  tabTextActive:{ color: '#E5E5E5' },

  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },

  card:     { backgroundColor: '#141414', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#222' },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#E5E5E5' },
  cardEmail:{ fontSize: 11, color: '#666', marginTop: 2 },
  cardRole: { fontSize: 11, fontWeight: '600', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.3 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  cardActions:   { flexDirection: 'row', marginTop: 14, gap: 10 },
  rejectBtn:     { flex: 1, paddingVertical: 10, backgroundColor: '#EF444415', borderWidth: 1, borderColor: '#EF444433', borderRadius: 10, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  approveBtn:    { flex: 1, paddingVertical: 10, backgroundColor: '#4ADE8015', borderWidth: 1, borderColor: '#4ADE8033', borderRadius: 10, alignItems: 'center' },
  approveBtnText:{ color: '#4ADE80', fontSize: 13, fontWeight: '600' },

  empty:     { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#444', fontSize: 14 },
});