// src/screens/dashboards/DonorDashboard.js

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import useAuthStore from '../../store/authStore';

export default function DonorDashboard({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>🏨</Text>
        </View>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.approvedBadge}>
          <Text style={styles.approvedText}>✓ Verified Donor</Text>
        </View>
        <Text style={styles.note}>
          Donor dashboard features coming soon — food listings, pickup scheduling, and impact stats.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── NGO Dashboard ─────────────────────────────────────────────────────
// src/screens/dashboards/NGODashboard.js
export function NGODashboard({ navigation }) {
  const { user, logout } = useAuthStore();
  const handleLogout = async () => { await logout(); navigation.replace('RoleSelection'); };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: '#60A5FA15', borderColor: '#60A5FA33' }]}>
          <Text style={styles.badgeIcon}>🤝</Text>
        </View>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.approvedBadge, { backgroundColor: '#60A5FA15', borderColor: '#60A5FA33' }]}>
          <Text style={[styles.approvedText, { color: '#60A5FA' }]}>✓ Verified NGO</Text>
        </View>
        <Text style={styles.note}>
          NGO dashboard features coming soon — nearby food listings, claim flow, and delivery tracking.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Delivery Dashboard ────────────────────────────────────────────────
// src/screens/dashboards/DeliveryDashboard.js
export function DeliveryDashboard({ navigation }) {
  const { user, logout } = useAuthStore();
  const handleLogout = async () => { await logout(); navigation.replace('RoleSelection'); };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: '#FBBF2415', borderColor: '#FBBF2433' }]}>
          <Text style={styles.badgeIcon}>🚴</Text>
        </View>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.approvedBadge, { backgroundColor: '#FBBF2415', borderColor: '#FBBF2433' }]}>
          <Text style={[styles.approvedText, { color: '#FBBF24' }]}>✓ Verified Delivery Partner</Text>
        </View>
        <Text style={styles.note}>
          Delivery dashboard features coming soon — pickup tasks, live navigation, and delivery history.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Rejected Screen ───────────────────────────────────────────────────
// src/screens/RejectedScreen.js
export function RejectedScreen({ navigation }) {
  const { logout } = useAuthStore();
  const handleLogout = async () => { await logout(); navigation.replace('RoleSelection'); };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: '#EF444415', borderColor: '#EF444433' }]}>
          <Text style={styles.badgeIcon}>✕</Text>
        </View>
        <Text style={[styles.greeting, { color: '#EF4444' }]}>Request Rejected</Text>
        <Text style={styles.note}>
          Your account request was not approved. Please contact support or re-apply with updated documentation.
        </Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Shared Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4ADE8015',
    borderWidth: 1,
    borderColor: '#4ADE8033',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeIcon:     { fontSize: 32 },
  greeting:      { fontSize: 14, color: '#666' },
  email:         { fontSize: 18, fontWeight: '700', color: '#E5E5E5' },
  approvedBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#4ADE8015', borderRadius: 20, borderWidth: 1, borderColor: '#4ADE8033' },
  approvedText:  { color: '#4ADE80', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  note:          { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 280 },
  logoutBtn:     { marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#1A1A1A', borderRadius: 10, borderWidth: 1, borderColor: '#2A2A2A' },
  logoutText:    { color: '#666', fontSize: 13 },
});