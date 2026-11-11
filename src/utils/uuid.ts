/**
 * Standard RFC 4122 v4 UUID generator and validator
 */

export function isUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Deterministic UUIDs for demo personas
export const DEMO_USER_UUIDS: Record<string, string> = {
  'user-organizer-1': '11111111-1111-4111-8111-111111111111',
  'user-organizer-2': '22222222-2222-4222-8222-222222222222',
  'user-attendee-1': '33333333-3333-4333-8333-333333333333',
  'user-admin-1': '44444444-4444-4444-8444-444444444444',
};

export function toValidUUID(id: string | null | undefined): string {
  if (!id) return generateUUID();
  if (isUUID(id)) return id;
  if (DEMO_USER_UUIDS[id]) return DEMO_USER_UUIDS[id];
  return generateUUID();
}
