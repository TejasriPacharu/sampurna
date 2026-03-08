// src/screens/auth/LoginScreen.js

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';

import useAuthStore from '../../store/authStore';
import {
  InputField, PrimaryButton, ErrorBanner,
} from '../../components/ui/FormComponents';

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const { login, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) return;
    clearError();
    setLoading(true);

    try {
      const data = await login(email, password);

      // Route based on role + status
      if (data.role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (data.status === 'pending') {
        navigation.replace('WaitingApproval');
      } else if (data.status === 'rejected') {
        navigation.replace('Rejected');
      } else if (data.status === 'approved') {
        const routes = {
          donor:    'DonorDashboard',
          ngo:      'NGODashboard',
          delivery: 'DeliveryDashboard',
        };
        navigation.replace(routes[data.role] || 'RoleSelection');
      }
    } catch {
      // error is set in store
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>sampurna</Text>
          <Text style={styles.tagline}>rescue food. restore dignity.</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>

        <ErrorBanner message={error} />

        <InputField
          label="Email Address"
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <InputField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PrimaryButton
          label="Sign In"
          onPress={handleLogin}
          loading={loading}
          accent="#4ADE80"
        />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>new here?</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Role signup links */}
        <View style={styles.signupLinks}>
          {[
            { label: '🏨 Donor',            screen: 'DonorSignup',    color: '#4ADE80' },
            { label: '🤝 NGO',              screen: 'NGOSignup',      color: '#60A5FA' },
            { label: '🚴 Delivery Partner', screen: 'DeliverySignup', color: '#FBBF24' },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.signupLink, { borderColor: item.color + '33' }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.8}
            >
              <Text style={[styles.signupLinkText, { color: item.color }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll:    { paddingHorizontal: 24, paddingBottom: 40 },
  logoArea:  { paddingTop: 48, paddingBottom: 36 },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    color: '#555',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E5E5E5',
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#555',
    fontSize: 12,
  },
  signupLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  signupLink: {
    flex: 1,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 11,
    fontWeight: '600',
  },
});