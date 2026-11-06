import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { localDateString } from './date';

export const TIME_SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export default function ReadingForm({ reading, selectedDate, readings, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    date: selectedDate || localDateString(),
    timeSlot: 'morning_fasting',
    value: '',
  });
  const [error, setError] = useState('');
  const dailyLimitReached = !reading
    && readings.filter((item) => item.date === form.date).length >= TIME_SLOTS.length;

  useEffect(() => {
    setForm(reading
      ? { date: reading.date, timeSlot: reading.timeSlot, value: String(reading.value) }
      : { date: selectedDate || localDateString(), timeSlot: 'morning_fasting', value: '' });
    setError('');
  }, [reading, selectedDate]);

  useEffect(() => {
    if (!dailyLimitReached) setError('');
  }, [dailyLimitReached]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const result = await onSave(form);
    if (result?.error) setError(result.error);
    else if (!reading) setForm({ date: form.date, timeSlot: 'morning_fasting', value: '' });
  }

  return (
    <form className="reading-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          Date
          <input
            type="date"
            value={form.date}
            max={localDateString()}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            required
          />
        </label>
        <label>
          Time slot
          <select
            value={form.timeSlot}
            onChange={(event) => setForm({ ...form, timeSlot: event.target.value })}
          >
            {TIME_SLOTS.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
          </select>
        </label>
        <label>
          Glucose value
          <span className="input-with-unit">
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 105"
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
            />
            <span>mg/dL</span>
          </span>
        </label>
        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={busy || dailyLimitReached}>
            {busy ? <span className="spinner small" /> : reading ? <Check size={16} /> : <Plus size={16} />}
            {reading ? 'Save changes' : 'Add reading'}
          </button>
          {reading && <button className="button button-quiet" type="button" onClick={onCancel}><X size={16} /> Cancel</button>}
        </div>
      </div>
      {dailyLimitReached && (
        <p className="inline-info" role="status">
          You&apos;ve recorded all 4 readings for this day.
        </p>
      )}
      {error && <p className="inline-error" role="alert">{error}</p>}
      <p className="form-hint">Use a whole number between 40 and 600. One reading per time slot each day.</p>
    </form>
  );
}
