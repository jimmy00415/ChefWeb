export const db = {
  bookings: new Map(),
  payments: new Map(),
  chats: [],
  analytics: []
};

export function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createConfirmationNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `CHEF-${y}-${seq}`;
}
