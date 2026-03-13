// src/screens/auth/LoginScreen.js

import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import { T, Input, PrimaryButton, ErrorBox, PageScroll } from '../../components/ui/ui';

export default function LoginScreen({ navigation }) {
  const { login } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const account = await login(email.trim(), password);
      // Route based on status ─────────────────────────────────────
      if (account.status === 'pending') {
        navigation.replace('WaitingApproval');
      } else if (account.status === 'rejected') {
        navigation.replace('Rejected');
      } else {
        // approved → go to role dashboard
        const dest =
          account.role === 'donor'
            ? 'DonorDashboard'
            : account.role === 'ngo'
            ? 'NGODashboard'
            : account.role === 'admin'
            ? 'AdminDashboard'
            : 'DeliveryDashboard';

        navigation.replace(dest);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageScroll>
      {/* Header */}
      <div style={{ paddingTop:60, paddingBottom:40, textAlign:'center' }}>
        <div style={{ fontSize:40, fontWeight:800, fontFamily: T.display, color:'#16A34A', letterSpacing:'-1.5px' }}>sampurna</div>
        <div style={{ color: T.muted, fontSize:14, marginTop:8 }}>Sign in to your account</div>
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <ErrorBox message={error} />

      <PrimaryButton
        label={loading ? 'Signing in…' : 'Sign In'}
        accent="#4ADE80"
        onClick={handleLogin}
        disabled={loading}
      />

      {/* Demo hint */}
      <div style={{ marginTop:24, background:'#FFFFFF', border:'1px solid #E3E0D9', borderRadius:12, padding:16 }}>
        <div style={{ fontSize:11, color: T.muted, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>Demo accounts (password: 1234)</div>
        {[
          ['arjun@donor.com',   '🌱 Donor (approved)'],
          ['hope@ngo.com',      '🤝 NGO (approved)'],
          ['ravi@delivery.com', '🚴 Delivery (approved)'],
          ['green@ngo.com',     '🤝 NGO (pending)'],
          ['bad@delivery.com',  '🚴 Delivery (rejected)'],
        ].map(([em, label]) => (
          <div
            key={em}
            onClick={() => { setEmail(em); setPassword('1234'); }}
            style={{ padding:'6px 0', fontSize:12, color:'#4B4842', cursor:'pointer', borderBottom:'1px solid #F2F1EE', display:'flex', justifyContent:'space-between' }}
          >
            <span>{label}</span>
            <span style={{ color:'#4B4842' }}>{em}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign:'center', marginTop:28, color: T.muted, fontSize:13 }}>
        Don't have an account?{' '}
        <span
          onClick={() => navigation.navigate('RoleSelection')}
          style={{ color:'#16A34A', cursor:'pointer', fontWeight:600 }}
        >
          Sign up
        </span>
      </div>
    </PageScroll>
  );
}