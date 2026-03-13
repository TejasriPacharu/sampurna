// src/screens/admin/AdminDashboard.js
// ✅ Crisis chat: admin can open a chat room for any issue, message all parties
// ✅ Issues tab: auto-issued (expired food) + manual issues, with chat access
// ✅ Full tracking across all listing statuses

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, TouchableOpacity, RefreshControl,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';

import {
  adminGetUsers, adminGetStats, adminUpdateUserStatus,
  getAvailableListings, getNGOClaims, getMyActiveDeliveries,
} from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import { subscribeIssues, resolveIssue } from '../../store/issueStore';
import { sendMessage, subscribeRoom, markRoomRead, subscribeGlobal } from '../../store/chatStore';

const RC  = { donor:'#4ADE80', ngo:'#60A5FA', delivery:'#FBBF24' };
const RI  = { donor:'🏨',      ngo:'🤝',      delivery:'🚴'      };
const USC = { pending:'#FBBF24', approved:'#4ADE80', rejected:'#EF4444' };
const LSC = { active:'#4ADE80', claimed:'#60A5FA', picked_up:'#FBBF24', delivered:'#A78BFA', expired:'#EF4444' };
const LSI = { active:'🟢', claimed:'🔵', picked_up:'🟡', delivered:'✅', expired:'🔴' };
const STEPS       = ['active','claimed','picked_up','delivered'];
const STEP_LABELS = ['Listed','Claimed','Picked up','Delivered'];
const ROLE_COLOR  = { donor:'#4ADE80', ngo:'#60A5FA', delivery:'#FBBF24', admin:'#A78BFA', system:'#444' };
const ROLE_ICON   = { donor:'🌱', ngo:'🤝', delivery:'🚴', admin:'🛡', system:'⚙️' };

// ── Inline chat room (used inside bottom sheet for admin) ─────────
function ChatRoom({ issueId, currentUserName }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!issueId) return;
    markRoomRead(issueId);
    const unsub = subscribeRoom(issueId, msgs => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollToEnd?.({ animated:true }), 80);
    });
    return unsub;
  }, [issueId]);

  const send = () => {
    if (!text.trim()) return;
    sendMessage({
      issueId,
      listingId:  '',
      senderName: currentUserName || 'Admin',
      senderRole: 'admin',
      text,
    });
    setText('');
  };

  return (
    <View style={{ flex:1 }}>
      <ScrollView
        ref={bottomRef}
        style={{ flex:1, backgroundColor:'#F2F1EE', borderRadius:10, padding:10, minHeight:200, maxHeight:300 }}
        contentContainerStyle={{ paddingBottom:4 }}>
        {messages.length === 0 && (
          <Text style={{ textAlign:'center', color:'#6B6860', fontSize:12, paddingVertical:20 }}>
            No messages yet. Start the conversation.
          </Text>
        )}
        {messages.map(m => {
          const isMe = m.senderRole === 'admin';
          const col  = ROLE_COLOR[m.senderRole] || '#888';
          return (
            <View key={String(m.id)} style={{ flexDirection: isMe ? 'row-reverse' : 'row',
              gap:8, marginBottom:10, alignItems:'flex-start' }}>
              <View style={{ width:26, height:26, borderRadius:13,
                backgroundColor: col + '25',
                alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Text style={{ fontSize:12 }}>{ROLE_ICON[m.senderRole] || '👤'}</Text>
              </View>
              <View style={{ maxWidth:'72%' }}>
                <Text style={{ fontSize:9, color:'#6B6860', marginBottom:2,
                  textAlign: isMe ? 'right' : 'left' }}>
                  <Text style={{ color: col, fontWeight:'700' }}>{m.senderName}</Text>
                  {' · '}{new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </Text>
                <View style={{
                  backgroundColor: m.senderRole === 'system' ? '#E3E0D9'
                    : isMe ? '#A78BFA25' : '#1C1A17',
                  borderWidth:1,
                  borderColor: m.senderRole === 'system' ? '#D6D2CA'
                    : isMe ? '#A78BFA50' : '#D6D2CA',
                  borderRadius: isMe ? 12 : 12,
                  padding:10,
                }}>
                  <Text style={{ fontSize: m.senderRole==='system' ? 11 : 13,
                    color: m.senderRole==='system' ? '#8C8880' : '#1C1A17',
                    fontStyle: m.senderRole==='system' ? 'italic' : 'normal',
                    lineHeight:18 }}>
                    {m.text}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
        <TextInput
          style={{ flex:1, backgroundColor:'#F2F1EE', borderRadius:10, borderWidth:1,
            borderColor:'#D6D2CA', color:'#1C1A17', padding:12, fontSize:13 }}
          placeholder="Admin message…"
          placeholderTextColor="#3A3A3A"
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={send}
          style={{ paddingHorizontal:18, backgroundColor:'#A78BFA25',
            borderWidth:1, borderColor:'#A78BFA50',
            borderRadius:10, justifyContent:'center' }} activeOpacity={0.8}>
          <Text style={{ color:'#7C3AED', fontWeight:'700', fontSize:13 }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────
function Tile({ label, value, color }) {
  return (
    <View style={[S.tile, { borderColor: color+'33' }]}>
      <Text style={[S.tileN, { color }]}>{value ?? 0}</Text>
      <Text style={S.tileL}>{label}</Text>
    </View>
  );
}

function SegPills({ active, onChange, items }) {
  return (
    <View style={S.segWrap}>
      {items.map(it => (
        <TouchableOpacity key={it.k}
          style={[S.seg, active === it.k && S.segOn]}
          onPress={() => onChange(it.k)} activeOpacity={0.8}>
          <Text style={[S.segTx, active === it.k && S.segTxOn]}>{it.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function JourneyLabeled({ status, color }) {
  const idx = STEPS.indexOf(status);
  return (
    <View style={{ marginTop:10 }}>
      <View style={{ flexDirection:'row', alignItems:'center' }}>
        {STEPS.map((_, i) => {
          const done = i <= idx;
          return (
            <View key={i} style={{ flexDirection:'row', alignItems:'center', flex:1 }}>
              <View style={{ width:10, height:10, borderRadius:5,
                backgroundColor: done ? color : '#D6D2CA',
                borderWidth: i===idx ? 2 : 0, borderColor: color+'80' }} />
              {i < 3 && (
                <View style={{ flex:1, height:2, marginHorizontal:2,
                  backgroundColor: (done && i < idx) ? color : '#D6D2CA' }} />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection:'row', marginTop:4 }}>
        {STEP_LABELS.map((lb, i) => (
          <View key={lb} style={{ flex:1 }}>
            <Text style={{ fontSize:8, color: i<=idx ? color : '#4B4842',
              fontWeight: i===idx ? '700' : '400' }} numberOfLines={1}>{lb}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PartyBlock({ color, icon, role, name, address, phone }) {
  return (
    <View style={[S.party, { borderColor: color+'35' }]}>
      <Text style={{ fontSize:10, color, fontWeight:'700', marginBottom:3 }}>
        {icon}{' '}{role}
      </Text>
      <Text style={{ fontSize:13, color:'#1C1A17', fontWeight:'600' }}>{name || '—'}</Text>
      {!!address && <Text style={{ fontSize:11, color:'#6B6860', marginTop:2 }}>📍 {address}</Text>}
      {!!phone   && <Text style={{ fontSize:11, color:'#2563EB', marginTop:2 }}>📞 {phone}</Text>}
    </View>
  );
}

function ListingCard({ listing: l, onView }) {
  const n     = normL(l);
  const color = LSC[l.status] || '#888';
  return (
    <TouchableOpacity style={[S.card, { borderColor: color+'28' }]}
      onPress={() => onView(l)} activeOpacity={0.8}>
      <View style={S.cRow}>
        <View style={[S.cIcon, { backgroundColor: color+'15' }]}>
          <Text style={{ fontSize:20 }}>{LSI[l.status] || '•'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={S.cName} numberOfLines={1}>{n.foodType || '—'}</Text>
          <Text style={{ fontSize:11, color:'#16A34A', marginTop:2 }}>
            {'🌱 '}{n.donorName || 'Unknown'}
          </Text>
          {!!n.claimedByName && (
            <Text style={{ fontSize:11, color:'#2563EB', marginTop:1 }}>
              {'🤝 '}{n.claimedByName}
              {!!n.ngoLocation ? ' · ' + n.ngoLocation.split(',')[0] : ' · No address'}
            </Text>
          )}
          {!!n.deliveryName && (
            <Text style={{ fontSize:11, color:'#D97706', marginTop:1 }}>
              {'🚴 '}{n.deliveryName}
            </Text>
          )}
        </View>
        <View style={[S.badge, { backgroundColor: color+'20' }]}>
          <Text style={[S.badgeTx, { color }]}>{(l.status||'').replace('_',' ')}</Text>
        </View>
      </View>
      <JourneyLabeled status={l.status} color={color} />
    </TouchableOpacity>
  );
}

function UserCard({ user, onApprove, onReject, onView }) {
  const c = RC[user.role] || '#888';
  const name = user.profile?.org_name || user.profile?.ngo_name || user.profile?.full_name || user.email;
  return (
    <TouchableOpacity style={S.card} onPress={() => onView(user)} activeOpacity={0.8}>
      <View style={S.cRow}>
        <View style={[S.cIcon, { backgroundColor: c+'15' }]}>
          <Text style={{ fontSize:20 }}>{RI[user.role] || '👤'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={S.cName} numberOfLines={1}>{name}</Text>
          <Text style={S.cSub}>{user.email}</Text>
          <Text style={[S.cRole, { color:c }]}>{user.role.toUpperCase()}</Text>
        </View>
        <View style={[S.badge, { backgroundColor: USC[user.status]+'20' }]}>
          <Text style={[S.badgeTx, { color: USC[user.status] }]}>{user.status}</Text>
        </View>
      </View>
      {user.status === 'pending' && (
        <View style={S.cActions}>
          <TouchableOpacity style={S.rejBtn} onPress={() => onReject(user.id)} activeOpacity={0.8}>
            <Text style={S.rejTx}>✕ Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.appBtn} onPress={() => onApprove(user.id)} activeOpacity={0.8}>
            <Text style={S.appTx}>✓ Approve</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

function IssueCard({ issue, chatUnread, onResolve, onOpenChat }) {
  const open = issue.status === 'open';
  return (
    <View style={[S.card, { borderColor: open ? '#EF444430' : '#4ADE8022' }]}>
      <View style={S.cRow}>
        <View style={[S.cIcon, { backgroundColor: open ? '#EF444415' : '#4ADE8015' }]}>
          <Text style={{ fontSize:20 }}>{issue.isAuto ? '⏰' : open ? '🚨' : '✅'}</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={S.cName} numberOfLines={1}>{issue.foodType}</Text>
          <Text style={S.cSub}>{'🚴 '}{issue.deliveryName}</Text>
          {issue.isAuto && (
            <Text style={{ fontSize:10, color:'#D97706', marginTop:2, fontWeight:'700' }}>
              ⏰ AUTO — food expired during delivery
            </Text>
          )}
          <Text style={{ fontSize:12, color:'#8C8880', marginTop:3 }} numberOfLines={2}>
            {issue.reason}
          </Text>
        </View>
        <View style={[S.badge, { backgroundColor: open ? '#EF444420' : '#4ADE8020' }]}>
          <Text style={[S.badgeTx, { color: open ? '#EF4444' : '#4ADE80' }]}>
            {open ? 'OPEN' : 'DONE'}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize:10, color:'#6B6860', marginTop:8 }}>
        {'🕐 '}{new Date(issue.raisedAt).toLocaleString()}
      </Text>

      {!!issue.adminNote && (
        <View style={{ marginTop:8, backgroundColor:'#4ADE8010', borderRadius:8, padding:10,
          borderWidth:1, borderColor:'#4ADE8025' }}>
          <Text style={{ fontSize:10, color:'#16A34A', fontWeight:'700', marginBottom:2 }}>Admin note</Text>
          <Text style={{ fontSize:12, color:'#ccc' }}>{issue.adminNote}</Text>
        </View>
      )}

      <View style={{ flexDirection:'row', gap:8, marginTop:14 }}>
        {/* Chat button with unread badge */}
        <TouchableOpacity
          style={[S.chatBtn, { position:'relative' }]}
          onPress={() => onOpenChat(issue)} activeOpacity={0.8}>
          <Text style={{ color:'#7C3AED', fontWeight:'700', fontSize:13 }}>
            💬 Chat{chatUnread > 0 ? ` (${chatUnread})` : ''}
          </Text>
        </TouchableOpacity>

        {open && (
          <TouchableOpacity style={S.resolveBtn} onPress={() => onResolve(issue)} activeOpacity={0.8}>
            <Text style={{ color:'#16A34A', fontSize:13, fontWeight:'700' }}>✓ Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function normL(l) {
  if (!l) return l;
  return {
    ...l,
    foodType:      l.foodType      || l.food_type     || '',
    donorName:     l.donorName     || l.donor_name     || '',
    donorPhone:    l.donorPhone    || l.donor_phone    || '',
    donorLocation: l.donorLocation || l.donor_location || l.location || '',
    claimedByName: l.claimedByName || l.claimed_by_name || '',
    ngoLocation:   l.ngoLocation   || l.ngo_location   || '',
    ngoPhone:      l.ngoPhone      || l.ngo_phone      || '',
    deliveryName:  l.deliveryName  || l.delivery_name  || '',
    deliveryPhone: l.deliveryPhone || l.delivery_phone || '',
  };
}

function Sheet({ visible, title, onClose, children }) {
  if (!visible) return null;
  return (
    <View style={S.overlay}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={S.sheet}>
        <View style={S.sheetHead}>
          <Text style={S.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize:18, color:'#8C8880', padding:4 }}>✕</Text>
          </TouchableOpacity>
        </View>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function AdminDashboard({ navigation }) {
  const { logout, listings: storeListings } = useAuthStore();

  const [users,       setUsers]      = useState([]);
  const [stats,       setStats]      = useState(null);
  const [userFilter,  setUserFilter] = useState('pending');
  const [refreshing,  setRefreshing] = useState(false);
  const [tab,         setTab]        = useState('users');

  const [allListings, setAllListings] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listFilter,  setListFilter]  = useState('all');
  const [selListing,  setSelListing]  = useState(null);
  const [listModal,   setListModal]   = useState(false);

  const [issues,       setIssues]       = useState([]);
  const [issFilter,    setIssFilter]    = useState('open');
  const [resolveModal, setResolveModal] = useState(false);
  const [activeIssue,  setActiveIssue]  = useState(null);
  const [adminNote,    setAdminNote]    = useState('');

  // Chat state
  const [chatModal,    setChatModal]    = useState(false);
  const [chatIssue,    setChatIssue]    = useState(null);
  const [chatBadges,   setChatBadges]   = useState([]);  // global unread

  const { user } = useAuthStore();

  // Subscribe to issues
  useEffect(() => {
    const unsub = subscribeIssues(setIssues);
    return unsub;
  }, []);

  // Subscribe to global chat badges (for unread counts on issue cards)
  useEffect(() => {
    const unsub = subscribeGlobal(setChatBadges);
    return unsub;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [ur, sr] = await Promise.all([
        adminGetUsers({ status: userFilter }),
        adminGetStats(),
      ]);
      setUsers(ur.results ?? []);
      setStats(sr);
    } catch (e) { console.error('fetchData:', e); }
  }, [userFilter]);

  const fetchListings = useCallback(async () => {
    setListLoading(true);
    const storeData = (storeListings || []).map(normL);
    if (storeData.length > 0) setAllListings(storeData);
    try {
      const [active, claimed, inProgress] = await Promise.all([
        getAvailableListings({}),
        getNGOClaims({}),
        getMyActiveDeliveries(),
      ]);
      const merged = [
        ...(active?.results     || active     || []),
        ...(claimed?.results    || claimed    || []),
        ...(inProgress?.results || inProgress || []),
      ].map(normL);
      const byId = {};
      storeData.forEach(l => { if (l?.id) byId[l.id] = l; });
      merged.forEach(l => { if (l?.id) byId[l.id] = { ...byId[l.id], ...l }; });
      if (Object.keys(byId).length > 0) setAllListings(Object.values(byId));
    } catch (e) { console.error('fetchListings:', e); }
    finally { setListLoading(false); }
  }, [storeListings]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (tab === 'listings' || tab === 'live') fetchListings();
  }, [tab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (tab === 'listings' || tab === 'live') await fetchListings();
    setRefreshing(false);
  };

  const handleApprove = async (id) => { try { await adminUpdateUserStatus(id,'approved'); fetchData(); } catch {} };
  const handleReject  = async (id) => { try { await adminUpdateUserStatus(id,'rejected'); fetchData(); } catch {} };
  const handleLogout  = async () => { await logout(); navigation.replace('RoleSelection'); };

  const openResolve = (issue) => { setActiveIssue(issue); setAdminNote(''); setResolveModal(true); };
  const confirmResolve = () => {
    resolveIssue(activeIssue.id, adminNote);
    setResolveModal(false); setActiveIssue(null);
  };

  const openChat = (issue) => { setChatIssue(issue); setChatModal(true); };

  const displayListings = listFilter === 'all'
    ? allListings : allListings.filter(l => l.status === listFilter);
  const liveListings = allListings.filter(l => ['active','claimed','picked_up'].includes(l.status));
  const displayIssues  = issFilter === 'all'
    ? issues : issues.filter(i => i.status === issFilter);
  const openCount  = issues.filter(i => i.status === 'open').length;
  const totalChatUnread = chatBadges.reduce((s, r) => s + r.unread, 0);
  const mealsSaved = allListings.filter(l => l.status === 'delivered')
    .reduce((a, l) => a + (Number(l.quantity)||0), 0);

  const getIssueUnread = (issueId) => {
    const r = chatBadges.find(b => b.issueId === String(issueId));
    return r?.unread || 0;
  };

  const NAV = [
    { k:'users',    icon:'👥', label:'Users'    },
    { k:'listings', icon:'🍱', label:'All Food' },
    { k:'live',     icon:'🔴', label:'Live'     },
    { k:'issues',   icon:'⚠️', label:'Issues', badge: openCount || null },
    { k:'chat',     icon:'💬', label:'Chat',   badge: totalChatUnread || null },
  ];

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={S.header}>
        <View>
          <Text style={S.hTitle}>Admin Panel</Text>
          <Text style={S.hSub}>sampurna</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={S.logoutBtn}>
          <Text style={{ color:'#6B6860', fontSize:12 }}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={S.row}>
          <Tile label="Pending"  value={stats.total_pending}        color="#FBBF24" />
          <Tile label="Donors"   value={stats.donor?.approved ?? 0} color="#4ADE80" />
          <Tile label="NGOs"     value={stats.ngo?.approved   ?? 0} color="#60A5FA" />
          <Tile label="🍽 Saved" value={mealsSaved}                 color="#A78BFA" />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal:20, marginBottom:10, flexGrow:0 }}
        contentContainerStyle={{ gap:6 }}>
        {NAV.map(t => (
          <TouchableOpacity key={t.k}
            style={[S.navPill, tab === t.k && S.navPillOn]}
            onPress={() => setTab(t.k)} activeOpacity={0.8}>
            <Text style={{ fontSize:14 }}>{t.icon}</Text>
            <Text style={[S.navTx, tab === t.k && S.navTxOn]}>{t.label}</Text>
            {t.badge != null && (
              <View style={S.navBadge}>
                <Text style={{ fontSize:9, color:'#fff', fontWeight:'700' }}>{String(t.badge)}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <>
          <SegPills active={userFilter} onChange={setUserFilter} items={[
            { k:'pending',  label:'Pending'  },
            { k:'approved', label:'Approved' },
            { k:'rejected', label:'Rejected' },
          ]} />
          <FlatList data={users} keyExtractor={i => i.id.toString()}
            contentContainerStyle={S.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ADE80" />}
            renderItem={({ item }) => (
              <UserCard user={item} onApprove={handleApprove} onReject={handleReject}
                onView={u => navigation.navigate('AdminUserDetail', { user: u })} />
            )}
            ListEmptyComponent={<View style={S.empty}><Text style={S.emptyTx}>No {userFilter} users</Text></View>}
          />
        </>
      )}

      {/* ── ALL LISTINGS ── */}
      {tab === 'listings' && (
        <>
          <View style={[S.row, { marginBottom:10 }]}>
            {[['🟢','active','Active','#4ADE80'],['🔵','claimed','Claimed','#60A5FA'],
              ['🟡','picked_up','On Way','#FBBF24'],['✅','delivered','Done','#A78BFA']].map(([ic,st,lb,col]) => (
              <TouchableOpacity key={st}
                style={[S.miniTile, { borderColor:col+'30' }, listFilter===st && { backgroundColor:col+'15' }]}
                onPress={() => setListFilter(listFilter===st?'all':st)}>
                <Text style={{ fontSize:16, fontWeight:'800', color:col }}>
                  {allListings.filter(l=>l.status===st).length}
                </Text>
                <Text style={{ fontSize:9, color:'#8C8880', marginTop:1 }}>{ic} {lb}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal:20, marginBottom:10, flexGrow:0 }}
            contentContainerStyle={{ gap:6 }}>
            {['all','active','claimed','picked_up','delivered','expired'].map(f => (
              <TouchableOpacity key={f} onPress={() => setListFilter(f)}
                style={[S.fPill, listFilter===f && S.fPillOn]}>
                <Text style={[S.fPillTx, listFilter===f && S.fPillTxOn]}>
                  {f==='all'?'All':f.replace('_',' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList data={displayListings} keyExtractor={i => String(i.id)}
            contentContainerStyle={S.list}
            refreshControl={<RefreshControl refreshing={listLoading} onRefresh={fetchListings} tintColor="#4ADE80" />}
            renderItem={({ item }) => (
              <ListingCard listing={item} onView={l => { setSelListing(l); setListModal(true); }} />
            )}
            ListEmptyComponent={<View style={S.empty}><Text style={S.emptyTx}>{listLoading?'Loading…':'No listings'}</Text></View>}
          />
        </>
      )}

      {/* ── LIVE ── */}
      {tab === 'live' && (
        <>
          <View style={S.row}>
            {[['Active',allListings.filter(l=>l.status==='active').length,'#4ADE80'],
              ['Claimed',allListings.filter(l=>l.status==='claimed').length,'#60A5FA'],
              ['On Way',allListings.filter(l=>l.status==='picked_up').length,'#FBBF24'],
              ['Delivered',allListings.filter(l=>l.status==='delivered').length,'#A78BFA']].map(([lb,val,c]) => (
              <Tile key={lb} label={lb} value={val} color={c} />
            ))}
          </View>
          <FlatList data={liveListings} keyExtractor={i => String(i.id)}
            contentContainerStyle={S.list}
            refreshControl={<RefreshControl refreshing={listLoading} onRefresh={fetchListings} tintColor="#4ADE80" />}
            renderItem={({ item: l }) => {
              const n = normL(l); const color = LSC[l.status]||'#888';
              return (
                <TouchableOpacity style={[S.card, { borderColor: color+'30' }]}
                  onPress={() => { setSelListing(l); setListModal(true); }} activeOpacity={0.8}>
                  <View style={S.cRow}>
                    <Text style={{ fontSize:22, width:36 }}>{LSI[l.status]}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={S.cName}>{n.foodType}</Text>
                      <Text style={{ fontSize:11, color:'#16A34A', marginTop:2 }}>{'🌱 '}{n.donorName}</Text>
                      {!!n.claimedByName
                        ? <Text style={{ fontSize:11, color:'#2563EB', marginTop:1 }}>
                            {'🤝 '}{n.claimedByName}{!!n.ngoLocation?' · '+n.ngoLocation.split(',')[0]:' · No address'}
                          </Text>
                        : <Text style={{ fontSize:11, color:'#4B4842', marginTop:1 }}>🤝 Unclaimed</Text>
                      }
                      {!!n.deliveryName && <Text style={{ fontSize:11, color:'#D97706', marginTop:1 }}>{'🚴 '}{n.deliveryName}</Text>}
                    </View>
                    <View style={[S.badge, { backgroundColor: color+'20' }]}>
                      <Text style={[S.badgeTx, { color }]}>{(l.status||'').replace('_',' ')}</Text>
                    </View>
                  </View>
                  <JourneyLabeled status={l.status} color={color} />
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={<View style={S.empty}><Text style={S.emptyTx}>{listLoading?'Loading…':'No active deliveries'}</Text></View>}
          />
        </>
      )}

      {/* ── ISSUES ── */}
      {tab === 'issues' && (
        <>
          <View style={{ flexDirection:'row', alignItems:'center',
            marginHorizontal:20, marginBottom:8, marginTop:2 }}>
            <Text style={S.sLabel2}>⚠️ Delivery Issues</Text>
            {openCount > 0 && (
              <View style={[S.navBadge, { marginLeft:8, paddingHorizontal:7 }]}>
                <Text style={{ fontSize:10, color:'#fff', fontWeight:'700' }}>
                  {openCount}{' open'}
                </Text>
              </View>
            )}
          </View>
          <SegPills active={issFilter} onChange={setIssFilter} items={[
            { k:'open',     label:'🚨 Open'     },
            { k:'resolved', label:'✅ Resolved' },
            { k:'all',      label:'All'         },
          ]} />
          <FlatList data={displayIssues} keyExtractor={i => String(i.id)}
            contentContainerStyle={S.list}
            renderItem={({ item }) => (
              <IssueCard issue={item}
                chatUnread={getIssueUnread(item.id)}
                onResolve={openResolve}
                onOpenChat={openChat} />
            )}
            ListEmptyComponent={
              <View style={S.empty}>
                <Text style={S.emptyTx}>
                  {issFilter==='open' ? '✅ No open issues' : 'No issues found'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* ── CHAT HUB ── */}
      {tab === 'chat' && (
        <>
          <Text style={[S.sLabel2, { marginHorizontal:20, marginBottom:12, marginTop:2 }]}>
            💬 Crisis Chat Rooms
          </Text>
          {issues.length === 0 && (
            <View style={S.empty}>
              <Text style={S.emptyTx}>No active crisis chats</Text>
              <Text style={{ color:'#4B4842', fontSize:12, marginTop:6, textAlign:'center' }}>
                Chats are created automatically when issues are raised
              </Text>
            </View>
          )}
          <FlatList data={issues} keyExtractor={i => String(i.id)}
            contentContainerStyle={S.list}
            renderItem={({ item: issue }) => {
              const unread = getIssueUnread(issue.id);
              return (
                <TouchableOpacity style={[S.card, { borderColor: unread > 0 ? '#A78BFA40' : '#1C1A17' }]}
                  onPress={() => openChat(issue)} activeOpacity={0.8}>
                  <View style={S.cRow}>
                    <View style={[S.cIcon, { backgroundColor: '#A78BFA15' }]}>
                      <Text style={{ fontSize:20 }}>{issue.isAuto ? '⏰' : '🚨'}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={S.cName} numberOfLines={1}>{issue.foodType}</Text>
                      <Text style={S.cSub}>{'🚴 '}{issue.deliveryName}</Text>
                      <Text style={{ fontSize:11, color:'#8C8880', marginTop:2 }} numberOfLines={1}>
                        {issue.reason}
                      </Text>
                    </View>
                    <View>
                      {unread > 0
                        ? <View style={[S.navBadge, { paddingHorizontal:6 }]}>
                            <Text style={{ fontSize:10, color:'#fff', fontWeight:'700' }}>{unread}</Text>
                          </View>
                        : <Text style={{ fontSize:12, color:'#8C8880' }}>💬</Text>
                      }
                      <View style={[S.badge, { marginTop:6,
                        backgroundColor: issue.status==='open' ? '#EF444420' : '#4ADE8020' }]}>
                        <Text style={[S.badgeTx, { color: issue.status==='open' ? '#EF4444' : '#4ADE80' }]}>
                          {issue.status==='open' ? 'OPEN' : 'DONE'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* Listing detail sheet */}
      <Sheet visible={listModal && !!selListing} title="Listing Details" onClose={() => setListModal(false)}>
        <ScrollView style={{ padding:16 }}>
          {selListing && (() => { const n = normL(selListing); const color = LSC[selListing.status]||'#888'; return (
            <View>
              <View style={[S.statusBanner, { backgroundColor:color+'15', borderColor:color+'40' }]}>
                <Text style={{ fontSize:13, fontWeight:'700', color, letterSpacing:0.5 }}>
                  {LSI[selListing.status]}{' '}{(selListing.status||'').replace('_',' ').toUpperCase()}
                </Text>
              </View>
              <JourneyLabeled status={selListing.status} color={color} />
              <Text style={[S.sLabel, { marginTop:14 }]}>👥 PARTIES INVOLVED</Text>
              <PartyBlock color="#4ADE80" icon="🌱" role="DONOR" name={n.donorName} address={n.donorLocation} phone={n.donorPhone} />
              {!!n.claimedByName
                ? <PartyBlock color="#60A5FA" icon="🤝" role="NGO — DROP ADDRESS" name={n.claimedByName} address={n.ngoLocation||'No address recorded'} phone={n.ngoPhone} />
                : <View style={[S.party, { borderColor:'#D6D2CA' }]}><Text style={{ fontSize:10,color:'#6B6860',fontWeight:'700' }}>🤝 NGO</Text><Text style={{ fontSize:12,color:'#4B4842',marginTop:3 }}>Not yet claimed</Text></View>
              }
              {!!n.deliveryName && <PartyBlock color="#FBBF24" icon="🚴" role="DELIVERY" name={n.deliveryName} address="" phone={n.deliveryPhone} />}
              {!!selListing.notes && <View style={{ marginTop:10,backgroundColor:'#F2F1EE',borderRadius:8,padding:12 }}><Text style={{ fontSize:12,color:'#8C8880' }}>📝 {selListing.notes}</Text></View>}
            </View>
          ); })()}
        </ScrollView>
      </Sheet>

      {/* Resolve issue sheet */}
      <Sheet visible={resolveModal && !!activeIssue} title="Resolve Issue" onClose={() => setResolveModal(false)}>
        <ScrollView style={{ padding:20 }}>
          {activeIssue && (
            <View style={{ backgroundColor:'#EF444412', borderRadius:10, padding:14, marginBottom:16,
              borderWidth:1, borderColor:'#EF444428' }}>
              <Text style={{ fontSize:11, color:'#DC2626', fontWeight:'700', marginBottom:6 }}>Issue raised</Text>
              <Text style={{ fontSize:13, color:'#1C1A17', fontWeight:'600', marginBottom:4 }}>{'🚴 '}{activeIssue.deliveryName}</Text>
              <Text style={{ fontSize:13, color:'#bbb', lineHeight:18 }}>{activeIssue.reason}</Text>
            </View>
          )}
          <Text style={{ fontSize:13, color:'#6B6860', marginBottom:8 }}>Resolution note (optional):</Text>
          <TextInput style={S.noteInput}
            placeholder="e.g. Contacted NGO to reschedule…"
            placeholderTextColor="#3A3A3A"
            value={adminNote} onChangeText={setAdminNote}
            multiline numberOfLines={4} />
          <TouchableOpacity style={[S.appBtn, { marginBottom:20 }]}
            onPress={confirmResolve} activeOpacity={0.8}>
            <Text style={S.appTx}>✓ Mark as Resolved</Text>
          </TouchableOpacity>
        </ScrollView>
      </Sheet>

      {/* Chat sheet */}
      <Sheet visible={chatModal && !!chatIssue} title={`💬 Crisis Chat — ${chatIssue?.foodType||''}`}
        onClose={() => { setChatModal(false); setChatIssue(null); }}>
        <View style={{ padding:16, flex:1 }}>
          {chatIssue && (
            <View style={{ backgroundColor:'#EF444410', borderRadius:8, padding:10, marginBottom:12,
              borderWidth:1, borderColor:'#EF444428' }}>
              <Text style={{ fontSize:11, color:'#DC2626', fontWeight:'700', marginBottom:2 }}>
                {chatIssue.isAuto ? '⏰ Auto-raised' : '🚨 Issue'}
              </Text>
              <Text style={{ fontSize:12, color:'#8C8880', lineHeight:16 }} numberOfLines={2}>
                {chatIssue.reason}
              </Text>
            </View>
          )}
          <Text style={{ fontSize:10, color:'#6B6860', marginBottom:8, textAlign:'center',
            letterSpacing:0.5, textTransform:'uppercase' }}>
            All parties in this chat: 🌱 Donor · 🤝 NGO · 🚴 Delivery · 🛡 Admin
          </Text>
          <ChatRoom
            issueId={chatIssue?.id}
            currentUserName={user?.name || user?.email || 'Admin'}
          />
        </View>
      </Sheet>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#FFFFFF' },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start',
                 paddingHorizontal:20, paddingTop:16, paddingBottom:12 },
  hTitle:      { fontSize:22, fontWeight:'700', color:'#1C1A17' },
  hSub:        { fontSize:12, color:'#16A34A', marginTop:2, letterSpacing:0.5 },
  logoutBtn:   { paddingVertical:6, paddingHorizontal:12, backgroundColor:'#F2F1EE',
                 borderRadius:8, borderWidth:1, borderColor:'#D6D2CA' },
  row:         { flexDirection:'row', paddingHorizontal:20, gap:10, marginBottom:14 },
  tile:        { flex:1, backgroundColor:'#FFFFFF', borderRadius:12, borderWidth:1, padding:12, alignItems:'center' },
  tileN:       { fontSize:22, fontWeight:'700' },
  tileL:       { fontSize:10, color:'#6B6860', marginTop:2, textTransform:'uppercase', letterSpacing:0.3 },
  miniTile:    { flex:1, backgroundColor:'#FFFFFF', borderRadius:10, borderWidth:1, padding:10, alignItems:'center' },
  segWrap:     { flexDirection:'row', marginHorizontal:20, backgroundColor:'#FFFFFF',
                 borderRadius:12, padding:4, marginBottom:14 },
  seg:         { flex:1, paddingVertical:8, alignItems:'center', borderRadius:10 },
  segOn:       { backgroundColor:'#E3E0D9' },
  segTx:       { fontSize:12, color:'#8C8880', fontWeight:'600' },
  segTxOn:     { color:'#1C1A17' },
  fPill:       { paddingHorizontal:12, paddingVertical:6, borderRadius:8,
                 backgroundColor:'#F2F1EE', borderWidth:1, borderColor:'#D6D2CA' },
  fPillOn:     { backgroundColor:'#4ADE8020', borderColor:'#4ADE8050' },
  fPillTx:     { fontSize:11, color:'#6B6860', fontWeight:'600' },
  fPillTxOn:   { color:'#16A34A' },
  list:        { paddingHorizontal:20, paddingBottom:40, gap:10 },
  card:        { backgroundColor:'#FFFFFF', borderRadius:16, padding:16,
                 borderWidth:1, borderColor:'#1C1A17', marginBottom:10 },
  cRow:        { flexDirection:'row', alignItems:'center', gap:12 },
  cIcon:       { width:48, height:48, borderRadius:12, alignItems:'center', justifyContent:'center' },
  cName:       { fontSize:15, fontWeight:'600', color:'#1C1A17' },
  cSub:        { fontSize:11, color:'#6B6860', marginTop:2 },
  cRole:       { fontSize:11, fontWeight:'600', marginTop:3, textTransform:'uppercase', letterSpacing:0.3 },
  badge:       { paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  badgeTx:     { fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.3 },
  cActions:    { flexDirection:'row', marginTop:14, gap:10 },
  rejBtn:      { flex:1, paddingVertical:10, backgroundColor:'#EF444415',
                 borderWidth:1, borderColor:'#EF444433', borderRadius:10, alignItems:'center' },
  rejTx:       { color:'#DC2626', fontSize:13, fontWeight:'600' },
  appBtn:      { flex:1, paddingVertical:10, backgroundColor:'#4ADE8015',
                 borderWidth:1, borderColor:'#4ADE8033', borderRadius:10, alignItems:'center' },
  appTx:       { color:'#16A34A', fontSize:13, fontWeight:'600' },
  chatBtn:     { flex:1, paddingVertical:10, backgroundColor:'#A78BFA15',
                 borderWidth:1, borderColor:'#A78BFA33', borderRadius:10, alignItems:'center' },
  resolveBtn:  { flex:1, paddingVertical:10, backgroundColor:'#4ADE8015',
                 borderWidth:1, borderColor:'#4ADE8033', borderRadius:10, alignItems:'center' },
  party:       { backgroundColor:'#F2F1EE', borderRadius:10, padding:12,
                 borderWidth:1, marginBottom:8 },
  statusBanner: { borderRadius:10, borderWidth:1, padding:10, marginBottom:14, alignItems:'center' },
  sLabel:      { fontSize:11, color:'#6B6860', textTransform:'uppercase', letterSpacing:1,
                 fontWeight:'700', marginBottom:8 },
  sLabel2:     { fontSize:16, fontWeight:'700', color:'#1C1A17' },
  overlay:     { position:'absolute', top:0, left:0, right:0, bottom:0,
                 backgroundColor:'rgba(28,26,23,0.40)', justifyContent:'flex-end' },
  sheet:       { backgroundColor:'#FFFFFF', borderTopLeftRadius:20, borderTopRightRadius:20,
                 maxHeight:'88%', paddingBottom:30 },
  sheetHead:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                 padding:20, borderBottomWidth:1, borderBottomColor:'#1C1A17' },
  sheetTitle:  { fontSize:17, fontWeight:'700', color:'#1C1A17', flex:1 },
  navPill:     { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12,
                 paddingVertical:8, borderRadius:20, backgroundColor:'#FFFFFF',
                 borderWidth:1, borderColor:'#1C1A17' },
  navPillOn:   { backgroundColor:'#E3E0D9', borderColor:'#4B4842' },
  navTx:       { fontSize:12, color:'#8C8880', fontWeight:'600' },
  navTxOn:     { color:'#1C1A17' },
  navBadge:    { backgroundColor:'#EF4444', borderRadius:10, paddingHorizontal:5,
                 paddingVertical:1, minWidth:16, alignItems:'center' },
  noteInput:   { backgroundColor:'#F2F1EE', borderRadius:12, borderWidth:1,
                 borderColor:'#D6D2CA', color:'#1C1A17', padding:14, fontSize:13,
                 minHeight:100, textAlignVertical:'top', marginBottom:16 },
  empty:       { paddingTop:60, alignItems:'center' },
  emptyTx:     { color:'#6B6860', fontSize:14 },
});