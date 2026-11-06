import { Activity, CalendarDays, ChevronRight, Heart, MoonStar, Sun } from 'lucide-react';
import { displayDate } from './date';
import { TIME_SLOTS } from './ReadingForm';

const reportConfig = {
  daily: { label: 'Daily report', icon: Sun, description: 'A closer look at your selected day.' },
  monthToDate: { label: 'Month to date', icon: CalendarDays, description: 'From the 1st through your selected date.' },
  monthly: { label: 'Previous month', icon: MoonStar, description: 'Your readings from the full previous month.' },
};

function slotLabel(value) {
  return TIME_SLOTS.find((slot) => slot.value === value)?.label || value;
}

export default function ReportCard({ type, report, loading }) {
  const config = reportConfig[type];
  const Icon = config.icon;
  const empty = !report || report.total === 0;
  const range = report?.period;
  return (
    <article className={`report-card report-${type}`}>
      <div className="report-heading">
        <span className="report-icon"><Icon size={18} /></span>
        <div><h3>{config.label}</h3><p>{config.description}</p></div>
      </div>
      {loading ? (
        <div className="report-loading"><span className="spinner small" /> Updating report…</div>
      ) : empty ? (
        <div className="report-empty"><span className="empty-heart"><Heart size={16} /></span><span>No readings for this period yet.</span></div>
      ) : (
        <>
          <div className="report-range">
            {range?.start === range?.end ? displayDate(range.start) : `${displayDate(range?.start, { month: 'short', day: 'numeric' })} — ${displayDate(range?.end, { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </div>
          <div className="report-stats">
            <div><span>Highest</span><strong>{report.highest}<small> mg/dL</small></strong></div>
            <div><span>Lowest</span><strong>{report.lowest}<small> mg/dL</small></strong></div>
            <div><span>Average</span><strong>{Number(report.average).toFixed(1)}<small> mg/dL</small></strong></div>
            <div><span>Readings</span><strong>{report.total}<small> total</small></strong></div>
          </div>
          {type === 'daily' && report.readings?.length > 0 && (
            <div className="daily-breakdown">
              <span className="breakdown-title"><Activity size={14} /> Readings for the day</span>
              {report.readings.map((reading) => (
                <div className="breakdown-row" key={reading.id}>
                  <span>{slotLabel(reading.timeSlot)}</span><strong>{reading.value}<small> mg/dL</small></strong><ChevronRight size={14} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}
