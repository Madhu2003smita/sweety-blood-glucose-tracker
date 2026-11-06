import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readingsToCsv } from '../src/csv.js';
import { shiftCalendarDate } from '../src/date.js';

test('exports real reading records with readable dates and slot labels', () => {
  const csv = readingsToCsv([
    { date: '2026-11-06', timeSlot: 'after_lunch', value: 123 },
    { date: '2026-11-07', timeSlot: 'morning_fasting', value: 98 },
  ]);
  assert.equal(csv, [
    '"Date","Time slot","Glucose (mg/dL)"',
    '"06 Nov 2026","After lunch","123"',
    '"07 Nov 2026","Morning (fasting)","98"',
  ].join('\r\n'));
});

test('escapes quotes in exported values', () => {
  const csv = readingsToCsv([{ date: '2026-11-06', timeSlot: 'after_lunch', value: '"123"' }]);
  assert.match(csv, /"""123"""/);
});

test('exports an empty history as a header-only CSV', () => {
  assert.equal(readingsToCsv([]), '"Date","Time slot","Glucose (mg/dL)"');
});

test('shifts selected dates across month, leap-day, and year boundaries', () => {
  assert.equal(shiftCalendarDate('2026-11-06', -1), '2026-11-05');
  assert.equal(shiftCalendarDate('2024-03-01', -1), '2024-02-29');
  assert.equal(shiftCalendarDate('2027-01-01', -1), '2026-12-31');
  assert.equal(shiftCalendarDate('2026-12-31', 1), '2027-01-01');
});
