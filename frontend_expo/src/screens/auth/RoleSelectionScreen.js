// src/screens/auth/RoleSelectionScreen.js

import { useState } from 'react';
import { T } from '../../components/ui/ui';

const ROLES = [
  { role: 'donor',    icon: '🌱', label: 'Donor',    accent: '#4ADE80', desc: 'Share surplus food' },
  { role: 'ngo',      icon: '🤝', label: 'NGO',      accent: '#60A5FA', desc: 'Claim food for communities' },
  { role: 'delivery', icon: '🚴', label: 'Delivery',  accent: '#FBBF24', desc: 'Pick up & deliver food' },
];

export default function RoleSelectionScreen({ navigation }) {
  // navigation.navigate('DonorSignup', { role })  etc.
  // In web preview we accept an onSelect prop instead.
  const onSelect = navigation?.navigate
    ? (role) => navigation.navigate(`${capitalize(role)}Signup`, { role })
    : navigation?.onSelect;

  return (
    <div style={{ minHeight:'100vh', background: T.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily: T.font }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ marginBottom:40, textAlign:'center' }}>
        <div style={{ fontSize:13, letterSpacing:'4px', color:'#8C8880', textTransform:'uppercase', marginBottom:8 }}>Welcome to</div>
        <div style={{ fontSize:52, fontWeight:800, fontFamily: T.display, color:'#16A34A', letterSpacing:'-2px', lineHeight:1 }}>sampurna</div>
        <div style={{ color:'#4B4842', fontSize:14, marginTop:10 }}>Connecting surplus food with those who need it</div>
      </div>

      <div style={{ fontSize:12, color:'#4B4842', textTransform:'uppercase', letterSpacing:'2px', marginBottom:20 }}>I am a…</div>

      <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' }}>
        {ROLES.map(r => (
          <RoleCard key={r.role} {...r} onSelect={() => onSelect(r.role)} />
        ))}
      </div>

      <div style={{ marginTop:36, color:'#1C1A17', fontSize:13 }}>
        Already have an account?{' '}
        <span
          onClick={() => navigation?.navigate?.('Login') || navigation?.onLogin?.()}
          style={{ color:'#16A34A', cursor:'pointer', fontWeight:600 }}
        >
          Sign in
        </span>
      </div>
    </div>
  );
}

function RoleCard({ icon, label, accent, desc, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background:'#FFFFFF', border:`1.5px solid ${hov ? accent : accent + '28'}`, borderRadius:20,
        padding:'28px 28px 24px', cursor:'pointer', textAlign:'center', width:160,
        transform: hov ? 'translateY(-6px)' : '', transition:'all 0.2s',
        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
        boxShadow: hov ? `0 16px 40px ${accent}20` : 'none' }}
    >
      <div style={{ fontSize:38 }}>{icon}</div>
      <div style={{ color: accent, fontWeight:800, fontSize:17, fontFamily: T.display }}>{label}</div>
      <div style={{ color:'#6B6860', fontSize:11, lineHeight:1.4 }}>{desc}</div>
    </button>
  );
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }