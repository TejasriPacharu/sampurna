// src/screens/dashboards/NGODashboard.js

import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, ScrollView,
} from 'react-native';
import useAuthStore from '../../store/authStore';

const ACCENT = '#60A5FA';

export default function NGODashboard({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.appName}>sampurna</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome card */}
        <View style={[styles.welcomeCard, { borderColor: ACCENT + '30' }]}>
          <View style={[styles.roleIconBox, { backgroundColor: ACCENT + '15' }]}>
            <Text style={styles.roleIcon}>🤝</Text>
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeLabel}>Welcome back,</Text>
            <Text style={styles.welcomeEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
          <View style={[styles.verifiedBadge, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '40' }]}>
            <Text style={[styles.verifiedText, { color: ACCENT }]}>✓ Verified</Text>
          </View>
        </View>

        {/* Dashboard title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.dashboardTitle, { color: ACCENT }]}>NGO Dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Claim and distribute surplus food nearby</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Claimed',   value: '0', icon: '📥' },
            { label: 'Received',  value: '0', icon: '🍽️'  },
            { label: 'Meals Fed', value: '0', icon: '👥' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: ACCENT }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {[
          { icon: '🗺️', label: 'Nearby Food',       sublabel: 'Browse available listings near you'  },
          { icon: '📋', label: 'My Claims',          sublabel: 'Track food you have claimed'          },
          { icon: '🚚', label: 'Live Deliveries',    sublabel: 'Monitor incoming deliveries'          },
          { icon: '📊', label: 'Impact Report',      sublabel: 'Meals received and distributed'       },
        ].map((action) => (
          <TouchableOpacity key={action.label} style={styles.actionCard} activeOpacity={0.8}>
            <View style={[styles.actionIconBox, { backgroundColor: ACCENT + '10' }]}>
              <Text style={styles.actionIcon}>{action.icon}</Text>
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionSublabel}>{action.sublabel}</Text>
            </View>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0A0A' },
  scroll:     { paddingHorizontal: 20, paddingBottom: 40 },
  topBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  appName:    { fontSize: 18, fontWeight: '700', color: '#4ADE80', letterSpacing: -0.5 },
  logoutBtn:  { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#1A1A1A', borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  logoutText: { color: '#666', fontSize: 12 },

  welcomeCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, marginBottom: 24 },
  roleIconBox:   { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleIcon:      { fontSize: 22 },
  welcomeText:   { flex: 1 },
  welcomeLabel:  { fontSize: 11, color: '#666' },
  welcomeEmail:  { fontSize: 14, fontWeight: '600', color: '#E5E5E5', marginTop: 2 },
  verifiedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  verifiedText:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  sectionHeader:     { marginBottom: 20 },
  dashboardTitle:    { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  dashboardSubtitle: { fontSize: 13, color: '#555', marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: '#141414', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', padding: 14, alignItems: 'center', gap: 4 },
  statIcon:  { fontSize: 18 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 0.3 },

  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  actionCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', borderRadius: 14, borderWidth: 1, borderColor: '#1E1E1E', padding: 14, gap: 12, marginBottom: 10 },
  actionIconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionIcon:    { fontSize: 20 },
  actionText:    { flex: 1 },
  actionLabel:   { fontSize: 14, fontWeight: '600', color: '#E5E5E5' },
  actionSublabel:{ fontSize: 11, color: '#555', marginTop: 2 },
  soonBadge:     { backgroundColor: '#2A2A2A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  soonText:      { fontSize: 10, color: '#555', fontWeight: '600' },
});