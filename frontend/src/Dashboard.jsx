import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, CalendarDays, Droplets, HeartPulse, LogOut, Pencil, Plus, Sparkles, Trash2, TrendingUp } from 'lucide-react';
import { withToken } from './api';
import { displayDate, localDateString } from './date';
import ReadingForm, { TIME_SLOTS } from './ReadingForm';
import ReportCard from './ReportCard';

function slotLabel(value) {
  return TIME_SLOTS.find((slot) => slot.value === value)?.label || value;
}

function friendlyError(error) {
  if (error.response?.data?.message) return error.response.data.message;
  const fieldErrors = error.response?.data?.errors;
  if (fieldErrors) return Object.values(fieldErrors).join(' ');
  return 'We could not complete that request. Please try again.';
}

export default function Dashboard({ user, token, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(localDateString());
  const [readings, setReadings] = useState([]);
  const [reports, setReports] = useState({});
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const client = useMemo(() => withToken(token), [token]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const [readingResponse, daily, monthToDate, monthly] = await Promise.all([
        client.get('/readings'),
        client.get('/reports/daily', { params: { date: selectedDate } }),
        client.get('/reports/month-to-date', { params: { date: selectedDate } }),
        client.get('/reports/monthly', { params: { date: selectedDate } }),
      ]);
      setReadings(readingResponse.data.readings);
      setReports({ daily: daily.data, monthToDate: monthToDate.data, monthly: monthly.data });
    } catch (error) {
      setPageError(friendlyError(error));
    } finally {
      setLoading(false);
    }
  }, [client, selectedDate]);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveReading(payload) {
    setSaving(true);
    try {
      if (editing) await client.put(`/readings/${editing.id}`, payload);
      else await client.post('/readings', payload);
      setEditing(null);
      await loadData();
      return {};
    } catch (error) {
      return { error: friendlyError(error) };
    } finally {
      setSaving(false);
    }
  }

  async function deleteReading(reading) {
    if (!window.confirm(`Delete the ${slotLabel(reading.timeSlot).toLowerCase()} reading of ${reading.value} mg/dL?`)) return;
    setPageError('');
    try {
      await client.delete(`/readings/${reading.id}`);
      if (editing?.id === reading.id) setEditing(null);
      await loadData();
    } catch (error) {
      setPageError(friendlyError(error));
    }
  }

  const todayReadings = readings.filter((reading) => reading.date === selectedDate);
  const currentDaily = reports.daily;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Sweety dashboard"><span className="brand-mark"><HeartPulse size={21} /></span><span>Sweety</span></a>
        <div className="topbar-right">
          <span className="secure-label"><span className="secure-dot" /> PRIVATE & SECURE</span>
          <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
          <span className="user-name">{user.name}</span>
          <button className="icon-button logout-button" type="button" onClick={onLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="welcome-row">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> YOUR PERSONAL HEALTH SPACE</p>
            <h1>Hello, {user.name.split(' ')[0]} <span className="wave">✦</span></h1>
            <p className="welcome-copy">Every check-in is a step toward understanding your health.</p>
          </div>
          <label className="date-picker">
            <CalendarDays size={17} />
            <span>Viewing</span>
            <input type="date" value={selectedDate} max={localDateString()} onChange={(event) => setSelectedDate(event.target.value)} aria-label="Select report date" />
          </label>
        </section>

        {pageError && <div className="alert alert-error page-alert" role="alert">{pageError}<button type="button" onClick={() => setPageError('')}>Dismiss</button></div>}

        <section className="summary-grid" aria-label="Daily summary">
          <article className="summary-card summary-primary">
            <div className="summary-top"><span className="summary-icon"><Droplets size={18} /></span><span className="summary-caption">SELECTED CHECK-INS</span></div>
            <div className="summary-value">{loading ? '—' : `${currentDaily?.total || 0}`}<span> / 4</span></div>
            <p>{todayReadings.length ? `Readings on ${displayDate(selectedDate, { month: 'short', day: 'numeric' })}` : 'A gentle reminder to check in'}</p>
            <div className="progress-track"><span style={{ width: `${Math.min(todayReadings.length * 25, 100)}%` }} /></div>
          </article>
          <article className="summary-card">
            <div className="summary-top"><span className="summary-icon summary-icon-blue"><Activity size={18} /></span><span className="summary-caption">DAILY AVERAGE</span></div>
            <div className="summary-value">{loading || currentDaily?.average == null ? '—' : Number(currentDaily.average).toFixed(1)}<span>{currentDaily?.average == null ? '' : ' mg/dL'}</span></div>
            <p>For your selected date</p>
          </article>
          <article className="summary-card">
            <div className="summary-top"><span className="summary-icon summary-icon-lilac"><TrendingUp size={18} /></span><span className="summary-caption">DAILY RANGE</span></div>
            <div className="summary-value range-value">{loading || currentDaily?.total === 0 ? '—' : <>{currentDaily?.lowest}<span> – </span>{currentDaily?.highest}</>}</div>
            <p>{currentDaily?.total ? 'Lowest to highest · mg/dL' : 'Your range will appear here'}</p>
          </article>
        </section>

        <section className="reports-section">
          <div className="section-heading">
            <div><p className="eyebrow">YOUR PATTERNS</p><h2>Reports at a glance</h2></div>
            <span className="section-date"><CalendarDays size={15} /> {displayDate(selectedDate)}</span>
          </div>
          <div className="reports-grid">
            {['daily', 'monthToDate', 'monthly'].map((type) => (
              <ReportCard key={type} type={type} report={reports[type]} loading={loading} />
            ))}
          </div>
        </section>

        <section className="workspace-grid">
          <article className="panel add-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">{editing ? 'UPDATE ENTRY' : 'DAILY CHECK-IN'}</p><h2>{editing ? 'Edit reading' : 'Add a reading'}</h2></div>
              <span className="panel-icon"><Plus size={19} /></span>
            </div>
            <p className="panel-description">{editing ? 'Update the details for this glucose check-in.' : 'Record a glucose reading to keep your history up to date.'}</p>
            <ReadingForm
              reading={editing}
              selectedDate={selectedDate}
              readings={readings}
              onSave={saveReading}
              onCancel={() => setEditing(null)}
              busy={saving}
            />
            <div className="gentle-note"><HeartPulse size={16} /><span>There’s no perfect number. Your care team can help you understand what’s right for you.</span></div>
          </article>

          <article className="panel history-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">YOUR RECORD</p><h2>Reading history</h2></div>
              <span className="history-count">{readings.length} {readings.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            {loading ? (
              <div className="table-state"><span className="spinner small" /> Loading your readings…</div>
            ) : readings.length === 0 ? (
              <div className="history-empty"><div className="empty-illustration"><Droplets size={22} /></div><strong>Your story starts here</strong><span>Add your first reading and it’ll show up here.</span></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Time slot</th><th>Glucose</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr key={reading.id}>
                        <td>{displayDate(reading.date, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td><span className="slot-pill">{slotLabel(reading.timeSlot)}</span></td>
                        <td><strong className="reading-number">{reading.value}</strong><span className="unit"> mg/dL</span></td>
                        <td className="row-actions">
                          <button className="icon-button" type="button" onClick={() => setEditing(reading)} aria-label={`Edit ${slotLabel(reading.timeSlot)} reading`} title="Edit"><Pencil size={15} /></button>
                          <button className="icon-button delete-action" type="button" onClick={() => deleteReading(reading)} aria-label={`Delete ${slotLabel(reading.timeSlot)} reading`} title="Delete"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
        <footer className="dashboard-footer"><span><HeartPulse size={15} /> A little care, every day.</span><span>Sweety is a tracking tool, not a medical diagnosis.</span></footer>
      </main>
    </div>
  );
}
