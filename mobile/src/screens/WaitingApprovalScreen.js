// src/screens/WaitingApprovalScreen.js

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, Animated,
} from 'react-native';

import useAuthStore from '../store/authStore';

export default function WaitingApprovalScreen({ navigation }) {
  const { user, refreshStatus, logout } = useAuthStore();
  const pulse = useRef(new Animated.Value(0.4)).current;

  // ── Pulsing animation ──────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Poll status every 10 seconds ───────────────────────────────
  useEffect(() => {
    const poll = setInterval(async () => {
      const status = await refreshStatus();
      if (status === 'approved') {
        clearInterval(poll);
        const routes = { donor: 'DonorDashboard', ngo: 'NGODashboard', delivery: 'DeliveryDashboard' };
        navigation.replace(routes[user?.role] || 'Login');
      } else if (status === 'rejected') {
        clearInterval(poll);
        navigation.replace('Rejected');
      }
    }, 10000);
    return () => clearInterval(poll);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('RoleSelection');
  };

  const ROLE_LABELS = { donor: 'Donor', ngo: 'NGO', delivery: 'Delivery Partner' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.content}>

        {/* Animated indicator */}
        <View style={styles.iconArea}>
          <Animated.View style={[styles.outerRing, { opacity: pulse }]} />
          <View style={styles.innerDot}>
            <Text style={styles.clockIcon}>⏳</Text>
          </View>
        </View>

        <Text style={styles.title}>Under Review</Text>
        <Text style={styles.subtitle}>
          Your <Text style={styles.roleHighlight}>{ROLE_LABELS[user?.role]}</Text> request
          is pending admin verification.
        </Text>

        {/* Status steps */}
        <View style={styles.steps}>
          {[
            { label: 'Request submitted',     done: true  },
            { label: 'Admin reviewing details', done: false },
            { label: 'Account activated',     done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
              <Text style={[styles.stepText, step.done && styles.stepTextDone]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          This usually takes a few hours. We'll notify you when your account is approved.
        </Text>

      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  outerRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FBBF2415',
    borderWidth: 1,
    borderColor: '#FBBF2433',
  },
  innerDot: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FBBF2410',
    borderWidth: 1,
    borderColor: '#FBBF2455',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#E5E5E5',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  roleHighlight: {
    color: '#FBBF24',
    fontWeight: '600',
  },
  steps: {
    width: '100%',
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  stepDotDone: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  stepText: {
    fontSize: 13,
    color: '#555',
  },
  stepTextDone: {
    color: '#E5E5E5',
  },
  note: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
  },
  logoutBtn: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#555',
    fontSize: 14,
  },
});