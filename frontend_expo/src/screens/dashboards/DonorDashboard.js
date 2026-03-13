// src/screens/dashboards/DonorDashboard.js
// ALL original code preserved. Live API flow added.

import { useState, useEffect, useCallback } from 'react';
import CrisisChat from '../../components/CrisisChat';
import { subscribeIssues, getIssueForListing, openCoordinationRoom } from '../../store/issueStore';
import { subscribeGlobal } from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { DONOR_LEADERBOARD } from '../../data/seedData';
import {
  T, PageScroll, TopBar, WelcomeCard, StatsRow, SectionTitle,
  DashboardTitle, ActionCard, TabBar, Modal, Input, Textarea,
  SelectInput, Checkbox, PrimaryButton, ErrorBox,
  StatusPill, RatingStars, StarPicker, RateModal, getTimeLeft, cardStyle,
} from '../../components/ui/ui';

const ACCENT = '#4ADE80';

const TABS = [
  { id:'home',        icon:'🏠', label:'Home'   },
  { id:'listings',    icon:'🍱', label:'Food'    },
  { id:'leaderboard', icon:'🏆', label:'Ranks'   },
  { id:'ratings',     icon:'⭐', label:'Reviews' },
];

export default function DonorDashboard({ navigation }) {
  // ── Original store bindings kept ─────────────────────────────
  const {
    user, logout,
    // original local-state bindings (kept for backward compat)
    listings: storeListings, addListing: storeAddListing,
    patchListing, ratings, addRating,
    // NEW: API-backed actions
    fetchDonorListings, addListing: apiAddListing,
    editListing, removeListing,
    listingsLoading, listingsError,
    fetchMyRatings, myRatings: apiRatings,
    fetchDonorLeaderboard, donorLeaderboard,
    rateUser, seedListings,
  } = useAuthStore();

  const [tab,        setTab]        = useState('home');
  const [modal,      setModal]      = useState(null);   // 'add' | 'detail' | 'rate' | 'edit' | 'delete-confirm'
  const [selected,   setSelected]   = useState(null);
  const [rateTarget, setRateTarget] = useState(null);
  const [form,       setForm]       = useState(emptyForm());
  const [err,        setErr]        = useState('');

  // NEW state
  const [ratingLoading,  setRatingLoading]  = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [deliveryChoice, setDeliveryChoice] = useState({}); // listingId → 'self' | 'platform'
  const [chatOpen,      setChatOpen]      = useState(false);
  const [chatIssue,     setChatIssue]     = useState(null);
  const [chatBadges,    setChatBadges]    = useState([]);
  const [issues,        setIssues]        = useState([]);

  useEffect(() => {
    const u1 = subscribeIssues(setIssues);
    const u2 = subscribeGlobal(setChatBadges);
    return () => { u1(); u2(); };
  }, []);

  const handleLogout = () => { logout(); navigation.replace('RoleSelection'); };

  // ── NEW: Load data on mount ───────────────────────────────────
  useEffect(() => {
    // Seed local data first so UI shows instantly even without backend
    const { INITIAL_LISTINGS } = require('../../data/seedData');
    seedListings(INITIAL_LISTINGS);
    fetchDonorListings();
    fetchMyRatings();
    fetchDonorLeaderboard();
  }, []);

  // Refresh listings when tab changes to 'listings'
  useEffect(() => {
    if (tab === 'listings') fetchDonorListings();
    if (tab === 'ratings')  fetchMyRatings();
    if (tab === 'leaderboard') fetchDonorLeaderboard();
  }, [tab]);

  // ── Derived — works with both API and local store data ────────
  // API listings from store; fall back to local seed for web preview
  const myListings   = (storeListings || []).filter(l => l.donor_email === user?.email || l.donorEmail === user?.email);
  const active       = myListings.filter(l => l.status === 'active').length;
  const totalMeals   = myListings.reduce((s, l) => s + (l.status !== 'active' ? (l.quantity || 0) : 0), 0);

  // Ratings: prefer API, fall back to local
  const localRatings = ratings?.[user?.email] || [];
  const ratingsList  = apiRatings?.length ? apiRatings : localRatings;
  const avgRating    = ratingsList.length
    ? (ratingsList.reduce((s, r) => s + r.rating, 0) / ratingsList.length).toFixed(1)
    : '—';

  // Leaderboard: prefer API, fall back to seed
  const leaderData = donorLeaderboard?.length ? donorLeaderboard : DONOR_LEADERBOARD;

  // Filter listings by status
  const filteredListings = filterStatus === 'all'
    ? myListings
    : myListings.filter(l => l.status === filterStatus);

  // ── Handlers ─────────────────────────────────────────────────
  const handleAdd = async () => {
    setErr('');
    if (!form.foodType || !form.quantity || !form.preparedTime || !form.expiryTime || !form.location)
      return setErr('Please fill all required fields.');

    // Build FormData for API (also works as plain object for local store)
    const formData = new FormData();
    formData.append('food_type',        form.foodType);
    formData.append('quantity',         form.quantity);
    formData.append('unit',             form.unit);
    formData.append('prepared_time',    form.preparedTime);
    formData.append('expiry_time',      form.expiryTime);
    formData.append('location',         form.location);
    formData.append('pickup_available', form.pickupAvailable ? 'true' : 'false');
    formData.append('notes',            form.notes || '');
    formData.append('delivery_mode',    form.deliveryMode || 'platform'); // NEW: self | platform

    try {
      // Try API first
      await apiAddListing(formData);
    } catch {
      // Fallback: local store (for dev/preview)
      storeAddListing({
        id:             'L' + Date.now(),
        donorName:      user.name,
        donorEmail:     user.email,
        donor_email:    user.email,
        foodType:       form.foodType,
        food_type:      form.foodType,
        quantity:       Number(form.quantity),
        unit:           form.unit,
        preparedTime:   form.preparedTime,
        prepared_time:  form.preparedTime,
        expiryTime:     form.expiryTime,
        expiry_time:    form.expiryTime,
        location:       form.location,
        pickupAvailable:   form.pickupAvailable,
        pickup_available:  form.pickupAvailable,
        delivery_mode:  form.deliveryMode || 'platform',
        notes:          form.notes,
        status:         'active',
        claimedBy: null, claimedByName: null,
        deliveryId: null, deliveryName: null,
        photo: null,
      });
    }
    setForm(emptyForm());
    setModal(null);
  };

  // NEW: Edit listing
  const handleEdit = async () => {
    setErr('');
    if (!form.foodType || !form.quantity || !form.location) return setErr('Fill required fields.');
    try {
      await editListing(selected.id, {
        food_type:       form.foodType,
        quantity:        Number(form.quantity),
        unit:            form.unit,
        expiry_time:     form.expiryTime,
        location:        form.location,
        notes:           form.notes,
        pickup_available: form.pickupAvailable,
      });
      setModal(null);
    } catch { setErr('Failed to update listing.'); }
  };

  // NEW: Delete listing
  const handleDelete = async () => {
    try {
      await removeListing(deleteTarget.id);
      setDeleteTarget(null); setModal(null);
    } catch { setErr('Failed to delete listing.'); }
  };

  // NEW: Delivery mode per listing (self vs platform)
  const toggleDeliveryMode = async (listing, mode) => {
    setDeliveryChoice(d => ({ ...d, [listing.id]: mode }));
    try {
      await editListing(listing.id, { delivery_mode: mode });
    } catch {
      // optimistic update already applied above, silently fail
    }
  };

  // Original submit rating (kept + enhanced)
  const openChat = (listing) => {
    const issue = getIssueForListing(listing.id) || openCoordinationRoom({
      listingId:     listing.id,
      foodType:      listing.food_type || listing.foodType || 'Food',
      initiatorName: user?.org_name || user?.name || user?.email || 'Donor',
      initiatorRole: 'donor',
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
    setRatingLoading(true);
    try {
      await rateUser({
        rated_user_id: rateTarget.userId || rateTarget.email,
        listing_id:    rateTarget.listingId,
        rating:        val,
        comment,
      });
    } catch {
      if (typeof addRating === 'function') {
        addRating(rateTarget.email, {
          id: Date.now(), reviewer: user?.name, role: 'donor',
          rating: val, comment, date: 'Today',
        });
      }
    } finally {
      setRatingLoading(false);
    }
    setRateTarget(null); setModal(null);
    try { fetchMyRatings(); } catch {}
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <PageScroll>
      <TopBar onLogout={handleLogout} />
      <WelcomeCard icon="🌱" name={user?.name} email={user?.email} accent={ACCENT} tag="✓ Donor" />
      <TabBar tabs={TABS} active={tab} onChange={setTab} accent={ACCENT} />

      {/* ── HOME ── */}
      {tab === 'home' && (
        <>
          <DashboardTitle title="Donor Dashboard" subtitle="Share surplus food, feed communities" accent={ACCENT} />
          <StatsRow accent={ACCENT} stats={[
            { icon:'🍱', label:'Active',       value: active      },
            { icon:'🤝', label:'Meals Shared', value: totalMeals  },
            { icon:'⭐', label:'Avg Rating',   value: avgRating   },
          ]} />
          <SectionTitle>Quick Actions</SectionTitle>
          <ActionCard icon="➕" label="List Surplus Food"    sublabel="Add a new food donation"           accent={ACCENT} onClick={() => { setForm(emptyForm()); setModal('add'); }} badge="New" badgeColor={ACCENT} />
          <ActionCard icon="🍱" label="My Listings"          sublabel="View & manage your listings"       accent={ACCENT} onClick={() => setTab('listings')}        />
          <ActionCard icon="🏆" label="Leaderboard"          sublabel="See top donors this month"         accent={ACCENT} onClick={() => setTab('leaderboard')}     />
          <ActionCard icon="⭐" label="Ratings & Feedback"  sublabel="Reviews from NGOs & delivery"      accent={ACCENT} onClick={() => setTab('ratings')}         />

          {/* NEW: Live feed — most recent active listing by others */}
          {myListings.filter(l => l.status === 'claimed' || l.status === 'picked_up').length > 0 && (
            <>
              <SectionTitle>🔴 Live Updates</SectionTitle>
              {myListings.filter(l => ['claimed','picked_up'].includes(l.status)).map(l => (
                <LiveUpdateBanner key={l.id} listing={l} accent={ACCENT} onClick={() => { setSelected(l); setModal('detail'); }} />
              ))}
            </>
          )}
        </>
      )}

      {/* ── LISTINGS ── */}
      {tab === 'listings' && (
        <>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT }}>My Listings</div>
            <button onClick={() => { setForm(emptyForm()); setModal('add'); }}
              style={{ background: ACCENT, border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:700, color:'#FFFFFF', cursor:'pointer' }}>
              + Add
            </button>
          </div>

          {/* NEW: Status filter */}
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {['all','active','claimed','picked_up','delivered','expired'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:11, fontWeight:600, fontFamily: T.font,
                  background: filterStatus === s ? ACCENT : T.surface2,
                  color: filterStatus === s ? '#FFFFFF' : '#666' }}>
                {s === 'all' ? 'All' : s.replace('_',' ')}
              </button>
            ))}
          </div>

          {listingsLoading && <LoadingState />}
          {!listingsLoading && filteredListings.length === 0 && <EmptyState icon="🍱" text="No listings yet — start sharing!" />}
          {filteredListings.map(l => (
            <ListingRow key={l.id} listing={l} accent={ACCENT}
              deliveryChoice={deliveryChoice[l.id] || l.delivery_mode || 'platform'}
              onToggleDelivery={(mode) => toggleDeliveryMode(l, mode)}
              onClick={() => { setSelected(l); setModal('detail'); }}
              onEdit={l.status === 'active' ? () => {
                setSelected(l);
                setForm({
                  foodType:       l.food_type || l.foodType,
                  quantity:       String(l.quantity),
                  unit:           l.unit || 'portions',
                  preparedTime:   l.prepared_time || l.preparedTime || '',
                  expiryTime:     l.expiry_time || l.expiryTime || '',
                  location:       l.location,
                  pickupAvailable: l.pickup_available ?? l.pickupAvailable ?? true,
                  deliveryMode:   l.delivery_mode || 'platform',
                  notes:          l.notes || '',
                });
                setModal('edit');
              } : null}
              onDelete={l.status === 'active' ? () => { setDeleteTarget(l); setModal('delete-confirm'); } : null}
              onRate={l.status === 'delivered' && (l.deliveryId || l.delivery_id)
                ? () => { setRateTarget({ email: l.deliveryId || l.delivery_id, userId: l.delivery_user_id, name: l.deliveryName || l.delivery_name, listingId: l.id }); setModal('rate'); }
                : null}
            
                onOpenChat={openChat}
                chatBadge={getChatBadge(l.id)}
              />
          ))}
        </>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <>
          <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT, marginBottom:4 }}>🏆 Donor Leaderboard</div>
          <div style={{ color: '#8C8880', fontSize:12, marginBottom:20 }}>Top food donors this month</div>
          {leaderData.map((e, i) => (
            <LeaderRow key={e.rank || e.id || i} entry={e} index={i} myEmail={user?.email} accent={ACCENT} valueKey="meals" valueLabel="meals" />
          ))}
        </>
      )}

      {/* ── RATINGS ── */}
      {tab === 'ratings' && (
        <>
          <div style={{ fontFamily: T.display, fontSize:18, fontWeight:700, color: ACCENT, marginBottom:12 }}>⭐ Your Ratings</div>
          <RatingSummary avgRating={avgRating} count={ratingsList.length} />
          {ratingsList.length === 0 && <EmptyState icon="⭐" text="No ratings yet" />}
          {ratingsList.map(r => <ReviewCard key={r.id} review={r} />)}
        </>
      )}

      {/* ── MODALS ── */}

      {/* ADD listing modal */}
      {modal === 'add' && (
        <Modal title="List Surplus Food" accent={ACCENT} onClose={() => setModal(null)}>
          <Input label="Food Type" required placeholder="e.g. Biryani, Bread…" value={form.foodType} onChange={e => setForm(f => ({ ...f, foodType: e.target.value }))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Input label="Quantity" required type="number" placeholder="20" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <SelectInput label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {['portions','kg','litres','packets','boxes'].map(u => <option key={u}>{u}</option>)}
            </SelectInput>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Input label="Prepared Time" required type="datetime-local" value={form.preparedTime} onChange={e => setForm(f => ({ ...f, preparedTime: e.target.value }))} />
            <Input label="Expiry Time"   required type="datetime-local" value={form.expiryTime}   onChange={e => setForm(f => ({ ...f, expiryTime:   e.target.value }))} />
          </div>
          <Input label="Pickup Location" required placeholder="Street address, landmark…" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <Textarea label="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Checkbox label="🚗 Pickup available at my location" checked={form.pickupAvailable} onChange={e => setForm(f => ({ ...f, pickupAvailable: e.target.checked }))} />

          {/* NEW: Delivery mode selector */}
          <div style={{ marginTop:12, marginBottom:4, fontSize:12, color: '#8C8880', fontWeight:600 }}>DELIVERY MODE</div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            {[['platform','🚴 Assign Delivery Partner'],['self','🚗 I will self-deliver']].map(([mode, label]) => (
              <button key={mode} onClick={() => setForm(f => ({ ...f, deliveryMode: mode }))}
                style={{ flex:1, padding:'9px', borderRadius:10, border:`1px solid ${form.deliveryMode===mode ? ACCENT+'60' : T.border2}`,
                  background: form.deliveryMode===mode ? ACCENT+'15' : T.surface2,
                  color: form.deliveryMode===mode ? ACCENT : '#666', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily: T.font }}>
                {label}
              </button>
            ))}
          </div>

          <ErrorBox message={err || listingsError} />
          <PrimaryButton label="🌱 Submit Listing" accent={ACCENT} onClick={handleAdd} />
        </Modal>
      )}

      {/* EDIT listing modal */}
      {modal === 'edit' && selected && (
        <Modal title="Edit Listing" accent={ACCENT} onClose={() => setModal(null)}>
          <Input label="Food Type" required value={form.foodType} onChange={e => setForm(f => ({ ...f, foodType: e.target.value }))} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Input label="Quantity" required type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
            <SelectInput label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
              {['portions','kg','litres','packets','boxes'].map(u => <option key={u}>{u}</option>)}
            </SelectInput>
          </div>
          <Input label="Expiry Time" type="datetime-local" value={form.expiryTime} onChange={e => setForm(f => ({ ...f, expiryTime: e.target.value }))} />
          <Input label="Pickup Location" required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <Checkbox label="🚗 Pickup available" checked={form.pickupAvailable} onChange={e => setForm(f => ({ ...f, pickupAvailable: e.target.checked }))} />
          <ErrorBox message={err} />
          <PrimaryButton label="💾 Save Changes" accent={ACCENT} onClick={handleEdit} />
        </Modal>
      )}

      {/* DETAIL modal */}
      {modal === 'detail' && selected && (
        <Modal title="Listing Details" accent={ACCENT} onClose={() => setModal(null)}>
          <DetailRows listing={selected} />
          {/* NEW: NGO + Delivery info blocks */}
          {(selected.claimedByName || selected.claimed_by_name) && (
            <InfoBanner color="#60A5FA" text={`🤝 Claimed by: ${selected.claimedByName || selected.claimed_by_name}`} />
          )}
          {(selected.deliveryName || selected.delivery_name) && (
            <InfoBanner color="#FBBF24" text={`🚴 Delivery Partner: ${selected.deliveryName || selected.delivery_name}`} />
          )}
          {/* NEW: Delivery journey tracker */}
          {['claimed','picked_up','delivered'].includes(selected.status) && (
            <DeliveryTracker listing={selected} accent={ACCENT} />
          )}
        </Modal>
      )}

      {/* DELETE confirm modal */}
      {modal === 'delete-confirm' && deleteTarget && (
        <Modal title="Remove Listing?" accent="#EF4444" onClose={() => setModal(null)}>
          <div style={{ fontSize:14, color:'#8C8880', marginBottom:20, lineHeight:1.6 }}>
            Are you sure you want to remove <strong style={{ color: '#1C1A17' }}>{deleteTarget.food_type || deleteTarget.foodType}</strong>? This cannot be undone.
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setModal(null)} style={{ flex:1, padding:11, background: '#F2F1EE', border:'1px solid #D6D2CA', borderRadius:10, color:'#6B6860', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button onClick={handleDelete} style={{ flex:1, padding:11, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, color:'#DC2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>Delete</button>
          </div>
        </Modal>
      )}

      {modal === 'rate' && rateTarget && (
        <RateModal accent={ACCENT} targetName={rateTarget.name} onClose={() => setModal(null)} onSubmit={submitRating} />
      )}

      {/* Crisis Chat overlay */}
      {chatOpen && chatIssue && (
        <CrisisChat
          issue={chatIssue}
          senderName={user?.org_name || user?.name || user?.email || 'Donor'}
          senderRole="donor"
          onClose={() => { setChatOpen(false); setChatIssue(null); }}
        />
      )}
    </PageScroll>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function ListingRow({ listing: l, accent, onClick, onEdit, onDelete, onRate, deliveryChoice, onToggleDelivery, onOpenChat, chatBadge }) {
  const tl = getTimeLeft(l.expiry_time || l.expiryTime);
  const foodName = l.food_type || l.foodType;
  const claimedName = l.claimed_by_name || l.claimedByName;
  const delivName = l.delivery_name || l.deliveryName;

  return (
    <div style={{ ...cardStyle(), cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent + '40'}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>

      <div onClick={onClick} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:15, fontWeight:700, color: '#1C1A17' }}>{foodName}</div>
        <StatusPill status={l.status} />
      </div>

      <div onClick={onClick} style={{ fontSize:12, color:'#6B6860', display:'flex', gap:14, flexWrap:'wrap', marginBottom:10 }}>
        <span>📦 {l.quantity} {l.unit}</span>
        <span style={{ color: tl.color }}>⏱ {tl.text}</span>
        <span>📍 {(l.location || '').split(',')[0]}</span>
        {claimedName && <span style={{ color:'#2563EB' }}>🤝 {claimedName}</span>}
      </div>

      {/* Delivery partner info */}
      {delivName && (
        <div style={{ fontSize:11, color:'#D97706', marginBottom:8, background:'#FFFBEB', padding:'5px 9px', borderRadius:7 }}>
          🚴 {delivName} • {l.status === 'picked_up' ? 'On the way!' : 'Assigned'}
        </div>
      )}

      {/* NEW: Delivery mode toggle (only when active) */}
      {l.status === 'active' && (
        <div style={{ display:'flex', gap:6, marginBottom:10 }}>
          {[['platform','🚴 Platform'],['self','🚗 Self']].map(([mode, label]) => (
            <button key={mode}
              onClick={e => { e.stopPropagation(); onToggleDelivery(mode); }}
              style={{ padding:'4px 10px', borderRadius:7, border:`1px solid ${deliveryChoice===mode ? accent+'60' : T.border2}`,
                background: deliveryChoice===mode ? accent+'12' : 'transparent',
                color: deliveryChoice===mode ? accent : '#8C8880', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily: T.font }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Action row */}
      <div style={{ display:'flex', gap:6 }}>
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            style={{ padding:'5px 12px', background: accent+'12', border:`1px solid ${accent}30`, borderRadius:7, color: accent, fontSize:11, fontWeight:600, cursor:'pointer' }}>
            ✏️ Edit
          </button>
        )}
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ padding:'5px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:7, color:'#DC2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
            🗑 Remove
          </button>
        )}
        {onRate && (
          <button onClick={e => { e.stopPropagation(); onRate(); }}
            style={{ padding:'5px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, color:'#D97706', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            ⭐ Rate Delivery
          </button>
        )}
        {onOpenChat && ['claimed','picked_up','delivered'].includes(l.status) && (() => {
          const issue = getIssueForListing(l.id);
          const isIssue = issue && !issue.isCoord;
          return (
            <button onClick={e => { e.stopPropagation(); onOpenChat(l); }}
              style={{
                padding:'5px 12px',
                background: isIssue ? '#EF444412' : '#A78BFA15',
                border: `1px solid ${isIssue ? '#EF444435' : '#A78BFA40'}`,
                borderRadius:7,
                color: isIssue ? '#EF4444' : '#A78BFA',
                fontSize:11, fontWeight:700, cursor:'pointer',
              }}>
              {isIssue ? '🚨' : '💬'}{chatBadge > 0 ? ` (${chatBadge})` : isIssue ? ' Crisis Chat' : ' Chat'}
            </button>
          );
        })()}
      </div>
    </div>
  );
}

// NEW: Live update banner for home tab
function LiveUpdateBanner({ listing: l, accent, onClick }) {
  const icons = { claimed:'🤝', picked_up:'🚴', delivered:'✅' };
  const msgs  = {
    claimed:   `${l.claimed_by_name || l.claimedByName} claimed your food`,
    picked_up: `${l.delivery_name  || l.deliveryName} picked up — on the way!`,
    delivered: 'Successfully delivered 🎉',
  };
  return (
    <div onClick={onClick} style={{ ...cardStyle({ cursor:'pointer', borderColor: accent+'40', background: accent+'08' }) }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color: '#1C1A17' }}>{icons[l.status]} {l.food_type || l.foodType}</div>
          <div style={{ fontSize:11, color: accent, marginTop:2 }}>{msgs[l.status]}</div>
        </div>
        <StatusPill status={l.status} />
      </div>
    </div>
  );
}

// NEW: 4-step delivery journey tracker
function DeliveryTracker({ listing: l, accent }) {
  const steps = [
    { label:'Listed',    done: true },
    { label:'Claimed',   done: ['claimed','picked_up','delivered'].includes(l.status) },
    { label:'Picked Up', done: ['picked_up','delivered'].includes(l.status) },
    { label:'Delivered', done: l.status === 'delivered' },
  ];
  return (
    <div style={{ marginTop:16, padding:14, background: '#F2F1EE', borderRadius:12 }}>
      <div style={{ fontSize:11, color:'#8C8880', fontWeight:700, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>Delivery Journey</div>
      <div style={{ display:'flex', alignItems:'flex-start' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display:'flex', alignItems:'center', flex:1 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:26, height:26, borderRadius:'50%',
                background: step.done ? accent : T.border,
                border: `2px solid ${step.done ? accent : T.border2}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, color: step.done ? '#FFFFFF' : '#444', fontWeight:700 }}>
                {step.done ? '✓' : i+1}
              </div>
              <div style={{ fontSize:9, color: step.done ? accent : '#444', textAlign:'center', whiteSpace:'nowrap' }}>{step.label}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex:1, height:2, background: step.done && steps[i+1].done ? accent : T.border, margin:'0 3px', marginBottom:18 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyForm() {
  return { foodType:'', quantity:'', unit:'portions', preparedTime:'', expiryTime:'', location:'', pickupAvailable:true, deliveryMode:'platform', notes:'' };
}

function DetailRows({ listing: l }) {
  const rows = [
    ['🍱 Food',       l.food_type || l.foodType],
    ['📦 Quantity',   `${l.quantity} ${l.unit}`],
    ['📍 Location',   l.location],
    ['🕐 Prepared',   new Date(l.prepared_time || l.preparedTime).toLocaleString()],
    ['⏰ Expires',    new Date(l.expiry_time   || l.expiryTime  ).toLocaleString()],
    ['🚗 Pickup',     (l.pickup_available ?? l.pickupAvailable) ? 'Yes' : 'No'],
    ['🚴 Delivery',   l.delivery_mode === 'self' ? 'Self-delivery' : 'Platform delivery'],
  ];
  return (
    <>
      {rows.map(([label, val]) => (
        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #E3E0D9' }}>
          <span style={{ color: '#8C8880', fontSize:13 }}>{label}</span>
          <span style={{ fontWeight:600, color: '#1C1A17', fontSize:13 }}>{val}</span>
        </div>
      ))}
      <div style={{ padding:'10px 0', display:'flex', justifyContent:'space-between' }}>
        <span style={{ color: '#8C8880', fontSize:13 }}>Status</span>
        <StatusPill status={l.status} />
      </div>
      {l.notes && <div style={{ marginTop:10, background: '#F2F1EE', borderRadius:10, padding:12, fontSize:13, color:'#8C8880' }}>📝 {l.notes}</div>}
    </>
  );
}

function InfoBanner({ color, text }) {
  return <div style={{ marginTop:10, background: color+'15', border:`1px solid ${color}30`, borderRadius:10, padding:12, fontSize:13, fontWeight:600, color }}>{text}</div>;
}

function LoadingState() {
  return (
    <div style={{ textAlign:'center', padding:'40px 0', color:'#4B4842' }}>
      <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
      <div style={{ fontSize:13 }}>Loading listings…</div>
    </div>
  );
}

export function LeaderRow({ entry: e, index: i, myEmail, accent, valueKey, valueLabel }) {
  return (
    <div style={{ ...cardStyle({ display:'flex', alignItems:'center', gap:14 }),
      background: e.email === myEmail ? accent + '0a' : T.surface,
      borderColor: e.email === myEmail ? accent + '40' : T.border }}>
      <div style={{ width:34, height:34, borderRadius:'50%', background: i < 3 ? '#FBBF2415' : T.surface2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
        {e.badge || e.rank}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600, color: '#1C1A17', fontSize:14 }}>
          {e.name}
          {e.email === myEmail && <span style={{ marginLeft:8, fontSize:10, background: accent + '20', color: accent, padding:'1px 7px', borderRadius:10 }}>You</span>}
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontWeight:700, color: accent, fontSize:18 }}>{e[valueKey]}</div>
        <div style={{ fontSize:10, color:'#6B6860' }}>{valueLabel}</div>
      </div>
    </div>
  );
}

function RatingSummary({ avgRating, count }) {
  return (
    <div style={{ ...cardStyle({ display:'flex', gap:20, alignItems:'center', marginBottom:20 }) }}>
      <div style={{ fontSize:40, fontWeight:800, color: '#1C1A17', fontFamily: T.display }}>{avgRating}</div>
      <div>
        <RatingStars rating={Math.round(Number(avgRating))} size={20} />
        <div style={{ fontSize:12, color: '#8C8880', marginTop:4 }}>{count} review{count !== 1 ? 's' : ''}</div>
      </div>
    </div>
  );
}

function ReviewCard({ review: r }) {
  return (
    <div style={cardStyle()}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontWeight:600, color: '#1C1A17', fontSize:13 }}>{r.reviewer}</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <RatingStars rating={r.rating} size={12} />
          <span style={{ color:'#6B6860', fontSize:11 }}>{r.date}</span>
        </div>
      </div>
      <div style={{ fontSize:13, color:'#8C8880', fontStyle:'italic' }}>"{r.comment}"</div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return <div style={{ textAlign:'center', padding:'60px 0', color:'#4B4842' }}><div style={{ fontSize:36, marginBottom:10 }}>{icon}</div>{text}</div>;
}