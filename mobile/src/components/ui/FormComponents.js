// src/components/ui/FormComponents.js
// Reusable, minimal form components shared across all signup screens

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';

// ── Text Input ──────────────────────────────────────────────────
export function InputField({
  label, placeholder, value, onChangeText,
  secureTextEntry = false, keyboardType = 'default',
  multiline = false, error = null,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error  && styles.inputError,
          multiline && { height: 80, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ── File Upload Button ───────────────────────────────────────────
export function FileUploadButton({ label, fileName, onPress, accent = '#4ADE80' }) {
  return (
    <View style={styles.fieldWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.uploadBtn, { borderColor: accent + '55' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 18 }}>{fileName ? '📎' : '📁'}</Text>
        <Text style={[styles.uploadText, fileName && { color: accent }]}>
          {fileName || 'Tap to upload document'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Primary Button ───────────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading = false, accent = '#4ADE80' }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: accent }, loading && styles.btnDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color="#000" />
        : <Text style={styles.primaryBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Screen Header ────────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, onBack, accent = '#4ADE80' }) {
  return (
    <View style={styles.headerWrapper}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: accent }]}>←</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.screenTitle, { color: accent }]}>{title}</Text>
      {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Error Banner ─────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>⚠ {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    marginBottom: 14,
  },
  label: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#E5E5E5',
    fontSize: 15,
  },
  inputFocused: {
    borderColor: '#4ADE8055',
    backgroundColor: '#141414',
  },
  inputError: {
    borderColor: '#EF444466',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  uploadText: {
    color: '#555',
    fontSize: 14,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerWrapper: {
    paddingTop: 16,
    paddingBottom: 28,
  },
  backBtn: {
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderColor: '#EF444433',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 13,
  },
});