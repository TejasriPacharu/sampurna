// src/screens/WaitingApprovalScreen.js

import useAuthStore from '../store/authStore';
import { T, PageScroll } from '../components/ui/ui';

export default function WaitingApprovalScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    logout();
    navigation.replace('RoleSelection');
  };

  const roleColor   = user?.role === 'ngo' ? '#2563EB' : '#D97706';
  const roleLabel   = user?.role === 'ngo' ? 'NGO' : 'Delivery Partner';

  return (
    <PageScroll>
      <div style={{ minHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 8px' }}>

        {/* Animated pulse ring */}
        <div style={{ position:'relative', width:100, height:100, marginBottom:32 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              position:'absolute', inset:0, borderRadius:'50%',
              border:`2px solid ${roleColor}`,
              opacity: 0.15 + i * 0.15,
              animation: `pulse${i} ${1.5 + i * 0.4}s ease-in-out infinite`,
              transform: `scale(${0.6 + i * 0.2})`,
            }} />
          ))}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>
            {user?.role === 'ngo' ? '🤝' : '🚴'}
          </div>
        </div>

        <div style={{ fontSize:24, fontWeight:800, fontFamily: T.display, color: roleColor, marginBottom:12 }}>
          Pending Approval
        </div>

        <div style={{ color: T.muted, fontSize:14, lineHeight:1.7, maxWidth:300, marginBottom:32 }}>
          Your <strong style={{ color: '#1C1A17' }}>{roleLabel}</strong> account has been submitted.
          Our admin team will review your details and approve your access shortly.
        </div>

        {/* Status card */}
        <div style={{ background:'#FFFFFF', border:`1px solid ${roleColor}28`, borderRadius:16, padding:'20px 24px', width:'100%', maxWidth:320, marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F2F1EE' }}>
            <span style={{ color: T.muted, fontSize:13 }}>Name</span>
            <span style={{ color: T.text, fontSize:13, fontWeight:600 }}>{user?.name}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F2F1EE' }}>
            <span style={{ color: T.muted, fontSize:13 }}>Email</span>
            <span style={{ color: T.text, fontSize:13, fontWeight:600 }}>{user?.email}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
            <span style={{ color: T.muted, fontSize:13 }}>Status</span>
            <span style={{ color:'#D97706', fontSize:13, fontWeight:700 }}>⏳ Under Review</span>
          </div>
        </div>

        <div style={{ color:'#4B4842', fontSize:12, marginBottom:32, maxWidth:280 }}>
          You'll receive an email once your account is approved. This usually takes 24–48 hours.
        </div>

        <button
          onClick={handleLogout}
          style={{ padding:'10px 28px', background:'#FFFFFF', border:'1px solid #E3E0D9', borderRadius:10, color: T.muted, fontSize:13, cursor:'pointer', fontFamily: T.font }}
        >
          Sign out
        </button>
      </div>

      <style>{`
        @keyframes pulse1 { 0%,100%{transform:scale(0.8);opacity:0.3} 50%{transform:scale(1.05);opacity:0.1} }
        @keyframes pulse2 { 0%,100%{transform:scale(1.0);opacity:0.2} 50%{transform:scale(1.2);opacity:0.08} }
        @keyframes pulse3 { 0%,100%{transform:scale(1.2);opacity:0.1} 50%{transform:scale(1.4);opacity:0.04} }
      `}</style>
    </PageScroll>
  );
}