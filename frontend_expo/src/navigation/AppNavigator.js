// src/navigation/AppNavigator.js

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import useAuthStore from '../store/authStore';

// Auth Screens
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import LoginScreen         from '../screens/auth/LoginScreen';
import DonorSignupScreen   from '../screens/auth/DonorSignupScreen';
import NGOSignupScreen     from '../screens/auth/NGOSignupScreen';
import DeliverySignupScreen from '../screens/auth/DeliverySignupScreen';

// Waiting / Status
import WaitingApprovalScreen from '../screens/WaitingApprovalScreen';
import RejectedScreen        from '../screens/RejectedScreen';

// Role Dashboards
import DonorDashboard    from '../screens/dashboards/DonorDashboard';
import NGODashboard      from '../screens/dashboards/NGODashboard';
import DeliveryDashboard from '../screens/dashboards/DeliveryDashboard';

// Admin
import AdminDashboard      from '../screens/admin/AdminDashboard';
//import AdminUserDetail     from '../screens/admin/AdminUserDetail';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  animation: 'fade_from_bottom',
};

// ─── Routing Logic ─────────────────────────────────────────────────
function getInitialRoute(user) {
  if (!user) return 'RoleSelection';

  if (user.role === 'admin') return 'AdminDashboard';

  if (user.status === 'pending')  return 'WaitingApproval';
  if (user.status === 'rejected') return 'Rejected';
  if (user.status === 'approved') {
    if (user.role === 'donor')    return 'DonorDashboard';
    if (user.role === 'ngo')      return 'NGODashboard';
    if (user.role === 'delivery') return 'DeliveryDashboard';
  }

  return 'RoleSelection';
}

export default function AppNavigator() {
  const { user, isLoading, loadUser } = useAuthStore();

  useEffect(() => { loadUser(); }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  const initialRouteName = getInitialRoute(user);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={screenOptions}>

        {/* ── Auth ──────────────────────── */}
        <Stack.Screen name="RoleSelection"     component={RoleSelectionScreen} />
        <Stack.Screen name="Login"             component={LoginScreen} />
        <Stack.Screen name="DonorSignup"       component={DonorSignupScreen} />
        <Stack.Screen name="NGOSignup"         component={NGOSignupScreen} />
        <Stack.Screen name="DeliverySignup"    component={DeliverySignupScreen} />

        {/* ── Status ────────────────────── */}
        <Stack.Screen name="WaitingApproval"   component={WaitingApprovalScreen} />
        <Stack.Screen name="Rejected"          component={RejectedScreen} />

        {/* ── Dashboards ────────────────── */}
        <Stack.Screen name="DonorDashboard"    component={DonorDashboard} />
        <Stack.Screen name="NGODashboard"      component={NGODashboard} />
        <Stack.Screen name="DeliveryDashboard" component={DeliveryDashboard} />

        {/* ── Admin ─────────────────────── */}
        <Stack.Screen name="AdminDashboard"    component={AdminDashboard} />
        {/*<Stack.Screen name="AdminUserDetail"   component={AdminUserDetail} />*/}

      </Stack.Navigator>
    </NavigationContainer>
  );
}