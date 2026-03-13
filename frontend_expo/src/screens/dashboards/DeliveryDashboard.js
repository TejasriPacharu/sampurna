// src/screens/dashboards/DeliveryDashboard.js
// ✅ Freshness timer: live countdown bar on every active delivery
// ✅ Auto-issue: when food expires mid-delivery, issue raised + chat seeded automatically
// ✅ Crisis chat: 💬 button on each active delivery; all 4 parties can message
// ✅ Manual issue reporting preserved

import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { DELIVERY_LEADERBOARD } from '../../data/seedData';
import {
  T, PageScroll, TopBar, WelcomeCard, StatsRow, SectionTitle,
  DashboardTitle, ActionCard, TabBar, Modal, PrimaryButton,
  StatusPill, RatingStars, RateModal, getTimeLeft, cardStyle,
} from '../../components/ui/ui';
import CrisisChat from '../../components/CrisisChat';
import {
  raiseDeliveryIssue, raiseAutoExpiredIssue,
  hasOpenAutoIssue, getIssueForListing, subscribeIssues,
} from '../../store/issueStore';
import { subscribeGlobal, getSummaries } from '../../store/chatStore';

const ACCENT = '#FBBF24';
const TABS = [
  { id:'home',    icon:'🏠', label:'Home'    },
  { id:'pickups', icon:'📍', label:'Pickups' },
  { id:'active',  icon:'🚚', label:'Active'  },
  { id:'history', icon:'📜', label:'History' },
  { id:'ratings', icon:'⭐', label:'Rating'  },
];

// ── useFreshnessTimer: updates every 30 s ────────────────────────
function useFreshnessTimer(expiryTime) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!expiryTime) return { pct: 100, color: '#16A34A', label: 'No expiry', expired: false, urgency: 'ok' };

  const expMs = new Date(expiryTime).getTime();
  const diffMs = expMs - now;
  const diffH  = diffMs / 3_600_000;

  if (diffMs <= 0)  return { pct: 0,   color: '#DC2626', label: 'EXPIRED',               expired: true,  urgency: 'expired'  };
  if (diffH < 1)    return { pct: Math.round(diffH * 100), color: '#DC2626', label: `${Math.round(diffH * 60)}m left`, expired: false, urgency: 'critical' };
  if (diffH < 2)    return { pct: Math.round((diffH / 4) * 100), color: '#D97706', label: `${diffH.toFixed(1)}h left`, expired: false, urgency: 'warn' };
  return { pct: 100, color: '#16A34A', label: `${diffH.toFixed(1)}h left`, expired: false, urgency: 'ok' };
}

// ── FreshnessBar ─────────────────────────────────────────────────
function FreshnessBar({ expiryTime, compact }) {
  const { pct, color, label, urgency } = useFreshnessTimer(expiryTime);

  if (compact) return (
    <span style={{
      fontSize: 11, fontWeight: 700, color,
      background: color + '18', borderRadius: 6, padding: '2px 8px',
    }}>
      {urgency === 'expired' ? '💀 ' : urgency === 'critical' ? '🔴 ' : urgency === 'warn' ? '🟡 ' : '🟢 '}
      {label}
    </span>
  );

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: '#8C8880', fontWeight: 600 }}>🌡 Freshness window</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, background: '#E3E0D9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${Math.max(2, pct)}%`,
          background: color,
          transition: 'width 1s ease, background 0.5s',
          boxShadow: urgency !== 'ok' ? `0 0 6px ${color}80` : 'none',
        }} />
      </div>
      {urgency === 'expired' && (
        <div style={{
          marginTop: 6, fontSize: 11, color: '#DC2626', fontWeight: 700,
          background: '#FEF2F2', borderRadius: 6, padding: '5px 10px',
          border: '1px solid #FECACA',
        }}>
          ⏰ Food freshness expired — issue raised automatically.
          Use 💬 Crisis Chat to coordinate with all parties.
        </div>
      )}
      {urgency === 'critical' && (
        <div style={{
          marginTop: 6, fontSize: 11, color: '#D97706', fontWeight: 600,
          background: '#FFFBEB', borderRadius: 6, padding: '5px 10px',
          border: '1px solid #FDE68A',
        }}>
          ⚠️ Deliver urgently — under 1 hour remaining!
        </div>
      )}
    </div>
  );
}

// ── InfoBlock ────────────────────────────────────────────────────
function InfoBlock({ color, icon, title, name, sub, phone, highlight, style: xStyle }) {
  return (
    <div style={{
      background: highlight ? color + '0D' : T.surface2,
      border: highlight ? `1px solid ${color}40` : `1px solid transparent`,
      borderRadius: 8, padding: '10px 12px', ...xStyle,
    }}>
      <div style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#1C1A17', fontWeight: 700 }}>{name || '—'}</div>
      {sub   && <div style={{ fontSize: 12, color: highlight ? color : '#888', marginTop: 3, fontWeight: highlight ? 600 : 400 }}>📍 {sub}</div>}
      {phone && <div style={{ fontSize: 11, color: '#2563EB', marginTop: 2, fontWeight: 600 }}>📞 {phone}</div>}
    </div>
  );
}

// ── DelivContactCard ─────────────────────────────────────────────
function DelivContactCard({ color, icon, role, name, address, phone, highlight }) {
  return (
    <div style={{
      background: highlight ? color + '12' : T.surface2,
      border: `1px solid ${highlight ? color + '50' : T.border}`,
      borderRadius: 10, padding: '10px 14px', marginBottom: 6,
    }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
        {icon} {role}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: address ? 4 : 0 }}>{name || '—'}</div>
      {address && <div style={{ fontSize: 12, color: highlight ? color : '#888', marginBottom: phone ? 4 : 0 }}>📍 {address}</div>}
      {phone
        ? <a href={`tel:${phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#2563EB', fontWeight: 700, textDecoration: 'none', marginTop: 2 }}>📞 {phone}</a>
        : <div style={{ fontSize: 11, color: '#6B6860' }}>No phone on file</div>
      }
    </div>
  );
}

// ── Issue report modal ───────────────────────────────────────────
const ISSUE_REASONS = [
  'Food not ready at pickup time',
  'Donor unavailable / door locked',
  'NGO address incorrect or inaccessible',
  'Food quality or safety concern',
  'Vehicle breakdown',
  'Other (describe below)',
];

function ReportIssueModal({ listing, userName, onClose, onIssueCreated }) {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');
  const [done,   setDone]   = useState(false);

  const submit = () => {
    const final = reason === 'Other (describe below)' ? (custom.trim() || 'Other') : reason;
    if (!final) return;
    const issue = raiseDeliveryIssue({
      listingId:    listing.id,
      foodType:     listing.foodType || listing.food_type || 'Food',
      deliveryName: userName,
      raisedBy:     userName,
      reason:       final,
    });
    setDone(true);
    onIssueCreated?.(issue);
    setTimeout(onClose, 1600);
  };

  if (done) return (
    <Modal title="Issue Reported" accent="#EF4444" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1A17', marginBottom: 6 }}>Submitted to Admin</div>
        <div style={{ fontSize: 13, color: '#6B6860' }}>Crisis chat room opened for all parties.</div>
      </div>
    </Modal>
  );

  return (
    <Modal title="🚨 Report an Issue" accent="#EF4444" onClose={onClose}>
      <div style={{ padding: '4px 0 16px' }}>
        <div style={{ fontSize: 12, color: '#6B6860', marginBottom: 14 }}>
          <strong style={{ color: '#1C1A17' }}>{listing.foodType || listing.food_type}</strong>
        </div>
        {ISSUE_REASONS.map(r => (
          <button key={r} onClick={() => setReason(r)} style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '11px 14px', marginBottom: 6,
            background: reason === r ? '#EF444418' : T.surface2,
            border: `1px solid ${reason === r ? '#EF444450' : T.border}`,
            borderRadius: 10,
            color: reason === r ? '#EF4444' : '#aaa',
            fontSize: 13, fontWeight: reason === r ? 700 : 400,
            cursor: 'pointer', fontFamily: T.font, transition: 'all 0.15s',
          }}>
            {reason === r ? '● ' : '○ '}{r}
          </button>
        ))}
        {reason === 'Other (describe below)' && (
          <textarea
            placeholder="Describe the issue…"
            value={custom} onChange={e => setCustom(e.target.value)}
            style={{
              width: '100%', minHeight: 80, marginTop: 6,
              padding: '10px 12px', background: '#F2F1EE',
              border: '1px solid #D6D2CA', borderRadius: 10,
              color: '#1C1A17', fontSize: 13, fontFamily: T.font,
              resize: 'vertical', boxSizing: 'border-box', outline: 'none',
            }}
          />
        )}
        <PrimaryButton
          label="🚨 Submit Issue to Admin"
          accent="#EF4444"
          onClick={submit}
          style={{ marginTop: 16, opacity: reason ? 1 : 0.35, pointerEvents: reason ? 'auto' : 'none' }}
        />
      </div>
    </Modal>
  );
}

// ── ActiveCard: one in-progress delivery with freshness + actions ─
function ActiveCard({ l, user, actionLoading, onPickedUp, onDelivered, onReport, onOpenChat, chatBadges }) {
  const fresh = useFreshnessTimer(l.expiryTime || l.expiry_time);

  // Auto-raise issue when expired
  useEffect(() => {
    if (fresh.expired && !hasOpenAutoIssue(l.id)) {
      raiseAutoExpiredIssue({
        listingId:    l.id,
        foodType:     l.foodType || l.food_type || 'Food',
        deliveryName: user?.name || user?.full_name || user?.email || 'Delivery partner',
      });
    }
  }, [fresh.expired]);

  // Find unread count for this listing's issue room
  const issue  = getIssueForListing(l.id);
  const room   = issue ? chatBadges.find(r => r.issueId === String(issue.id)) : null;
  const unread = room?.unread || 0;

  const steps = [
    { label: 'Claimed',   done: true                     },
    { label: 'Picked Up', done: l.status === 'picked_up' },
    { label: 'Delivered', done: false                    },
  ];

  return (
    <div style={{
      ...cardStyle(),
      borderColor: fresh.expired ? '#EF444445'
        : fresh.urgency === 'critical' ? '#FBBF2440'
        : ACCENT + '40',
      background: fresh.expired ? '#EF44440A' : T.surface,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1A17' }}>{l.foodType}</div>
          <div style={{ fontSize: 11, color: '#8C8880', marginTop: 2 }}>
            {l.quantity} {l.unit} · #{l.id}
          </div>
        </div>
        <StatusPill status={l.status} />
      </div>

      {/* Freshness bar */}
      <FreshnessBar expiryTime={l.expiryTime || l.expiry_time} />

      {/* Step tracker */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: step.done ? ACCENT : T.border,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: step.done ? '#FFFFFF' : '#444', fontWeight: 700,
              }}>
                {step.done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 9, color: step.done ? ACCENT : '#8C8880', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {step.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: step.done && steps[i + 1].done ? ACCENT : T.border,
                margin: '0 4px', marginBottom: 14,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Address cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <InfoBlock color="#4ADE80" icon="🌱" title="📦 PICKUP FROM (DONOR)"
          name={l.donorName} sub={l.donorLocation} phone={l.donorPhone} />
        <InfoBlock color="#60A5FA" icon="🏠" title="🚩 DROP TO (NGO ADDRESS)"
          name={l.claimedByName} sub={l.ngoLocation} phone={l.ngoPhone} highlight />
      </div>

      {l.notes && (
        <div style={{ background: '#F2F1EE', borderRadius: 8, padding: '8px 10px', marginBottom: 14, fontSize: 12, color: '#8C8880' }}>
          📝 {l.notes}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

        {/* 💬 Chat — always visible; badge shows unread count */}
        <button onClick={() => onOpenChat(l, issue)} style={{
          position: 'relative',
          padding: '9px 14px',
          background: '#F5F3FF', border: '1px solid #DDD6FE',
          borderRadius: 10, color: '#7C3AED',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
        }}>
          💬 Chat
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#EF4444', color: '#fff',
              borderRadius: '50%', width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
            }}>{unread}</span>
          )}
        </button>

        {/* Contacts */}
        <button onClick={() => onReport(l, 'contacts')} style={{
          padding: '9px 14px', background: '#F2F1EE', border: '1px solid #E3E0D9',
          borderRadius: 10, color: '#8C8880',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
        }}>
          👁 Contacts
        </button>

        {/* Progress actions — hidden when expired */}
        {!fresh.expired && l.status === 'claimed' && (
          <button onClick={() => onPickedUp(l)} disabled={actionLoading === l.id + '-pickup'} style={{
            flex: 1, padding: 11,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 10, color: '#D97706',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            opacity: actionLoading === l.id + '-pickup' ? 0.5 : 1,
          }}>
            {actionLoading === l.id + '-pickup' ? '⏳ Updating…' : '📦 Confirm Pickup'}
          </button>
        )}
        {!fresh.expired && l.status === 'picked_up' && (
          <button onClick={() => onDelivered(l)} disabled={actionLoading === l.id + '-deliver'} style={{
            flex: 1, padding: 11,
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 10, color: '#16A34A',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
            opacity: actionLoading === l.id + '-deliver' ? 0.5 : 1,
          }}>
            {actionLoading === l.id + '-deliver' ? '⏳ Updating…' : '✅ Confirm Delivered'}
          </button>
        )}

        {/* Manual issue button */}
        {!fresh.expired && (
          <button onClick={() => onReport(l, 'issue')} style={{
            padding: '9px 14px',
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, color: '#DC2626',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
          }}>
            🚨 Issue
          </button>
        )}
      </div>

      {/* Expired: prominent chat CTA */}
      {fresh.expired && (
        <button onClick={() => onOpenChat(l, issue)} style={{
          display: 'block', width: '100%', marginTop: 10,
          padding: 12,
          background: '#F5F3FF', border: '1px solid #C4B5FD',
          borderRadius: 10, color: '#7C3AED',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: T.font,
        }}>
          💬 Open Crisis Chat — coordinate with Donor, NGO & Admin
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
export default function DeliveryDashboard({ navigation }) {
  const {
    user, logout,
    listings: storeListings, patchListing, ratings, addRating,
    fetchAvailablePickups, availablePickups: apiPickups,
    acceptDelivery, markPickedUp, markDelivered,
    fetchActiveDeliveries, activeDeliveries: apiActive,
    fetchDeliveryHistory, deliveryHistory: apiHistory,
    listingsLoading,
    fetchMyRatings, myRatings: apiRatings,
    fetchDeliveryLeaderboard, deliveryLeaderboard,
    rateUser, seedListings,
  } = useAuthStore();

  const [tab,           setTab]          = useState('home');
  const [online,        setOnline]       = useState(false);
  const [modal,         setModal]        = useState(null); // 'pickup-detail' | 'active-detail' | 'rate' | 'issue'
  const [selected,      setSelected]     = useState(null);
  const [rateTarget,    setRateTarget]   = useState(null);
  const [acceptingId,   setAcceptingId]  = useState(null);
  const [actionLoading, setActionLoading]= useState(null);

  // Chat & issue
  const [chatOpen,   setChatOpen]   = useState(false);
  const [chatIssue,  setChatIssue]  = useState(null);   // issue to open chat for
  const [chatBadges, setChatBadges] = useState([]);

  const handleLogout = () => { logout(); navigation.replace('RoleSelection'); };

  useEffect(() => {
    const { INITIAL_LISTINGS } = require('../../data/seedData');
    seedListings(INITIAL_LISTINGS);
    fetchAvailablePickups(); fetchActiveDeliveries();
    fetchDeliveryHistory(); fetchMyRatings(); fetchDeliveryLeaderboard();
  }, []);

  useEffect(() => {
    if (tab === 'pickups') fetchAvailablePickups();
    if (tab === 'active')  fetchActiveDeliveries();
    if (tab === 'history') fetchDeliveryHistory();
    if (tab === 'ratings') fetchMyRatings();
  }, [tab]);

  // Subscribe to global chat badges for unread indicators
  useEffect(() => {
    const unsub = subscribeGlobal(setChatBadges);
    return unsub;
  }, []);

  const norm = (l) => ({
    ...l,
    foodType:        l.foodType        || l.food_type        || '',
    donorName:       l.donorName       || l.donor_name       || '—',
    claimedByName:   l.claimedByName   || l.claimed_by_name  || '—',
    deliveryName:    l.deliveryName    || l.delivery_name,
    deliveryId:      l.deliveryId      || l.delivery_id,
    expiryTime:      l.expiryTime      || l.expiry_time,
    pickupAvailable: l.pickupAvailable ?? l.pickup_available,
    donorLocation:   l.location        || l.donor_location   || 'Address not available',
    donorPhone:      l.donor_phone     || '',
    ngoLocation:     l.ngo_location    || l.ngoLocation       ||
                     l.claimed_by_address || l.ngo_address    || 'NGO Address not set',
    ngoPhone:        l.ngo_phone       || l.ngoPhone          || '',
  });

  const pickupsNorm  = (apiPickups  || []).map(norm);
  const activeNorm   = (apiActive   || []).map(norm);
  const historyNorm  = (apiHistory  || []).map(norm);

  const storeAvailable = (storeListings || []).filter(l => l.status === 'claimed' && !l.deliveryId);
  const storeActive    = (storeListings || []).filter(l => l.deliveryId === user?.email && ['claimed','picked_up'].includes(l.status));
  const storeCompleted = (storeListings || []).filter(l => l.deliveryId === user?.email && l.status === 'delivered');

  const available        = pickupsNorm.length ? pickupsNorm  : storeAvailable.map(norm);
  const activeDeliveries = activeNorm.length  ? activeNorm   : storeActive.map(norm);
  const completed        = historyNorm.length ? historyNorm  : storeCompleted.map(norm);

  const localRatings = ratings?.[user?.email] || [];
  const ratingsList  = apiRatings?.length ? apiRatings : localRatings;
  const avgRating    = ratingsList.length
    ? (ratingsList.reduce((s, r) => s + r.rating, 0) / ratingsList.length).toFixed(1)
    : '5.0';
  const leaderData = deliveryLeaderboard?.length ? deliveryLeaderboard : DELIVERY_LEADERBOARD;

  // ── Handlers ────────────────────────────────────────────────
  const acceptPickup = async (l) => {
    setAcceptingId(l.id);
    try { await acceptDelivery(l.id); }
    catch { patchListing(l.id, { deliveryId: user.email, deliveryName: user.name }); }
    finally { setAcceptingId(null); }
    setModal(null);
    await fetchAvailablePickups();
    await fetchActiveDeliveries();
  };

  const handleMarkPickedUp = async (l) => {
    setActionLoading(l.id + '-pickup');
    try { await markPickedUp(l.id); }
    catch { patchListing(l.id, { status: 'picked_up' }); }
    finally { setActionLoading(null); }
    await fetchActiveDeliveries();
  };

  const handleMarkDelivered = async (l) => {
    setActionLoading(l.id + '-deliver');
    try { await markDelivered(l.id); }
    catch { patchListing(l.id, { status: 'delivered' }); }
    finally { setActionLoading(null); }
    await fetchActiveDeliveries();
    await fetchDeliveryHistory();
  };

  const submitRating = async (val, comment) => {
    try { await rateUser({ rated_user_id: rateTarget.userId || rateTarget.email, listing_id: rateTarget.listingId, rating: val, comment }); }
    catch { if (typeof addRating === 'function') addRating(rateTarget.email, { id: Date.now(), reviewer: user?.name, role: 'delivery', rating: val, comment, date: 'Today' }); }
    setRateTarget(null); setModal(null);
    try { fetchMyRatings(); } catch {}
  };

  const openChat = (listing, existingIssue) => {
    // If no issue yet, create a generic coordination issue for the chat room
    let issue = existingIssue || getIssueForListing(listing.id);
    if (!issue) {
      issue = raiseAutoExpiredIssue({
        listingId:    listing.id,
        foodType:     listing.foodType || listing.food_type || 'Food',
        deliveryName: user?.name || user?.full_name || user?.email,
      });
    }
    setChatIssue(issue);
    setChatOpen(true);
  };

  const handleCardAction = (listing, action) => {
    setSelected(listing);
    if (action === 'contacts') setModal('active-detail');
    if (action === 'issue')    setModal('issue');
  };

  // Total unread across all rooms
  const totalUnread = chatBadges.reduce((s, r) => s + r.unread, 0);

  return (
    <PageScroll>
      <TopBar onLogout={handleLogout} />
      <WelcomeCard icon="🚴" name={user?.name} email={user?.email} accent={ACCENT} tag="✓ Verified" />

      {/* Online toggle */}
      <div style={{
        ...cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }),
        borderColor: online ? ACCENT + '40' : T.border,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: online ? ACCENT : T.text }}>
            {online ? '🟢 You are Online' : '⚫ You are Offline'}
          </div>
          <div style={{ fontSize: 11, color: '#8C8880', marginTop: 2 }}>
            {online ? 'Receiving pickup requests' : 'Go online to receive requests'}
          </div>
        </div>
        <button onClick={() => setOnline(o => !o)} style={{
          width: 56, height: 30, borderRadius: 15, border: 'none',
          cursor: 'pointer', position: 'relative', transition: 'all 0.25s',
          background: online ? ACCENT : '#E3E0D9',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 4, left: online ? 30 : 4, transition: 'all 0.25s',
          }} />
        </button>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />

      {/* ── HOME ── */}
      {tab === 'home' && (
        <>
          <DashboardTitle title="Delivery Dashboard" subtitle="Pick up and deliver food to NGOs" accent={ACCENT} />
          <StatsRow accent={ACCENT} stats={[
            { icon: '📦', label: 'Deliveries', value: completed.length },
            { icon: '⚡', label: 'On-Time',    value: '100%'           },
            { icon: '⭐', label: 'Rating',     value: avgRating         },
          ]} />
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionCard icon="📍" label="Available Pickups"
            sublabel={online ? `${available.length} requests nearby` : 'Go online to see pickups'}
            accent={ACCENT} onClick={() => setTab('pickups')}
            badge={online && available.length > 0 ? `${available.length}` : null} badgeColor={ACCENT} />
          <ActionCard icon="🚚" label="Active Delivery"
            sublabel={activeDeliveries.length > 0 ? `Delivering: ${activeDeliveries[0]?.foodType}` : 'No active delivery'}
            accent={ACCENT} onClick={() => setTab('active')} />
          <ActionCard icon="📜" label="Delivery History"
            sublabel={`${completed.length} completed deliveries`}
            accent={ACCENT} onClick={() => setTab('history')} />
          <ActionCard icon="⭐" label="My Rating"
            sublabel={`${avgRating} avg · ${ratingsList.length} reviews`}
            accent={ACCENT} onClick={() => setTab('ratings')} />

          {/* Unread chat banner */}
          {totalUnread > 0 && (
            <div style={{
              background: '#F5F3FF', border: '1px solid #DDD6FE',
              borderRadius: 12, padding: '12px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                  {totalUnread} unread in crisis chat
                </div>
                <div style={{ fontSize: 11, color: '#8C8880', marginTop: 2 }}>
                  Go to Active tab → tap 💬 Chat
                </div>
              </div>
            </div>
          )}

          {activeDeliveries.length > 0 && (
            <>
              <SectionTitle>🔴 In Progress</SectionTitle>
              {activeDeliveries.map(l => (
                <ActiveBanner key={l.id} listing={l} accent={ACCENT} onClick={() => setTab('active')} />
              ))}
            </>
          )}

          <SectionTitle>Delivery Leaderboard</SectionTitle>
          {leaderData.slice(0, 3).map((e, i) => (
            <LeaderMini key={e.rank || e.id || i} entry={e} index={i} myEmail={user?.email} accent={ACCENT} />
          ))}
        </>
      )}

      {/* ── PICKUPS ── */}
      {tab === 'pickups' && (
        <>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
            📍 Available Pickups
          </div>
          {!online && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ color: '#D97706', fontWeight: 600, marginBottom: 8 }}>You are offline</div>
              <button onClick={() => setOnline(true)} style={{ background: ACCENT, border: 'none', borderRadius: 8, padding: '8px 20px', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Go Online
              </button>
            </div>
          )}
          {online && listingsLoading && <LoadingState />}
          {online && !listingsLoading && available.length === 0 && <EmptyState icon="📍" text="No pickups available right now" />}
          {online && available.map(l => {
            const tl = getTimeLeft(l.expiryTime);
            return (
              <div key={l.id} style={cardStyle()}
                onMouseEnter={e => e.currentTarget.style.borderColor = ACCENT + '40'}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1A17' }}>{l.foodType}</div>
                  <FreshnessBar expiryTime={l.expiryTime} compact />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <InfoBlock color="#4ADE80" icon="🌱" title="PICKUP FROM" name={l.donorName} sub={l.donorLocation} phone={l.donorPhone} />
                  <InfoBlock color="#60A5FA" icon="🤝" title="DELIVER TO"  name={l.claimedByName} sub={l.ngoLocation} phone={l.ngoPhone} />
                </div>
                <div style={{ fontSize: 12, color: '#6B6860', marginBottom: 12 }}>
                  📦 {l.quantity} {l.unit} · {l.pickupAvailable ? '🚗 Pickup available' : '📍 Requires delivery'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setSelected(l); setModal('pickup-detail'); }}
                    style={{ flex: 1, padding: 9, background: '#F2F1EE', border: '1px solid #D6D2CA', borderRadius: 8, color: '#8C8880', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
                    View Details
                  </button>
                  <button onClick={() => acceptPickup(l)} disabled={acceptingId === l.id}
                    style={{ flex: 2, padding: 9, background: ACCENT + '18', border: `1px solid ${ACCENT}40`, borderRadius: 8, color: ACCENT, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.font, opacity: acceptingId === l.id ? 0.5 : 1 }}>
                    {acceptingId === l.id ? '⏳ Accepting…' : '✅ Accept Request'}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── ACTIVE ── */}
      {tab === 'active' && (
        <>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 16 }}>
            🚚 Active Delivery
          </div>
          {listingsLoading && <LoadingState />}
          {!listingsLoading && activeDeliveries.length === 0 && <EmptyState icon="🚚" text="No active deliveries" />}
          {activeDeliveries.map(l => (
            <ActiveCard
              key={l.id}
              l={l}
              user={user}
              actionLoading={actionLoading}
              chatBadges={chatBadges}
              onPickedUp={handleMarkPickedUp}
              onDelivered={handleMarkDelivered}
              onReport={handleCardAction}
              onOpenChat={openChat}
            />
          ))}
        </>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 16 }}>
            📜 Delivery History
          </div>
          {listingsLoading && <LoadingState />}
          {!listingsLoading && completed.length === 0 && <EmptyState icon="📜" text="No completed deliveries yet" />}
          {completed.length > 0 && (
            <div style={{ ...cardStyle({ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 16 }), borderColor: ACCENT + '30' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: ACCENT }}>{completed.length}</div>
                <div style={{ fontSize: 10, color: '#8C8880', textTransform: 'uppercase' }}>Deliveries</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16A34A' }}>{completed.reduce((s, l) => s + (l.quantity || 0), 0)}</div>
                <div style={{ fontSize: 10, color: '#8C8880', textTransform: 'uppercase' }}>Meals</div>
              </div>
            </div>
          )}
          {completed.map(l => (
            <div key={l.id} style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1A17' }}>{l.foodType}</div>
                <StatusPill status={l.status} />
              </div>
              <div style={{ fontSize: 11, color: '#6B6860', marginBottom: 8 }}>🌱 {l.donorName} → 🤝 {l.claimedByName}</div>
              <div style={{ fontSize: 11, color: '#8C8880', marginBottom: 10 }}>📦 {l.quantity} {l.unit} · 📍 {(l.donorLocation || '').split(',')[0]}</div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontSize: 11, color: '#16A34A', fontWeight: 600 }}>
                ✅ Delivered successfully
              </div>
              <button onClick={() => { setRateTarget({ email: l.claimedBy || l.claimed_by, userId: l.claimed_by_user_id, name: l.claimedByName, listingId: l.id }); setModal('rate'); }}
                style={{ padding: '6px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.font }}>
                ⭐ Rate NGO
              </button>
            </div>
          ))}
        </>
      )}

      {/* ── RATINGS ── */}
      {tab === 'ratings' && (
        <>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>⭐ My Ratings</div>
          <div style={{ ...cardStyle({ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }) }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: '#1C1A17', fontFamily: T.display }}>{avgRating}</div>
            <div>
              <RatingStars rating={Math.round(Number(avgRating))} size={20} />
              <div style={{ fontSize: 12, color: '#8C8880', marginTop: 4 }}>{ratingsList.length} review{ratingsList.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          {ratingsList.length === 0 && <EmptyState icon="⭐" text="No ratings yet" />}
          {ratingsList.map(r => (
            <div key={r.id} style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontWeight: 600, color: '#1C1A17', fontSize: 13 }}>{r.reviewer}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <RatingStars rating={r.rating} size={12} />
                  <span style={{ color: '#6B6860', fontSize: 11 }}>{r.date}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#8C8880', fontStyle: 'italic' }}>"{r.comment}"</div>
            </div>
          ))}
        </>
      )}

      {/* ── MODALS ── */}
      {modal === 'pickup-detail' && selected && (
        <Modal title="Pickup Details" accent={ACCENT} onClose={() => setModal(null)}>
          <div style={{ background: '#F2F1EE', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1C1A17', marginBottom: 2 }}>{selected.foodType}</div>
            <div style={{ fontSize: 13, color: '#8C8880' }}>
              📦 {selected.quantity} {selected.unit}
              {selected.expiryTime && <> · <FreshnessBar expiryTime={selected.expiryTime} compact /></>}
            </div>
            {selected.notes && <div style={{ marginTop: 8, fontSize: 12, color: '#6B6860', borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>📝 {selected.notes}</div>}
          </div>
          <div style={{ fontSize: 11, color: '#8C8880', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 Pickup Location</div>
          <DelivContactCard color="#4ADE80" icon="🌱" role="Donor" name={selected.donorName} address={selected.donorLocation} phone={selected.donorPhone} />
          <div style={{ fontSize: 11, color: '#8C8880', fontWeight: 700, margin: '10px 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚩 Drop Location</div>
          <DelivContactCard color="#60A5FA" icon="🤝" role="NGO" name={selected.claimedByName} address={selected.ngoLocation} phone={selected.ngoPhone} highlight />
          <PrimaryButton label="✅ Accept This Pickup" accent={ACCENT} onClick={() => acceptPickup(selected)} style={{ marginTop: 16 }} />
        </Modal>
      )}

      {modal === 'active-detail' && selected && (
        <Modal title="Delivery Contacts" accent={ACCENT} onClose={() => setModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1C1A17', marginBottom: 14 }}>{selected.foodType}</div>
          <DelivContactCard color="#4ADE80" icon="🌱" role="Donor" name={selected.donorName} address={selected.donorLocation} phone={selected.donorPhone} />
          <div style={{ fontSize: 11, color: '#8C8880', fontWeight: 700, margin: '12px 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚩 Drop To (NGO)</div>
          <DelivContactCard color="#60A5FA" icon="🤝" role="NGO" name={selected.claimedByName} address={selected.ngoLocation} phone={selected.ngoPhone} highlight />
        </Modal>
      )}

      {modal === 'issue' && selected && (
        <ReportIssueModal
          listing={selected}
          userName={user?.name || user?.full_name || user?.email}
          onClose={() => { setModal(null); setSelected(null); }}
          onIssueCreated={(issue) => { setChatIssue(issue); }}
        />
      )}

      {modal === 'rate' && rateTarget && (
        <RateModal accent={ACCENT} targetName={rateTarget.name} onClose={() => setModal(null)} onSubmit={submitRating} />
      )}

      {/* Crisis Chat overlay */}
      {chatOpen && chatIssue && (
        <CrisisChat
          issue={chatIssue}
          senderName={user?.name || user?.full_name || user?.email || 'Delivery'}
          senderRole="delivery"
          onClose={() => { setChatOpen(false); setChatIssue(null); }}
        />
      )}
    </PageScroll>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function ActiveBanner({ listing: l, accent, onClick }) {
  const { color, label } = useFreshnessTimer(l.expiryTime || l.expiry_time);
  return (
    <div onClick={onClick} style={{ ...cardStyle({ cursor: 'pointer', borderColor: accent + '40', background: accent + '08' }) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1A17' }}>🚚 {l.foodType}</div>
          <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>
            {l.status === 'picked_up' ? 'Heading to NGO…' : 'Accepted — go pick up!'}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', borderRadius: 6, padding: '3px 8px' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function LeaderMini({ entry: e, index: i, myEmail, accent }) {
  return (
    <div style={{ ...cardStyle({ display: 'flex', alignItems: 'center', gap: 12 }), background: e.email === myEmail ? accent + '0a' : T.surface, borderColor: e.email === myEmail ? accent + '40' : T.border }}>
      <div style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{e.badge || e.rank}</div>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1C1A17' }}>
        {e.name}
        {e.email === myEmail && <span style={{ marginLeft: 8, fontSize: 10, background: accent + '20', color: accent, padding: '1px 7px', borderRadius: 10 }}>You</span>}
      </div>
      <div style={{ fontWeight: 700, color: accent }}>{e.deliveries} <span style={{ fontSize: 11, color: '#6B6860' }}>drops</span></div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B4842' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
      <div style={{ fontSize: 13 }}>Loading…</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#4B4842' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      {text}
    </div>
  );
}