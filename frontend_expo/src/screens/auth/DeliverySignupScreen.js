// src/screens/auth/DeliverySignupScreen.js

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, Alert, TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { signupDelivery } from '../../api/authApi';
import {
  InputField, FileUploadButton, PrimaryButton,
  ScreenHeader, ErrorBanner,
} from '../../components/ui/FormComponents';

// ── Light theme accent (Delivery = amber) ───────────────────────
const ACCENT    = '#D97706';
const ACCENT_BG = '#FFFBEB';
const ACCENT_BD = '#FDE68A';

// ── Vehicle type options ─────────────────────────────────────────
const VEHICLE_TYPES = [
  { label: 'Motorcycle', icon: '🏍️' },
  { label: 'Auto',       icon: '🛺' },
  { label: 'Car',        icon: '🚗' },
  { label: 'Van',        icon: '🚐' },
];

// ── Validation ───────────────────────────────────────────────────
const validate = (form, licenseFile) => {
  const errs = {};
  if (!form.full_name.trim()) errs.full_name = 'Full name is required.';
  if (!form.address.trim())   errs.address   = 'Address is required.';
  if (!form.email.trim())     errs.email     = 'Email is required.';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email.';
  if (!form.phone.trim())     errs.phone     = 'Phone is required.';
  else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';
  if (!form.password)         errs.password  = 'Password is required.';
  else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
  if (!licenseFile)           errs.license   = 'Please upload your driving license.';
  return errs;
};

// ── Password strength ────────────────────────────────────────────
const getPasswordStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)             score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  if (score <= 1) return { label: 'Weak',   color: '#DC2626', width: '25%' };
  if (score === 2) return { label: 'Fair',   color: '#D97706', width: '50%' };
  if (score === 3) return { label: 'Good',   color: '#2563EB', width: '75%' };
  return               { label: 'Strong', color: '#16A34A', width: '100%' };
};

export default function DeliverySignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    full_name: '', address: '', platform_id: '',
  });
  const [licenseFile,    setLicenseFile]    = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [fieldErrors,    setFieldErrors]    = useState({});
  const [showPassword,   setShowPassword]   = useState(false);
  const [acceptedTerms,  setAcceptedTerms]  = useState(false);
  const [selectedVehicle,setSelectedVehicle]= useState('');
  const [uploadProgress, setUploadProgress] = useState(null);

  const update = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (fieldErrors[key]) setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setLicenseFile(result.assets[0]);
      setUploadProgress('uploading');
      setTimeout(() => setUploadProgress('done'), 600);
      if (fieldErrors.license) setFieldErrors((e) => { const n = { ...e }; delete n.license; return n; });
    }
  };

  const handleSignup = async () => {
    setError('');
    const errs = validate(form, licenseFile);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Please fix the errors highlighted below.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
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
    data.append('email',     email);
    data.append('password',  password);
    data.append('phone',     phone);
    data.append('full_name', full_name);
    data.append('address',   address);
    if (selectedVehicle) data.append('vehicle_type', selectedVehicle);

    if (Platform.OS === 'web') {
      const response = await fetch(licenseFile.uri);
      const blob = await response.blob();
      const file = new File([blob], licenseFile.name, { type: licenseFile.mimeType || blob.type });
      data.append('license_upload', file);
    } else {
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
      const backendData = err.response?.data;
      if (backendData && typeof backendData === 'object') {
        const mapped = {};
        Object.entries(backendData).forEach(([key, val]) => {
          mapped[key] = Array.isArray(val) ? val[0] : val;
        });
        if (Object.keys(mapped).length > 0) setFieldErrors(mapped);
      }
      const msg = err.response?.data?.email?.[0]
        || err.response?.data?.non_field_errors?.[0]
        || 'Signup failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F6F3" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <ScreenHeader
          title="Delivery Partner"
          subtitle="Join Sampurna's food rescue network"
          onBack={() => navigation.goBack()}
          accent={ACCENT}
        />

        {/* Info banner */}
        <View style={[styles.infoBanner, { borderColor: ACCENT_BD, backgroundColor: ACCENT_BG }]}>
          <Text style={[styles.infoBannerText, { color: ACCENT }]}>
            🔍 Your profile will be verified by admin before you can accept deliveries.
          </Text>
        </View>

        <ErrorBanner message={error} />

        {/* Personal Info */}
        <Text style={styles.sectionLabel}>Personal Info</Text>
        <InputField
          label="Full Name"
          value={form.full_name}
          onChangeText={(v) => update('full_name', v)}
          placeholder="Your full legal name"
        />
        {fieldErrors.full_name && <Text style={styles.fieldErr}>{fieldErrors.full_name}</Text>}

        <InputField
          label="Address"
          value={form.address}
          onChangeText={(v) => update('address', v)}
          placeholder="Residential address"
          multiline
        />
        {fieldErrors.address && <Text style={styles.fieldErr}>{fieldErrors.address}</Text>}

        {/* Vehicle type selector */}
        <Text style={styles.fieldLabel}>Vehicle Type</Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.label}
              onPress={() => setSelectedVehicle(v.label === selectedVehicle ? '' : v.label)}
              style={[
                styles.vehicleCard,
                selectedVehicle === v.label && {
                  borderColor: ACCENT,
                  backgroundColor: ACCENT_BG,
                },
              ]}
            >
              <Text style={styles.vehicleIcon}>{v.icon}</Text>
              <Text style={[
                styles.vehicleLabel,
                selectedVehicle === v.label && { color: ACCENT, fontWeight: '700' },
              ]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Account Details */}
        <Text style={styles.sectionLabel}>Account Details</Text>
        <InputField
          label="Email Address"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          placeholder="you@email.com"
          keyboardType="email-address"
        />
        {fieldErrors.email && <Text style={styles.fieldErr}>{fieldErrors.email}</Text>}

        <InputField
          label="Phone Number"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          placeholder="+91 9XXXXXXXXX"
          keyboardType="phone-pad"
        />
        {fieldErrors.phone && <Text style={styles.fieldErr}>{fieldErrors.phone}</Text>}

        {/* Password with toggle */}
        <View style={styles.passwordRow}>
          <View style={{ flex: 1 }}>
            <InputField
              label="Password"
              value={form.password}
              onChangeText={(v) => update('password', v)}
              placeholder="Min. 8 characters"
              secureTextEntry={!showPassword}
            />
          </View>
          <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {fieldErrors.password && <Text style={styles.fieldErr}>{fieldErrors.password}</Text>}

        {/* Password strength */}
        {pwStrength && (
          <View style={styles.strengthRow}>
            <View style={styles.strengthBar}>
              <View style={[styles.strengthFill, { width: pwStrength.width, backgroundColor: pwStrength.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: pwStrength.color }]}>{pwStrength.label}</Text>
          </View>
        )}

        <InputField
          label="Platform ID (optional)"
          value={form.platform_id}
          onChangeText={(v) => update('platform_id', v)}
          placeholder="Swiggy / Zomato ID if any"
        />

        {/* Documents */}
        <Text style={styles.sectionLabel}>Verification Documents</Text>
        <FileUploadButton
          label="Driving License"
          fileName={licenseFile?.name}
          onPress={pickFile}
          accent={ACCENT}
        />
        {fieldErrors.license && <Text style={styles.fieldErr}>{fieldErrors.license}</Text>}
        {uploadProgress === 'uploading' && <Text style={[styles.uploadStatus, { color: '#D97706' }]}>⏳ Reading file…</Text>}
        {uploadProgress === 'done'      && <Text style={[styles.uploadStatus, { color: '#16A34A' }]}>✅ File ready to upload</Text>}
        <Text style={styles.hint}>Accepted: PDF or image (JPG/PNG). Max 5 MB.</Text>

        {/* Terms */}
        <TouchableOpacity onPress={() => setAcceptedTerms((t) => !t)} style={styles.termsRow} activeOpacity={0.8}>
          <View style={[styles.checkbox, acceptedTerms && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
            {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={{ color: ACCENT }}>Terms & Conditions</Text>
            {' '}and{' '}
            <Text style={{ color: ACCENT }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <PrimaryButton
          label="Submit for Approval"
          onPress={handleSignup}
          loading={loading}
          accent={ACCENT}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already approved? <Text style={{ color: ACCENT }}>Sign in</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F7F6F3' },
  scroll:        { paddingHorizontal: 24, paddingBottom: 40 },
  infoBanner:    { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  infoBannerText:{ fontSize: 12, lineHeight: 18, fontWeight: '500' },
  sectionLabel:  { fontSize: 11, fontWeight: '700', color: '#8C8880', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  fieldLabel:    { fontSize: 13, color: '#4B4842', fontWeight: '600', marginBottom: 10 },
  fieldErr:      { fontSize: 11, color: '#DC2626', marginTop: -6, marginBottom: 8, marginLeft: 2 },
  // vehicle grid
  vehicleGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vehicleCard:   { width: '22%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E3E0D9', backgroundColor: '#FFFFFF', alignItems: 'center', gap: 6,
                   shadowColor: '#1C1A17', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  vehicleIcon:   { fontSize: 22 },
  vehicleLabel:  { fontSize: 10, color: '#6B6860', fontWeight: '600' },
  // password
  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:        { marginLeft: 8, marginTop: 6, padding: 8 },
  eyeIcon:       { fontSize: 18 },
  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 12 },
  strengthBar:   { flex: 1, height: 4, backgroundColor: '#E3E0D9', borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', width: 48 },
  // upload
  uploadStatus:  { fontSize: 12, marginTop: -6, marginBottom: 8 },
  hint:          { fontSize: 11, color: '#8C8880', marginBottom: 14 },
  // terms
  termsRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 },
  checkbox:      { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D6D2CA', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkmark:     { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  termsText:     { flex: 1, fontSize: 13, color: '#4B4842', lineHeight: 18 },
  loginLink:     { alignItems: 'center', marginTop: 20 },
  loginText:     { fontSize: 13, color: '#8C8880' },
});