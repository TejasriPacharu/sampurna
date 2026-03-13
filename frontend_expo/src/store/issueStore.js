// src/store/issueStore.js
// Singleton for delivery issues. Auto-raises when food expires mid-delivery.

import { systemMessage } from './chatStore';

const _store = { issues: [] };
const _subs  = new Set();
const _emit  = () => _subs.forEach(fn => fn([..._store.issues]));

function _create({ listingId, foodType, deliveryName, raisedBy, reason, isAuto }) {
  const id = Date.now();
  const issue = {
    id,
    listingId:    String(listingId || ''),
    foodType:     foodType     || 'Food listing',
    deliveryName: deliveryName || raisedBy || 'Delivery Partner',
    raisedBy:     raisedBy     || deliveryName || '',
    reason,
    status:       'open',
    raisedAt:     new Date().toISOString(),
    adminNote:    '',
    isAuto:       !!isAuto,
  };
  _store.issues = [issue, ..._store.issues];
  _emit();

  // Seed chat room with context message
  systemMessage(id, isAuto
    ? `⏰ AUTO-RAISED: "${foodType}" expired while in delivery by ${deliveryName || raisedBy}.\n` +
      `All parties — Donor, NGO, Delivery, Admin — please coordinate here.`
    : `🚨 Issue raised by ${raisedBy} (Delivery):\n${reason}\n\nFood: ${foodType}`
  );
  return issue;
}

/** Manual issue raised by delivery partner. */
export function raiseDeliveryIssue({ listingId, foodType, deliveryName, raisedBy, reason }) {
  return _create({ listingId, foodType, deliveryName, raisedBy, reason, isAuto: false });
}

/** Auto-raised when freshness window expires during active delivery. */
export function raiseAutoExpiredIssue({ listingId, foodType, deliveryName }) {
  // Don't duplicate auto-issues for same listing
  const exists = _store.issues.find(
    i => i.listingId === String(listingId) && i.isAuto && i.status === 'open'
  );
  if (exists) return exists;
  return _create({
    listingId,
    foodType,
    deliveryName: deliveryName || 'Delivery partner',
    raisedBy:     'System',
    reason:       '⏰ Food freshness window expired during active delivery — food may no longer be safe.',
    isAuto:       true,
  });
}

/** Admin resolves an issue. */
export function resolveIssue(issueId, adminNote) {
  _store.issues = _store.issues.map(i =>
    i.id === issueId
      ? { ...i, status:'resolved', adminNote: adminNote||'', resolvedAt: new Date().toISOString() }
      : i
  );
  _emit();
  systemMessage(issueId, `✅ Admin marked issue resolved.${adminNote ? ' Note: ' + adminNote : ''}`);
}

/** Returns true if listing already has an open auto-issue. */
export function hasOpenAutoIssue(listingId) {
  return _store.issues.some(
    i => i.listingId === String(listingId) && i.isAuto && i.status === 'open'
  );
}

/** Get issue for a specific listing (first open one). */
export function getIssueForListing(listingId) {
  return _store.issues.find(
    i => i.listingId === String(listingId) && i.status === 'open'
  ) || null;
}

/** Get or create a lightweight coordination room for proactive chat.
 *  Used by Donor/NGO to start a conversation before any issue is raised.
 *  Returns an issue-like object (isCoord: true) that CrisisChat can use. */
export function openCoordinationRoom({ listingId, foodType, initiatorName, initiatorRole }) {
  const key = String(listingId);
  // Reuse existing open issue/room if one exists
  const existing = _store.issues.find(i => i.listingId === key && i.status === 'open');
  if (existing) return existing;

  // Reuse an existing coord room (don't spam)
  const coord = _store.issues.find(i => i.listingId === key && i.isCoord);
  if (coord) return coord;

  const id = Date.now();
  const issue = {
    id,
    listingId: key,
    foodType:     foodType || 'Food listing',
    deliveryName: '',
    raisedBy:     initiatorName || initiatorRole || 'Unknown',
    reason:       `Coordination chat initiated by ${initiatorName} (${initiatorRole})`,
    status:       'open',
    raisedAt:     new Date().toISOString(),
    adminNote:    '',
    isAuto:       false,
    isCoord:      true,   // marks this as a proactive chat, not an issue
  };
  _store.issues = [issue, ..._store.issues];
  _emit();

  // Seed room with a friendly context message
  systemMessage(id,
    `💬 Coordination chat started by ${initiatorName} (${initiatorRole}) for "${foodType}".\n` +
    `All parties — Donor, NGO, Delivery, Admin — can join here.`
  );
  return issue;
}

export function getIssues() { return [..._store.issues]; }

export function subscribeIssues(fn) {
  _subs.add(fn);
  fn([..._store.issues]);
  return () => _subs.delete(fn);
}