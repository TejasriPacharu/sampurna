// src/screens/RejectedScreen.js

import useAuthStore from '../store/authStore';
import { T, PageScroll } from '../components/ui/ui';

export default function RejectedScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigation.replace('RoleSelection');
  };

  return (
    <PageScroll>
      <div style={{ minHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 8px' }}>

        <div style={{ fontSize:64, marginBottom:24 }}>🚫</div>

        <div style={{ fontSize:24, fontWeight:800, fontFamily: T.display, color:'#DC2626', marginBottom:12 }}>
          Account Rejected
        </div>

        <div style={{ color: T.muted, fontSize:14, lineHeight:1.7, maxWidth:320, marginBottom:32 }}>
          Unfortunately, your account application could not be approved at this time. This may be due to incomplete information or not meeting our verification requirements.
        </div>

        {/* Detail card */}
        <div style={{ background:'#FFFFFF', border:'1px solid #FECACA', borderRadius:16, padding:'20px 24px', width:'100%', maxWidth:320, marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #FEE2E2' }}>
            <span style={{ color: T.muted, fontSize:13 }}>Name</span>
            <span style={{ color: T.text, fontSize:13, fontWeight:600 }}>{user?.name}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
            <span style={{ color: T.muted, fontSize:13 }}>Status</span>
            <span style={{ color:'#DC2626', fontSize:13, fontWeight:700 }}>❌ Rejected</span>
          </div>
        </div>

        {/* Help box */}
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, padding:'14px 16px', width:'100%', maxWidth:320, marginBottom:32, textAlign:'left' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#DC2626', marginBottom:8 }}>What can you do?</div>
          {['Contact support at support@sampurna.org', 'Re-apply with complete and accurate information', 'Ensure your registration documents are valid'].map(t => (
            <div key={t} style={{ fontSize:12, color:'#4B4842', padding:'4px 0', display:'flex', gap:8 }}>
              <span style={{ color:'#DC2626' }}>•</span> {t}
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{ padding:'12px 32px', background:'transparent', border:'1px solid #FECACA', borderRadius:10, color:'#DC2626', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily: T.font }}
        >
          Back to Home
        </button>
      </div>
    </PageScroll>
  );
}