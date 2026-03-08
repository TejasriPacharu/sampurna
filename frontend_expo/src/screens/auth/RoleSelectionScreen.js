// src/screens/auth/RoleSelectionScreen.js

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id:       'donor',
    label:    'Donor',
    subtitle: 'Hotels, Hostels & Events',
    icon:     '🏨',
    screen:   'DonorSignup',
    accent:   '#4ADE80',
  },
  {
    id:       'ngo',
    label:    'NGO',
    subtitle: 'Receive & distribute food',
    icon:     '🤝',
    screen:   'NGOSignup',
    accent:   '#60A5FA',
  },
  {
    id:       'delivery',
    label:    'Delivery Partner',
    subtitle: 'Pick up & transport food',
    icon:     '🚴',
    screen:   'DeliverySignup',
    accent:   '#FBBF24',
  },
];

export default function RoleSelectionScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>sampurna</Text>
        <Text style={styles.tagline}>rescue food. restore dignity.</Text>
      </View>

      {/* Role Cards */}
      <View style={styles.body}>
        <Text style={styles.prompt}>I am a —</Text>

        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.card, { borderColor: role.accent + '33' }]}
            onPress={() => navigation.navigate(role.screen)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: role.accent + '15' }]}>
              <Text style={styles.icon}>{role.icon}</Text>
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.roleLabel, { color: role.accent }]}>{role.label}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
            <Text style={[styles.arrow, { color: role.accent }]}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
  },
  prompt: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E5E5E5',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '300',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '600',
  },
});