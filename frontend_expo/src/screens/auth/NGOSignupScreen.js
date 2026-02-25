// src/screens/auth/NGOSignupScreen.js

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { signupNGO } from '../../api/authApi';
import {
  InputField, FileUploadButton, PrimaryButton,
  ScreenHeader, ErrorBanner,
} from '../../components/ui/FormComponents';

const ACCENT = '#60A5FA';

export default function NGOSignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    ngo_name: '', volunteer_name: '', location: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });

  // Expo returns { canceled: bool, assets: [...] }
  if (!result.canceled && result.assets?.length > 0) {
    setProofFile(result.assets[0]);
  }
};

  const handleSignup = async () => {
    setError('');
    const { email, password, phone, ngo_name, volunteer_name, location } = form;

    if (!email || !password || !phone || !ngo_name || !volunteer_name || !location) {
      setError('Please fill in all fields.');
      return;
    }
    if (!proofFile) {
      setError('Please upload your NGO registration proof.');
      return;
    }

    const data = new FormData();
    data.append('email',          email);
    data.append('password',       password);
    data.append('phone',          phone);
    data.append('ngo_name',       ngo_name);
    data.append('volunteer_name', volunteer_name);
    data.append('location',       location);
    data.append('ngo_proof', {
      uri:  proofFile.uri,
      name: proofFile.name,
      type: proofFile.type,
    });

    setLoading(true);
    try {
      await signupNGO(data);
      navigation.navigate('Login');
      Alert.alert(
        '✅ Request Submitted',
        'Your NGO account request has been sent to the admin for approval.',
      );
    } catch (err) {
      const msg = err.response?.data?.email?.[0]
        || err.response?.data?.non_field_errors?.[0]
        || 'Signup failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <ScreenHeader
          title="NGO Signup"
          subtitle="Register your organisation to receive food"
          onBack={() => navigation.goBack()}
          accent={ACCENT}
        />

        <ErrorBanner message={error} />

        <InputField label="NGO Name"         value={form.ngo_name}       onChangeText={(v) => update('ngo_name', v)}       placeholder="e.g. Asha Foundation" />
        <InputField label="Volunteer Name"   value={form.volunteer_name} onChangeText={(v) => update('volunteer_name', v)} placeholder="Your full name" />
        <InputField label="Location"         value={form.location}       onChangeText={(v) => update('location', v)}       placeholder="NGO address" multiline />
        <InputField label="Email Address"    value={form.email}          onChangeText={(v) => update('email', v)}          placeholder="ngo@email.com" keyboardType="email-address" />
        <InputField label="Phone Number"     value={form.phone}          onChangeText={(v) => update('phone', v)}          placeholder="+91 9XXXXXXXXX" keyboardType="phone-pad" />
        <InputField label="Password"         value={form.password}       onChangeText={(v) => update('password', v)}       placeholder="Min. 8 characters" secureTextEntry />

        <FileUploadButton
          label="NGO Registration Certificate"
          fileName={proofFile?.name}
          onPress={pickFile}
          accent={ACCENT}
        />

        <PrimaryButton
          label="Submit for Approval"
          onPress={handleSignup}
          loading={loading}
          accent={ACCENT}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll:    { paddingHorizontal: 24, paddingBottom: 40 },
});