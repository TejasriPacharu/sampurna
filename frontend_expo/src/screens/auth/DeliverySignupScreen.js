// src/screens/auth/DeliverySignupScreen.js

import React, { useState } from 'react';
import { ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { signupDelivery } from '../../api/authApi';
import {
  InputField, FileUploadButton, PrimaryButton,
  ScreenHeader, ErrorBanner,
} from '../../components/ui/FormComponents';

const ACCENT = '#FBBF24';

export default function DeliverySignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    full_name: '', address: '', platform_id: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });

  // Expo returns { canceled: bool, assets: [...] }
  if (!result.canceled && result.assets?.length > 0) {
    setLicenseFile(result.assets[0]);
  }
};

  const handleSignup = async () => {
    setError('');
    const { email, password, phone, full_name, address } = form;

    if (!email || !password || !phone || !full_name || !address) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!licenseFile) {
      setError('Please upload your driving license.');
      return;
    }

    const data = new FormData();
    data.append('email',       email);
    data.append('password',    password);
    data.append('phone',       phone);
    data.append('full_name',   full_name);
    data.append('address',     address);

    if(Platform.OS === 'web') {
      const response = await fetch(licenseFile.uri);
      const blob = await response.blob();
      const file = new File([blob], licenseFile.name, {type:licenseFile.mimeType || blob.type});
      data.append('license_upload', file);
    }
    else {
        if (form.platform_id) data.append('platform_id', form.platform_id);
        data.append('license_upload', {
        uri:  licenseFile.uri,
        name: licenseFile.name,
        type: licenseFile.mimeType,
      });
    }
    setLoading(true);
    try {
      await signupDelivery(data);
      navigation.navigate('Login');
      Alert.alert(
        '✅ Request Submitted',
        'Your delivery partner request has been submitted. You will be notified once approved.',
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
          title="Delivery Partner"
          subtitle="Join Sampurna's food rescue network"
          onBack={() => navigation.goBack()}
          accent={ACCENT}
        />

        <ErrorBanner message={error} />

        <InputField label="Full Name"             value={form.full_name}   onChangeText={(v) => update('full_name', v)}   placeholder="Your full legal name" />
        <InputField label="Address"               value={form.address}     onChangeText={(v) => update('address', v)}     placeholder="Residential address" multiline />
        <InputField label="Email Address"         value={form.email}       onChangeText={(v) => update('email', v)}       placeholder="you@email.com" keyboardType="email-address" />
        <InputField label="Phone Number"          value={form.phone}       onChangeText={(v) => update('phone', v)}       placeholder="+91 9XXXXXXXXX" keyboardType="phone-pad" />
        <InputField label="Password"              value={form.password}    onChangeText={(v) => update('password', v)}    placeholder="Min. 8 characters" secureTextEntry />
        <InputField label="Platform ID (optional)" value={form.platform_id} onChangeText={(v) => update('platform_id', v)} placeholder="Swiggy / Zomato ID if any" />

        <FileUploadButton
          label="Driving License"
          fileName={licenseFile?.name}
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