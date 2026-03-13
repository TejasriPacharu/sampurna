// src/screens/dashboards/NGODashboard.js
// ALL original code preserved. Live API flow + delivery choice + self-delivery added.

import { useState, useEffect } from 'react';
import CrisisChat from '../../components/CrisisChat';
import { subscribeIssues, getIssueForListing, openCoordinationRoom } from '../../store/issueStore';
import { subscribeGlobal } from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import {
  T, PageScroll, TopBar, WelcomeCard, StatsRow, SectionTitle,
  DashboardTitle, ActionCard, TabBar, Modal, PrimaryButton,
  StatusPill, RateModal, DonorChip, getTimeLeft, cardStyle,
} from '../../components/ui/ui';

const ACCENT = '#60A5FA';

const TABS = [
  { id:'home',       icon:'🏠', label:'Home'      },
  { id:'browse',     icon:'🗺️', label:'Browse'    },
  { id:'claims',     icon:'📋', label:'Claims'    },
  { id:'deliveries', icon:'🚚', label:'Live'       },
];


// ── ContactCard — reusable contact info block ────────────────────
function ContactCard({ color, icon, role, name, phone, email, address, status }) {
  return (
    <div style={{
      background: color + '10',
      border: `1px solid ${color}35`,
      borderRadius: 8,
      padding: '8px 12px',
      marginBottom: 6,
    }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
        {icon} {role}
      </div>
      <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{name || '—'}</div>
      {status && (
        <div style={{ fontSize: 11, color: '#8C8880', marginTop: 2 }}>{status}</div>
      )}
      {address && (
        <div style={{ fontSize: 11, color: '#8C8880', marginTop: 3 }}>
          📍 {address}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: phone || email ? 4 : 0 }}>
        {phone && (
          <a href={`tel:${phone}`} style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
            📞 {phone}
          </a>
        )}
        {email && (
          <span style={{ fontSize: 11, color: '#8C8880' }}>✉️ {email}</span>
        )}
      </div>
    </div>
  );
}

export default function NGODashboard({ navigation }) {
  // ── Original store bindings kept ─────────────────────────────
  const {
    user, logout,
    listings: storeListings, patchListing, ratings, addRating,
    // NEW API actions
    fetchAvailableListings, availableListings: apiAvailable,
    claimFood: apiClaimFood,
    fetchNGOClaims, listings: apiClaims,
    confirmReceived,
    listingsLoading,
    fetchMyRatings, myRatings: apiRatings,
    rateUser, seedListings,
  } = useAuthStore();

  const [tab,        setTab]        = useState('home');
  const [modal,      setModal]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [rateTarget, setRateTarget] = useState(null);

  // NEW state
  const [claimingId,    setClaimingId]    = useState(null);  // loading state for claim button
  const [searchQuery,   setSearchQuery]   = useState('');
  const [confirming,    setConfirming]    = useState(null);  // listingId being confirmed received
  const [issues,        setIssues]        = useState([]);
  const [chatOpen,      setChatOpen]      = useState(false);
  const [chatIssue,     setChatIssue]     = useState(null);
  const [chatBadges,    setChatBadges]    = useState([]);

  const handleLogout = () => { logout(); navigation.replace('RoleSelection'); };

  // ── NEW: Load on mount + tab changes ─────────────────────────
  useEffect(() => {
    const { INITIAL_LISTINGS } = require('../../data/seedData');
    seedListings(INITIAL_LISTINGS);
    fetchAvailableListings();
    fetchNGOClaims();
    fetchMyRatings();
  }, []);

  // Subscribe to issues to show chat buttons on affected claims
  useEffect(() => {
    const u1 = subscribeIssues(setIssues);
    const u2 = subscribeGlobal(setChatBadges);
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (tab === 'browse')     fetchAvailableListings();
    if (tab === 'claims')     fetchNGOClaims();
    if (tab === 'deliveries') fetchNGOClaims();
  }, [tab]);

  // ── Normalise listing — maps all API snake_case + camelCase aliases ──
  const normListing = (l) => ({
    ...l,
    foodType:        l.foodType       || l.food_type        || '',
    donorName:       l.donorName      || l.donor_name        || '',
    donorPhone:      l.donorPhone     || l.donor_phone       || '',
    donorLocation:   l.donorLocation  || l.donor_location    || l.location || '',
    claimedByName:   l.claimedByName  || l.claimed_by_name   || '',
    ngoLocation:     l.ngoLocation    || l.ngo_location       || '',
    ngoPhone:        l.ngoPhone       || l.ngo_phone          || '',
    expiryTime:      l.expiryTime     || l.expiry_time        || '',
    pickupAvailable: l.pickupAvailable ?? l.pickup_available,
    delivery_mode:   l.delivery_mode  || 'platform',
    // All delivery partner field variants (from API serializer + local store)
    deliveryName:    l.deliveryName   || l.delivery_name     || '',
    deliveryEmail:   l.deliveryEmail  || l.delivery_email    || '',
    deliveryPhone:   l.deliveryPhone  || l.delivery_phone    || '',
    deliveryId:      l.deliveryId     || l.delivery_id       || l.delivery_email || '',
  });

  // ── Derived — works with both API and local store data ────────
  const normAvailable  = (apiAvailable  || []).map(normListing);
  const apiClaimsNorm  = (apiClaims     || []).map(normListing);
  const storeClaims    = (storeListings || []).filter(l => l.claimedBy === user?.email);
  const storeAvailable = (storeListings || []).filter(l => l.status === 'active');
  const myClaims       = apiClaimsNorm.length ? apiClaimsNorm : storeClaims;
  // `available` is the final list used by the browse tab
  const available      = normAvailable.length ? normAvailable : storeAvailable.map(normListing);

  const activeClaims = myClaims.filter(l => l.status === 'claimed').length;
  const received     = myClaims.filter(l => l.status === 'delivered').length;
  const mealsFed     = myClaims.filter(l => l.status === 'delivered').reduce((s, l) => s + (l.quantity || 0), 0);

  // Filter + search for browse tab
  const filterFn = (l) => {
    if (filter === 'pickup'   && !l.pickupAvailable) return false;
    if (filter === 'no-pickup' &&  l.pickupAvailable) return false;
    if (filter === 'self-delivery' && l.delivery_mode !== 'self') return false;
    if (searchQuery && !(l.foodType || l.food_type || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(l.donorName || l.donor_name || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  };
  const filtered = available.filter(filterFn);

  // Ratings
  const localRatings = ratings?.[user?.email] || [];
  const ratingsList  = apiRatings?.length ? apiRatings : localRatings;

  // ── Handlers ────────────────────────────────────────────────
  const claimFood = async (listing) => {
    setClaimingId(listing.id);
    try {
      await apiClaimFood(listing.id);
    } catch {
      // Fallback: patch store with FULL NGO contact so delivery guy can read pickup destination
      if (typeof patchListing === 'function') {
        patchListing(listing.id, {
          status:          'claimed',
          // camelCase variants (local store)
          claimedBy:       user?.email,
          claimedByName:   user?.ngo_name  || user?.name   || user?.email,
          ngoLocation:     user?.location  || user?.address || '',
          ngoPhone:        user?.phone     || '',
          // snake_case variants (API shape)
          claimed_by:      user?.email,
          claimed_by_name: user?.ngo_name  || user?.name   || user?.email,
          ngo_location:    user?.location  || user?.address || '',
          ngo_phone:       user?.phone     || '',
        });
      }
    } finally {
      setClaimingId(null);
    }
    setModal(null);
    try { await fetchNGOClaims();          } catch {}
    try { await fetchAvailableListings();  } catch {}
  };

  // NEW: Confirm received (when delivery_mode === 'self' the NGO confirms themselves)
  const handleConfirmReceived = async (listing) => {
    setConfirming(listing.id);
    try {
      await confirmReceived(listing.id);
    } catch {
      patchListing(listing.id, { status: 'delivered' });
    } finally {
      setConfirming(null);
    }
    await fetchNGOClaims();
  };

  const openChat = (listing) => {
    // Use existing issue/room, or create a coordination room proactively
    const issue = getIssueForListing(listing.id) || openCoordinationRoom({
      listingId:     listing.id,
      foodType:      listing.foodType || listing.food_type || 'Food',
      initiatorName: user?.ngo_name || user?.name || user?.email || 'NGO',
      initiatorRole: 'ngo',
    });
    setChatIssue(issue);
    setChatOpen(true);
  };

  const getChatBadge = (listingId) => {
    const issue = getIssueForListing(listingId);
    if (!issue) return 0;
    const room = chatBadges.find(r => r.issueId === String(issue.id));
    return room?.unread || 0;
  };

  const submitRating = async (val, comment) => {
    try {
      await rateUser({
        rated_user_id: rateTarget.userId || rateTarget.email,
        listing_id:    rateTarget.listingId,
        rating:        val, comment,
      });
    } catch {
      // Fallback: store rating locally so UI updates immediately
      if (typeof addRating === 'function') {
        addRating(rateTarget.email, {
          id: Date.now(), reviewer: user?.name, role: 'ngo',
          rating: val, comment, date: 'Today',
        });
      }
    }
    setRateTarget(null); setModal(null);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <PageScroll>
      <TopBar onLogout={handleLogout} />
      <WelcomeCard icon="🤝" name={user?.name} email={user?.email} accent={ACCENT} tag="✓ NGO" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />

      {/* ── HOME ── */}
      {tab === 'home' && (
        <>
          <DashboardTitle title="NGO Dashboard" subtitle="Claim and distribute surplus food nearby" accent={ACCENT} />
          <StatsRow accent={ACCENT} stats={[
            { icon:'📥', label:'Claimed',   value: activeClaims },
            { icon:'🍽️', label:'Received',  value: received     },
            { icon:'👥', label:'Meals Fed', value: mealsFed     },
          ]} />
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionCard icon="🗺️" label="Browse Nearby Food"  sublabel={`${available.length} listings available now`}       accent={ACCENT} onClick={() => setTab('browse')}     badge={available.length > 0 ? `${available.length} Live` : null} badgeColor={ACCENT} />
          <ActionCard icon="📋" label="My Claims"            sublabel={`${activeClaims} active, ${received} received`}     accent={ACCENT} onClick={() => setTab('claims')}     />
          <ActionCard icon="🚚" label="Live Deliveries"      sublabel="Monitor incoming deliveries"                        accent={ACCENT} onClick={() => setTab('deliveries')} />
          <ActionCard icon="📊" label="Impact Report"        sublabel={`${mealsFed} meals received & distributed`}        accent={ACCENT} onClick={() => setTab('claims')}     />

          {/* NEW: In-progress delivery live feed */}
          {myClaims.filter(l => l.status === 'picked_up').length > 0 && (
            <>
              <SectionTitle>🔴 On the Way</SectionTitle>
              {myClaims.filter(l => l.status === 'picked_up').map(l => (
                <OnTheWayBanner key={l.id} listing={l} accent={ACCENT} onClick={() => setTab('deliveries')} />
              ))}
            </>
          )}
        </>
      )}

      {/* ── BROWSE ── */}
      {tab === 'browse' && (
        <>
          <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT, marginBottom:12 }}>🗺️ Nearby Food</div>

          {/* NEW: Search bar */}
          <input
            placeholder="🔍 Search food type or donor…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width:'100%', padding:'10px 14px', background: '#F2F1EE', border:'1px solid #D6D2CA', borderRadius:10, color: '#1C1A17', fontSize:13, fontFamily: T.font, marginBottom:12, boxSizing:'border-box', outline:'none' }}
          />

          {/* Filter pills — NEW: added self-delivery filter */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {[['all','All'], ['pickup','🚗 Pickup'], ['no-pickup','📍 Deliver'], ['self-delivery','🚗 Self-delivery']].map(([f, label]) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily: T.font,
                  background: filter === f ? ACCENT : T.surface2, color: filter === f ? '#FFFFFF' : '#666' }}>
                {label}
              </button>
            ))}
          </div>

          {listingsLoading && <LoadingState />}
          {!listingsLoading && filtered.length === 0 && <EmptyState icon="🗺️" text="No available listings" />}

          {filtered.map(l => {
            const tl = getTimeLeft(l.expiryTime || l.expiry_time);
            const foodName = l.foodType || l.food_type;
            const isSelf   = l.delivery_mode === 'self';
            return (
              <div key={l.id} style={{ ...cardStyle(), cursor:'pointer' }}
                onClick={() => { setSelected(l); setModal('ngo-detail'); }}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>

                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ fontSize:15, fontWeight:700, color: '#1C1A17' }}>{foodName}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    {isSelf && <span style={{ fontSize:9, background:'#F0FDF4', color:'#16A34A', padding:'2px 7px', borderRadius:6, fontWeight:700 }}>SELF-DELIVERY</span>}
                    <span style={{ fontSize:10, color: tl.color, fontWeight:700 }}>{tl.text}</span>
                  </div>
                </div>

                <DonorChip donorName={l.donorName || l.donor_name} />

                <div style={{ fontSize:12, color:'#6B6860', display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
                  <span>📦 {l.quantity} {l.unit}</span>
                  <span>📍 {(l.location||'').split(',')[0]}</span>
                  <span>{(l.pickupAvailable ?? l.pickup_available) ? '🚗 Pickup' : '📍 Deliver'}</span>
                </div>

                <button onClick={e => { e.stopPropagation(); claimFood(l); }}
                  disabled={claimingId === l.id}
                  style={{ width:'100%', padding:'9px', background: ACCENT+'18', border:`1px solid ${ACCENT}40`, borderRadius:8, color: ACCENT, fontSize:13, fontWeight:700, cursor:'pointer',
                    opacity: claimingId === l.id ? 0.5 : 1 }}>
                  {claimingId === l.id ? '⏳ Claiming…' : '✅ Claim This Food'}
                </button>
              </div>
            );
          })}
        </>
      )}

      {/* ── CLAIMS ── */}
      {tab === 'claims' && (
        <>
          <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT, marginBottom:16 }}>📋 My Claims</div>
          {listingsLoading && <LoadingState />}
          {!listingsLoading && myClaims.length === 0 && <EmptyState icon="📋" text="No claims yet — browse and claim food!" />}
          {myClaims.map(l => {
            const tl       = getTimeLeft(l.expiryTime || l.expiry_time);
            const isSelf   = l.delivery_mode === 'self';
            const canConfirm = isSelf && l.status === 'claimed';

            return (
              <div key={l.id} style={cardStyle()}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontSize:15, fontWeight:700, color: '#1C1A17' }}>{l.foodType || l.food_type}</div>
                  <StatusPill status={l.status} />
                </div>

                {/* Donor info block */}
                <div style={{ background: '#F2F1EE', borderRadius:8, padding:'8px 10px', marginBottom:8 }}>
                  <div style={{ fontSize:11, color:'#16A34A', fontWeight:600 }}>🌱 {l.donorName || l.donor_name}</div>
                  <div style={{ fontSize:11, color:'#8C8880', marginTop:2 }}>📍 {l.location}</div>
                  {l.phone && <div style={{ fontSize:11, color:'#8C8880', marginTop:1 }}>📞 {l.phone}</div>}
                </div>

                <div style={{ fontSize:12, color:'#6B6860', display:'flex', gap:12, marginBottom:10 }}>
                  <span>📦 {l.quantity} {l.unit}</span>
                  <span style={{ color: tl.color }}>⏱ {tl.text}</span>
                  {isSelf && <span style={{ color:'#16A34A', fontWeight:600 }}>🚗 Self-delivery</span>}
                </div>

                {/* Delivery journey tracker */}
                {['claimed','picked_up','delivered'].includes(l.status) && (
                  <DeliveryTracker listing={l} accent={ACCENT} isSelf={isSelf} />
                )}

                {/* Delivery partner row */}
                {l.deliveryName && !isSelf && (
                  <div style={{ marginTop:8, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:12, color:'#D97706', fontWeight:600 }}>🚴 {l.deliveryName}</div>
                    <div style={{ fontSize:11, color:'#6B6860', marginTop:2 }}>
                      {l.status === 'picked_up' ? '📦 Food picked up — on the way!' : 'Delivery partner assigned'}
                    </div>
                    {l.delivery_phone && <div style={{ fontSize:11, color:'#6B6860', marginTop:1 }}>📞 {l.delivery_phone}</div>}
                  </div>
                )}

                {/* Status messages */}
                {l.status === 'claimed' && !l.deliveryId && !l.delivery_id && !isSelf && (
                  <StatusBanner color="#8C8880" text="⏳ Waiting for delivery assignment…" />
                )}
                {canConfirm && (
                  <button onClick={() => handleConfirmReceived(l)} disabled={confirming === l.id}
                    style={{ marginTop:10, width:'100%', padding:'10px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, color:'#16A34A', fontSize:13, fontWeight:700, cursor:'pointer',
                      opacity: confirming === l.id ? 0.5 : 1 }}>
                    {confirming === l.id ? '⏳ Confirming…' : '✅ Mark as Received (Self-delivery)'}
                  </button>
                )}
                {l.status === 'picked_up' && (
                  <StatusBanner color="#FBBF24" text="🚴 Food picked up — on the way!" />
                )}
                {/* 💬 Chat — always shown on claimed/active deliveries */}
                {['claimed','picked_up','delivered'].includes(l.status) && (() => {
                  const issue = getIssueForListing(l.id);
                  const badge = getChatBadge(l.id);
                  const isIssue = issue && !issue.isCoord;
                  return (
                    <button onClick={() => openChat(l)} style={{
                      marginTop:10, width:'100%', padding:'10px 14px',
                      background: isIssue ? '#EF444412' : '#A78BFA15',
                      border: `1px solid ${isIssue ? '#EF444435' : '#A78BFA40'}`,
                      borderRadius:10,
                      color: isIssue ? '#EF4444' : '#A78BFA',
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}>
                      {isIssue ? '🚨' : '💬'} {isIssue ? 'Crisis Chat' : 'Chat with all parties'}
                      {badge > 0 && <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{badge}</span>}
                    </button>
                  );
                })()}
                {l.status === 'delivered' && (
                  <>
                    <StatusBanner color="#4ADE80" text="✅ Successfully delivered" />
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <RateBtn label="⭐ Rate Donor"    color="#4ADE80" onClick={() => { setRateTarget({ email: l.donorEmail||l.donor_email, userId: l.donor_user_id, name: l.donorName||l.donor_name, listingId: l.id }); setModal('rate'); }} />
                      {(l.deliveryId||l.delivery_id) && <RateBtn label="⭐ Rate Delivery" color="#FBBF24" onClick={() => { setRateTarget({ email: l.deliveryId||l.delivery_id, userId: l.delivery_user_id, name: l.deliveryName||l.delivery_name, listingId: l.id }); setModal('rate'); }} />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── LIVE DELIVERIES ── */}
      {tab === 'deliveries' && (
        <>
          <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT, marginBottom:16 }}>🚚 Live Deliveries</div>
          {myClaims.filter(l => ['claimed','picked_up'].includes(l.status)).length === 0 && (
            <EmptyState icon="🚚" text="No active deliveries" />
          )}
          {myClaims.filter(l => ['claimed','picked_up'].includes(l.status)).map(l => {
            const isSelf = l.delivery_mode === 'self';
            return (
              <div key={l.id} style={{ ...cardStyle(), borderColor: l.status === 'picked_up' ? '#FBBF2430' : T.border }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <div style={{ fontSize:15, fontWeight:700, color: '#1C1A17' }}>{l.foodType || l.food_type}</div>
                  <StatusPill status={l.status} />
                </div>
                <div style={{ fontSize:12, color:'#6B6860', marginBottom:8 }}>📦 {l.quantity} {l.unit} · 🌱 {l.donorName||l.donor_name}</div>

                {/* Delivery partner / self info block */}
                {isSelf ? (
                  <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:12, color:'#16A34A', fontWeight:600 }}>🚗 Donor is self-delivering</div>
                    <div style={{ fontSize:11, color:'#6B6860', marginTop:3 }}>Contact the donor to confirm arrival.</div>
                    {l.donor_phone && <div style={{ fontSize:11, color:'#8C8880', marginTop:2 }}>📞 {l.donor_phone}</div>}
                  </div>
                ) : (l.deliveryName || l.delivery_name) ? (
                  <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:12, color:'#D97706', fontWeight:600 }}>🚴 {l.deliveryName||l.delivery_name} is on the way</div>
                    {l.delivery_phone && <div style={{ fontSize:11, color:'#6B6860', marginTop:2 }}>📞 {l.delivery_phone}</div>}
                    <div style={{ fontSize:11, color:'#6B6860', marginTop:3 }}>
                      {l.status === 'picked_up' ? '📦 Food picked up from donor' : 'ETA: ~15–20 minutes'}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#F2F1EE', borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:12, color:'#8C8880' }}>⏳ Awaiting delivery assignment</div>
                  </div>
                )}

                {/* 💬 Chat — always shown on active deliveries */}
                {(() => {
                  const issue = getIssueForListing(l.id);
                  const badge = getChatBadge(l.id);
                  const isIssue = issue && !issue.isCoord;
                  return (
                    <button onClick={() => openChat(l)} style={{
                      marginTop:10, width:'100%', padding:'10px 14px',
                      background: isIssue ? '#EF444412' : '#A78BFA15',
                      border: `1px solid ${isIssue ? '#EF444435' : '#A78BFA40'}`,
                      borderRadius:10,
                      color: isIssue ? '#EF4444' : '#A78BFA',
                      fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    }}>
                      {isIssue ? '🚨' : '💬'} {isIssue ? 'Crisis Chat' : 'Chat with Delivery & Donor'}
                      {badge > 0 && <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, padding:'1px 6px', fontSize:10 }}>{badge}</span>}
                    </button>
                  );
                })()}
                {/* Delivery tracker */}
                <DeliveryTracker listing={l} accent={ACCENT} isSelf={isSelf} />

                {/* NEW: NGO address reminder */}
                <div style={{ marginTop:8, background: ACCENT+'08', border:`1px solid ${ACCENT}20`, borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, color: ACCENT, fontWeight:700, marginBottom:2 }}>📍 YOUR ADDRESS (drop location)</div>
                  <div style={{ fontSize:12, color:'#8C8880' }}>{user?.address || user?.location || 'Your registered NGO address'}</div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── MODALS ── */}
      {modal === 'ngo-detail' && selected && (
        <Modal title="Food Listing Details" accent={ACCENT} onClose={() => setModal(null)}>
          {/* Donor block */}
          <div style={{ background: '#F2F1EE', borderRadius:10, padding:14, marginBottom:16, display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ fontSize:28 }}>🌱</div>
            <div>
              <div style={{ color:'#16A34A', fontWeight:700, fontSize:14 }}>{selected.donorName||selected.donor_name}</div>
              <div style={{ color:'#8C8880', fontSize:12 }}>Donor · {selected.location}</div>
              {selected.donor_phone && <div style={{ color:'#8C8880', fontSize:11, marginTop:1 }}>📞 {selected.donor_phone}</div>}
            </div>
          </div>

          {/* NEW: Delivery mode badge */}
          {selected.delivery_mode === 'self' && (
            <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'8px 12px', marginBottom:12, fontSize:12, color:'#16A34A', fontWeight:600 }}>
              🚗 Donor will self-deliver to your NGO
            </div>
          )}

          {[
            ['🍱 Food',     selected.foodType||selected.food_type],
            ['📦 Quantity', `${selected.quantity} ${selected.unit}`],
            ['📍 Location', selected.location],
            ['⏰ Expires',  new Date(selected.expiryTime||selected.expiry_time).toLocaleString()],
            ['🚗 Pickup',   (selected.pickupAvailable??selected.pickup_available) ? 'Yes' : 'No'],
          ].map(([l, v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #E3E0D9' }}>
              <span style={{ color: '#8C8880', fontSize:13 }}>{l}</span>
              <span style={{ fontWeight:600, color: '#1C1A17', fontSize:13 }}>{v}</span>
            </div>
          ))}
          {selected.notes && (
            <div style={{ marginTop:12, background: '#F2F1EE', borderRadius:8, padding:12, fontSize:13, color:'#8C8880' }}>📝 {selected.notes}</div>
          )}
          <PrimaryButton label="✅ Claim This Food" accent={ACCENT} onClick={() => claimFood(selected)} />
        </Modal>
      )}

      {modal === 'rate' && rateTarget && (
        <RateModal accent={ACCENT} targetName={rateTarget.name} onClose={() => setModal(null)} onSubmit={submitRating} />
      )}

      {/* Crisis Chat overlay */}
      {chatOpen && chatIssue && (
        <CrisisChat
          issue={chatIssue}
          senderName={user?.ngo_name || user?.name || user?.email || 'NGO'}
          senderRole="ngo"
          onClose={() => { setChatOpen(false); setChatIssue(null); }}
        />
      )}

      {/* Global chat unread banner in home tab */}
      {tab === 'home' && chatBadges.reduce((s, r) => s + r.unread, 0) > 0 && (() => {
        const total = chatBadges.reduce((s, r) => s + r.unread, 0);
        return (
          <div onClick={() => setTab('claims')} style={{
            position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
            background:'#A78BFA', borderRadius:20, padding:'10px 20px',
            color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', zIndex:900,
            boxShadow:'0 4px 20px #A78BFA60',
          }}>
            💬 {total} unread in crisis chat — tap to view
          </div>
        );
      })()}
    </PageScroll>
  );
}

// ── Delivery tracker (4-step) ─────────────────────────────────────
function DeliveryTracker({ listing: l, accent, isSelf }) {
  const steps = isSelf
    ? [
        { label:'Listed',    done: true },
        { label:'Claimed',   done: ['claimed','delivered'].includes(l.status) },
        { label:'Delivered', done: l.status === 'delivered' },
      ]
    : [
        { label:'Listed',    done: true },
        { label:'Claimed',   done: ['claimed','picked_up','delivered'].includes(l.status) },
        { label:'Picked Up', done: ['picked_up','delivered'].includes(l.status) },
        { label:'Delivered', done: l.status === 'delivered' },
      ];

  return (
    <div style={{ marginTop:12, padding:12, background: '#F2F1EE', borderRadius:10 }}>
      <div style={{ fontSize:10, color:'#6B6860', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Journey</div>
      <div style={{ display:'flex', alignItems:'flex-start' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display:'flex', alignItems:'center', flex:1 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ width:22, height:22, borderRadius:'50%',
                background: step.done ? accent : T.border,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:10, color: step.done ? '#FFFFFF' : '#444', fontWeight:700 }}>
                {step.done ? '✓' : i+1}
              </div>
              <div style={{ fontSize:8, color: step.done ? accent : '#444', textAlign:'center', whiteSpace:'nowrap' }}>{step.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height:2, background: (step.done && steps[i+1].done) ? accent : T.border, margin:'0 3px', marginBottom:14 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Private helpers ───────────────────────────────────────────────

function OnTheWayBanner({ listing: l, accent, onClick }) {
  return (
    <div onClick={onClick} style={{ ...cardStyle({ cursor:'pointer', borderColor:'#FBBF2440', background:'#FBBF2408' }) }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color: '#1C1A17' }}>🚴 {l.foodType||l.food_type}</div>
          <div style={{ fontSize:11, color:'#D97706', marginTop:2 }}>{l.deliveryName||l.delivery_name} is on the way!</div>
        </div>
        <StatusPill status={l.status} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign:'center', padding:'40px 0', color:'#4B4842' }}>
      <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
      <div style={{ fontSize:13 }}>Loading…</div>
    </div>
  );
}

function StatusBanner({ color, text }) {
  return (
    <div style={{ fontSize:12, color, padding:'8px 10px', background: color + '12', borderRadius:8, fontWeight:500, marginTop:8 }}>
      {text}
    </div>
  );
}

function RateBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick}
      style={{ flex:1, padding:'7px', background: color+'15', border:`1px solid ${color}30`, borderRadius:8, color, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily: T.font }}>
      {label}
    </button>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 0', color:'#4B4842' }}>
      <div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>
      {text}
    </div>
  );
}