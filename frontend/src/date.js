export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftCalendarDate(value, days) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function toLocalCalendarDate(value) {
  if (!value) return '';

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  }

  if (typeof value !== 'string') return null;
  const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/)?.[1];
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function displayDate(value, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const date = toLocalCalendarDate(value);
  return date ? date.toLocaleDateString('en-GB', options) : '';
}
