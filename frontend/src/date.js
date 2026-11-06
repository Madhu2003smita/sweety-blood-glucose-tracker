export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function displayDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '';
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options);
}
