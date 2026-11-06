import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { displayDate } from './date';

export default function MonthlyTrendChart({ points }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 12, right: 16, left: -12, bottom: 4 }}>
        <CartesianGrid stroke="#edf2f0" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(date) => displayDate(date, { day: 'numeric' })} tick={{ fill: '#8b9b98', fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis width={48} domain={['auto', 'auto']} tick={{ fill: '#8b9b98', fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          labelFormatter={(date) => displayDate(date)}
          formatter={(value, name, item) => [`${Number(value).toFixed(1)} mg/dL · ${item.payload.total} ${item.payload.total === 1 ? 'reading' : 'readings'}`, 'Daily average']}
          contentStyle={{ border: '1px solid #e8efed', borderRadius: 9, color: '#395c57', fontSize: 11 }}
        />
        <Line type="monotone" dataKey="average" stroke="#438d7f" strokeWidth={2.5} dot={{ r: 4, fill: '#438d7f', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
