// src/components/ui/FormComponents.js
// Reusable, minimal form components shared across all signup screens
// ── LIGHT THEME ─────────────────────────────────────────────────

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
          error   && styles.inputError,
          multiline && { minHeight: 80, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#8C8880"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
      />
      {error && <Text style={styles.inlineError}>{error}</Text>}
    </View>
  );
}

// ── File Upload Button ───────────────────────────────────────────
export function FileUploadButton({ label, fileName, onPress, accent = '#16A34A' }) {
  const hasFile = Boolean(fileName);
  return (
    <View style={styles.fieldWrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.uploadBtn,
          hasFile
            ? { borderColor: accent, borderStyle: 'solid', backgroundColor: accent + '0D' }
            : { borderColor: '#D6D2CA', borderStyle: 'dashed' },
        ]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 18 }}>{hasFile ? '📎' : '📁'}</Text>
        <Text style={[styles.uploadText, hasFile && { color: accent, fontWeight: '600' }]}
              numberOfLines={1}>
          {hasFile ? fileName : 'Tap to upload document'}
        </Text>
        {hasFile && (
          <View style={[styles.uploadBadge, { backgroundColor: accent + '15', borderColor: accent + '40' }]}>
            <Text style={[styles.uploadBadgeText, { color: accent }]}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ── Primary Button ───────────────────────────────────────────────
export function PrimaryButton({ label, onPress, loading = false, accent = '#16A34A' }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: loading ? accent + 'AA' : accent }]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      {loading
        ? <ActivityIndicator color="#FFFFFF" />
        : <Text style={styles.primaryBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Screen Header ────────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, onBack, accent = '#16A34A' }) {
  return (
    <View style={styles.headerWrapper}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backArrow, { color: accent }]}>←</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.screenTitle, { color: '#1C1A17' }]}>{title}</Text>
      {subtitle && <Text style={styles.screenSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ── Error Banner ─────────────────────────────────────────────────
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerIcon}>⚠️</Text>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Field wrapper ────────────────────────────────────────────
  fieldWrapper: {
    marginBottom: 14,
  },
  label: {
    color: '#4B4842',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  // ── TextInput ────────────────────────────────────────────────
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6D2CA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#1C1A17',
    fontSize: 14,
    shadowColor: '#1C1A17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inlineError: {
    color: '#DC2626',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },

  // ── File upload ──────────────────────────────────────────────
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#1C1A17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  uploadText: {
    flex: 1,
    color: '#8C8880',
    fontSize: 14,
  },
  uploadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  uploadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Primary button ───────────────────────────────────────────
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1C1A17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Screen header ────────────────────────────────────────────
  headerWrapper: {
    paddingTop: 16,
    paddingBottom: 28,
  },
  backBtn: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 24,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#1C1A17',
  },
  screenSubtitle: {
    color: '#8C8880',
    fontSize: 13,
    marginTop: 4,
  },

  // ── Error banner ─────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerIcon: {
    fontSize: 14,
    flexShrink: 0,
  },
  errorBannerText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 18,
  },
});