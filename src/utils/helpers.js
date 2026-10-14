// ================= IDS =================
export const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// ================= DATES =================
export const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const MONTHS_LONG = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
// index = Date#getDay() (0 = Pazar)
export const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
export const WEEKDAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
// Week starts on Monday
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD in local time
export const dayKey = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC)
export const fromDayKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const startOfWeek = (date = new Date()) => {
  const d = startOfDay(date);
  const diff = (d.getDay() + 6) % 7;
  return addDays(d, -diff);
};

export const startOfMonth = (date = new Date()) => {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
};

export const isSameDay = (a, b) => dayKey(a) === dayKey(b);

export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatShortDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  if (isSameDay(d, today)) return 'Bugün';
  if (isSameDay(d, addDays(today, 1))) return 'Yarın';
  if (isSameDay(d, addDays(today, -1))) return 'Dün';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${WEEKDAYS[d.getDay()]}`;
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatShortDate(date)} · ${formatTime(date)}`;
};

// ================= DURATIONS =================
export const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export const formatDuration = (sec) => {
  const total = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(total / 3600);
  const m = Math.round((total % 3600) / 60);
  if (h) return m ? `${h} sa ${m} dk` : `${h} sa`;
  if (m) return `${m} dk`;
  return `${total} sn`;
};

// 75 -> "1:15"
export const formatSeconds = (sec) => {
  const total = Math.max(0, Math.round(sec || 0));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
};

// ================= NUMBERS =================
// Accepts both "12,5" and "12.5"
export const parseNum = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const fmtNum = (n, digits = 1) => {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  const r = Math.round(Number(n) * 10 ** digits) / 10 ** digits;
  return String(r).replace('.', ',');
};

export const fmtBig = (n) => {
  const v = Math.round(n || 0);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// ================= STRINGS =================
export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toLocaleUpperCase('tr-TR') || '?';

export const normalize = (s = '') => s.toLocaleLowerCase('tr-TR').trim();

export const withAlpha = (hex, alpha) => {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
};
