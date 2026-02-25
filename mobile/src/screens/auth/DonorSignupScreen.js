// src/screens/auth/DonorSignupScreen.js

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

import { signupDonor } from '../../api/authApi';
import {
  InputField, FileUploadButton, PrimaryButton,
  ScreenHeader, ErrorBanner,
} from '../../components/ui/FormComponents';

const ACCENT = '#4ADE80';

export default function DonorSignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    org_name: '', responsible_person: '',
    location: '',
  });
  const [proofFile,  setProofFile]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
      });
      setProofFile(result);
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) setError('Failed to pick file.');
    }
  };

  const handleSignup = async () => {
    setError('');
    const { email, password, phone, org_name, responsible_person, location } = form;

    if (!email || !password || !phone || !org_name || !responsible_person || !location) {
      setError('Please fill in all fields.');
      return;
    }
    if (!proofFile) {
      setError('Please upload your FSSAI / Business proof.');
      return;
    }

    const data = new FormData();
    data.append('email',              email);
    data.append('password',           password);
    data.append('phone',              phone);
    data.append('org_name',           org_name);
    data.append('responsible_person', responsible_person);
    data.append('location',           location);
    data.append('fssai_proof', {
      uri:  proofFile.uri,
      name: proofFile.name,
      type: proofFile.type,
    });

    setLoading(true);
    try {
      await signupDonor(data);
      navigation.navigate('Login');
      Alert.alert(
        '✅ Request Submitted',
        'Your donor account request has been sent to the admin for approval. You will be notified once approved.',
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
          title="Donor Signup"
          subtitle="Hotels, Hostels & Event organisers"
          onBack={() => navigation.goBack()}
          accent={ACCENT}
        />

        <ErrorBanner message={error} />

        {/* Organisation Details */}
        <InputField label="Organisation Name"     value={form.org_name}           onChangeText={(v) => update('org_name', v)}           placeholder="e.g. The Grand Hyatt" />
        <InputField label="Responsible Person"    value={form.responsible_person} onChangeText={(v) => update('responsible_person', v)} placeholder="Full name of contact person" />
        <InputField label="Location / Address"    value={form.location}           onChangeText={(v) => update('location', v)}           placeholder="Full address" multiline />

        {/* Account Details */}
        <InputField label="Email Address"         value={form.email}    onChangeText={(v) => update('email', v)}    placeholder="work@email.com" keyboardType="email-address" />
        <InputField label="Phone Number"          value={form.phone}    onChangeText={(v) => update('phone', v)}    placeholder="+91 9XXXXXXXXX"  keyboardType="phone-pad" />
        <InputField label="Password"              value={form.password} onChangeText={(v) => update('password', v)} placeholder="Min. 8 characters" secureTextEntry />

        {/* Proof Upload */}
        <FileUploadButton
          label="FSSAI / Business Proof"
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