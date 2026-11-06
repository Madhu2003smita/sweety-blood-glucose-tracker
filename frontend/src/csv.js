import { displayDate } from './date.js';
import { TIME_SLOTS } from './timeSlots.js';

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function readingsToCsv(readings) {
  const rows = [
    ['Date', 'Time slot', 'Glucose (mg/dL)'],
    ...readings.map((reading) => [
      displayDate(reading.date),
      TIME_SLOTS.find((slot) => slot.value === reading.timeSlot)?.label || reading.timeSlot,
      reading.value,
    ]),
  ];
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}
