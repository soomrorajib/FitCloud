// Dates backend par UTC midnight par store hoti hain, isliye dikhate waqt bhi UTC use karte hain
// (warna kuch timezones mein date ek din aage/peeche dikhti hai).
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '-';

export const formatShortDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '';

// <input type="date"> ki value (YYYY-MM-DD)
export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

// User ki local date ka aaj (YYYY-MM-DD)
export const todayInput = () => new Date().toLocaleDateString('en-CA');

export const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

export const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
