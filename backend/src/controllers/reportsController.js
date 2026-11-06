const { isValidDate, todayUtc } = require('../utils/validation');
const { serializeReading } = require('../utils/dateSerialization');

function dateRangeFor(kind, selectedDate) {
  if (kind === 'daily') return { start: selectedDate, end: selectedDate };
  if (kind === 'month-to-date') {
    return { start: `${selectedDate.slice(0, 7)}-01`, end: selectedDate };
  }
  const [year, month] = selectedDate.split('-').map(Number);
  const firstOfSelectedMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfPreviousMonth = new Date(firstOfSelectedMonth.getTime() - 86400000);
  const start = new Date(Date.UTC(lastOfPreviousMonth.getUTCFullYear(), lastOfPreviousMonth.getUTCMonth(), 1))
    .toISOString().slice(0, 10);
  return { start, end: lastOfPreviousMonth.toISOString().slice(0, 10) };
}

function createReportsController(pool) {
  async function report(req, res, next, kind) {
    const selectedDate = req.query.date || todayUtc();
    if (!isValidDate(selectedDate) || selectedDate > todayUtc()) {
      return res.status(400).json({ message: 'Choose a valid date that is not in the future.' });
    }
    const { start, end } = dateRangeFor(kind, selectedDate);

    try {
      const [summary, readings] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::INTEGER AS total,
                  MIN(value)::INTEGER AS lowest,
                  MAX(value)::INTEGER AS highest,
                  AVG(value)::FLOAT AS average
           FROM readings
           WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
          [req.user.id, start, end],
        ),
        kind === 'daily'
          ? pool.query(
            `SELECT id, reading_date AS date, time_slot AS "timeSlot", value
             FROM readings WHERE user_id = $1 AND reading_date = $2
            ORDER BY CASE time_slot
              WHEN 'morning_fasting' THEN 1
              WHEN 'after_breakfast' THEN 2
              WHEN 'after_lunch' THEN 3
              WHEN 'after_dinner' THEN 4
            END`,
            [req.user.id, selectedDate],
          )
          : Promise.resolve({ rows: [] }),
      ]);
      const values = summary.rows[0];
      return res.json({
        period: { start, end },
        ...values,
        average: values.average === null ? null : Math.round(Number(values.average) * 10) / 10,
        readings: readings.rows.map(serializeReading),
      });
    } catch (error) {
      return next(error);
    }
  }

  return {
    daily: (req, res, next) => report(req, res, next, 'daily'),
    monthToDate: (req, res, next) => report(req, res, next, 'month-to-date'),
    monthly: (req, res, next) => report(req, res, next, 'monthly'),
  };
}

module.exports = { createReportsController, dateRangeFor };
