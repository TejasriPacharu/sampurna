// src/store/chatStore.js
// In-memory multi-party chat rooms keyed by issueId.
// One module instance = shared across every dashboard in the session.

const _rooms = {};       // issueId → { messages: [], subs: Set }
const _globalSubs = new Set();

function _room(issueId) {
  const k = String(issueId);
  if (!_rooms[k]) _rooms[k] = { messages: [], subs: new Set() };
  return _rooms[k];
}

function _emitRoom(issueId) {
  const r = _rooms[String(issueId)];
  if (!r) return;
  const snap = [...r.messages];
  r.subs.forEach(fn => fn(snap));
  _globalSubs.forEach(fn => fn(_summaries()));
}

function _summaries() {
  return Object.entries(_rooms).map(([id, r]) => ({
    issueId: id,
    count:   r.messages.length,
    unread:  r.messages.filter(m => !m.read).length,
    last:    r.messages[r.messages.length - 1] || null,
  }));
}

/** Send a message into a room. */
export function sendMessage({ issueId, listingId, senderName, senderRole, text }) {
  if (!String(text || '').trim()) return;
  _room(issueId).messages.push({
    id:         Date.now() + Math.random(),
    issueId:    String(issueId),
    listingId:  String(listingId || ''),
    senderName: senderName || 'Unknown',
    senderRole: senderRole || 'user',
    text:       String(text).trim(),
    timestamp:  new Date().toISOString(),
    read:       false,
  });
  _emitRoom(issueId);
}

/** Seed an automated system message (called from issueStore). */
export function systemMessage(issueId, text) {
  _room(issueId).messages.push({
    id:         Date.now() + Math.random(),
    issueId:    String(issueId),
    listingId:  '',
    senderName: 'System',
    senderRole: 'system',
    text:       String(text),
    timestamp:  new Date().toISOString(),
    read:       false,
  });
  _emitRoom(issueId);
}

/** Subscribe to a specific room. Fires immediately with current messages. */
export function subscribeRoom(issueId, fn) {
  const r = _room(issueId);
  r.subs.add(fn);
  fn([...r.messages]);
  return () => r.subs.delete(fn);
}

/** Subscribe to all-room summaries (badge counts). Fires immediately. */
export function subscribeGlobal(fn) {
  _globalSubs.add(fn);
  fn(_summaries());
  return () => _globalSubs.delete(fn);
}

/** Mark all messages in a room read (called when user opens chat). */
export function markRoomRead(issueId) {
  const r = _rooms[String(issueId)];
  if (!r) return;
  r.messages = r.messages.map(m => ({ ...m, read: true }));
  _emitRoom(issueId);
}

/** One-shot read for a room. */
export function getRoomMessages(issueId) {
  return [...(_rooms[String(issueId)]?.messages || [])];
}

/** One-shot read for summaries. */
export function getSummaries() { return _summaries(); }