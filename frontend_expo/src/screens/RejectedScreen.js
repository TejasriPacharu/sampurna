// src/screens/RejectedScreen.js

import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity,
} from 'react-native';
import useAuthStore from '../store/authStore';

export default function RejectedScreen({ navigation }) {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.content}>

        {/* Icon */}
        <View style={styles.iconBox}>
          <Text style={styles.icon}>✕</Text>
        </View>

        <Text style={styles.title}>Request Rejected</Text>
        <Text style={styles.subtitle}>
          Your account request was reviewed and could not be approved at this time.
        </Text>

        {/* Reason card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What to do next</Text>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.stepText}>Contact support for the rejection reason</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepText}>Re-apply with updated or clearer documents</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepText}>Ensure your proof documents are valid and legible</Text>
          </View>
        </View>

        {/* Support contact */}
        <View style={styles.supportBox}>
          <Text style={styles.supportLabel}>Need help?</Text>
          <Text style={styles.supportEmail}>support@sampurna.in</Text>
        </View>

      </View>

      {/* Footer */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>← Back to Home</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444440',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 32,
    color: '#EF4444',
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  card: {
    width: '100%',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444440',
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
  },
  supportBox: {
    alignItems: 'center',
    gap: 4,
  },
  supportLabel: {
    fontSize: 12,
    color: '#555',
  },
  supportEmail: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  logoutBtn: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  logoutText: {
    color: '#555',
    fontSize: 14,
  },
});