// src/screens/auth/DonorSignupScreen.js

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  StatusBar, Alert, TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import { signupDonor } from '../../api/authApi';
import {
  InputField, FileUploadButton, PrimaryButton,
  ScreenHeader, ErrorBanner,
} from '../../components/ui/FormComponents';

// ── Light theme accent (Donor = green) ──────────────────────────
const ACCENT    = '#16A34A';
const ACCENT_BG = '#F0FDF4';
const ACCENT_BD = '#BBF7D0';

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

// ── Validation ───────────────────────────────────────────────────
const validate = (form, proofFile) => {
  const errs = {};
  if (!form.org_name.trim())           errs.org_name           = 'Organisation name is required.';
  if (!form.responsible_person.trim()) errs.responsible_person = 'Contact person name is required.';
  if (!form.location.trim())           errs.location           = 'Address is required.';
  if (!form.email.trim())              errs.email              = 'Email is required.';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email       = 'Enter a valid email.';
  if (!form.phone.trim())              errs.phone              = 'Phone number is required.';
  else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) errs.phone = 'Enter a valid phone number.';
  if (!form.password)                  errs.password           = 'Password is required.';
  else if (form.password.length < 8)   errs.password           = 'Password must be at least 8 characters.';
  if (!proofFile)                      errs.proof              = 'Please upload your FSSAI / Business proof.';
  return errs;
};

export default function DonorSignupScreen({ navigation }) {
  const [form, setForm] = useState({
    email: '', password: '', phone: '',
    org_name: '', responsible_person: '',
    location: '',
  });
  const [proofFile,    setProofFile]    = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [fieldErrors,  setFieldErrors]  = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms,setAcceptedTerms]= useState(false);
  const [uploadProgress,setUploadProgress] = useState(null);

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
      setProofFile(result.assets[0]);
      setUploadProgress('uploading');
      setTimeout(() => setUploadProgress('done'), 600);
      if (fieldErrors.proof) setFieldErrors((e) => { const n = { ...e }; delete n.proof; return n; });
    }
  };

  const handleSignup = async () => {
    setError('');
    const errs = validate(form, proofFile);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Please fix the errors highlighted below.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
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
    if (Platform.OS === 'web') {
      const response = await fetch(proofFile.uri);
      const blob = await response.blob();
      const file = new File([blob], proofFile.name, { type: proofFile.mimeType || blob.type });
      data.append('fssai_proof', file);
    } else {
      data.append('fssai_proof', {
        uri:  proofFile.uri,
        name: proofFile.name,
        type: proofFile.mimeType || proofFile.type,
      });
    }

    setLoading(true);
    try {
      await signupDonor(data);
      navigation.navigate('Login');
      Alert.alert(
        '✅ Request Submitted',
        'Your donor account request has been sent to the admin for approval. You will be notified once approved.',
      );
    } catch (err) {
      console.log('Full error:', JSON.stringify(err.response?.data, null, 2));
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
        || JSON.stringify(err.response?.data)
        || err.message
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
          title="Donor Signup"
          subtitle="Hotels, Hostels & Event organisers"
          onBack={() => navigation.goBack()}
          accent={ACCENT}
        />

        <ErrorBanner message={error} />

        {/* Progress steps */}
        <View style={styles.stepsRow}>
          {['Organisation', 'Account', 'Documents'].map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: i === 0 ? ACCENT : ACCENT_BD }]}>
                <Text style={[styles.stepNum, { color: i === 0 ? '#fff' : ACCENT }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, { color: i === 0 ? ACCENT : '#8C8880' }]}>{step}</Text>
              {i < 2 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* Organisation Details */}
        <Text style={styles.sectionLabel}>Organisation Details</Text>
        <InputField
          label="Organisation Name"
          value={form.org_name}
          onChangeText={(v) => update('org_name', v)}
          placeholder="e.g. The Grand Hyatt"
        />
        {fieldErrors.org_name && <Text style={styles.fieldErr}>{fieldErrors.org_name}</Text>}

        <InputField
          label="Responsible Person"
          value={form.responsible_person}
          onChangeText={(v) => update('responsible_person', v)}
          placeholder="Full name of contact person"
        />
        {fieldErrors.responsible_person && <Text style={styles.fieldErr}>{fieldErrors.responsible_person}</Text>}

        <InputField
          label="Location / Address"
          value={form.location}
          onChangeText={(v) => update('location', v)}
          placeholder="Full address"
          multiline
        />
        {fieldErrors.location && <Text style={styles.fieldErr}>{fieldErrors.location}</Text>}

        {/* Account Details */}
        <Text style={styles.sectionLabel}>Account Details</Text>
        <InputField
          label="Email Address"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          placeholder="work@email.com"
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

        {/* Documents */}
        <Text style={styles.sectionLabel}>Verification Documents</Text>
        <FileUploadButton
          label="FSSAI / Business Proof"
          fileName={proofFile?.name}
          onPress={pickFile}
          accent={ACCENT}
        />
        {fieldErrors.proof && <Text style={styles.fieldErr}>{fieldErrors.proof}</Text>}

        {uploadProgress === 'uploading' && (
          <Text style={[styles.uploadStatus, { color: '#D97706' }]}>⏳ Reading file…</Text>
        )}
        {uploadProgress === 'done' && (
          <Text style={[styles.uploadStatus, { color: '#16A34A' }]}>✅ File ready to upload</Text>
        )}
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
  // section labels
  sectionLabel:  { fontSize: 11, fontWeight: '700', color: '#8C8880', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  // field errors
  fieldErr:      { fontSize: 11, color: '#DC2626', marginTop: -6, marginBottom: 8, marginLeft: 2 },
  // steps
  stepsRow:      { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  stepItem:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot:       { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum:       { fontSize: 11, fontWeight: '700' },
  stepLabel:     { fontSize: 10, marginLeft: 4, fontWeight: '600' },
  stepLine:      { flex: 1, height: 1, backgroundColor: '#E3E0D9', marginHorizontal: 6 },
  // password
  passwordRow:   { flexDirection: 'row', alignItems: 'center' },
  eyeBtn:        { marginLeft: 8, marginTop: 6, padding: 8 },
  eyeIcon:       { fontSize: 18 },
  // strength bar
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