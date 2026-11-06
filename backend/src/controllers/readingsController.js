const { validateReading } = require('../utils/validation');
const { serializeReading } = require('../utils/dateSerialization');

function createReadingsController(pool) {
  function handleConstraint(error, res) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'A reading already exists for this time slot on that date.' });
    }
    if (error.code === '23514') {
      return res.status(400).json({ message: 'The reading value or time slot is invalid.' });
    }
    return null;
  }

  return {
    async list(req, res, next) {
      try {
        const result = await pool.query(
          `SELECT id, reading_date AS date, time_slot AS "timeSlot", value
           FROM readings WHERE user_id = $1
           ORDER BY reading_date DESC,
             CASE time_slot
               WHEN 'morning_fasting' THEN 1
               WHEN 'after_breakfast' THEN 2
               WHEN 'after_lunch' THEN 3
               WHEN 'after_dinner' THEN 4
             END`,
          [req.user.id],
        );
        return res.json({ readings: result.rows.map(serializeReading) });
      } catch (error) {
        return next(error);
      }
    },

    async create(req, res, next) {
      const { errors, value } = validateReading(req.body);
      if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });

      try {
        const result = await pool.query(
          `INSERT INTO readings (user_id, reading_date, time_slot, value)
           VALUES ($1, $2, $3, $4)
           RETURNING id, reading_date AS date, time_slot AS "timeSlot", value`,
          [req.user.id, req.body.date, req.body.timeSlot, value],
        );
        return res.status(201).json({ reading: serializeReading(result.rows[0]) });
      } catch (error) {
        const response = handleConstraint(error, res);
        if (response) return response;
        return next(error);
      }
    },

    async update(req, res, next) {
      if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ message: 'Reading ID must be a positive integer.' });
      }
      const { errors, value } = validateReading(req.body);
      if (Object.keys(errors).length) return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });

      try {
        const result = await pool.query(
          `UPDATE readings
           SET reading_date = $1, time_slot = $2, value = $3
           WHERE id = $4 AND user_id = $5
           RETURNING id, reading_date AS date, time_slot AS "timeSlot", value`,
          [req.body.date, req.body.timeSlot, value, req.params.id, req.user.id],
        );
        if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
        return res.json({ reading: serializeReading(result.rows[0]) });
      } catch (error) {
        const response = handleConstraint(error, res);
        if (response) return response;
        return next(error);
      }
    },

    async remove(req, res, next) {
      if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ message: 'Reading ID must be a positive integer.' });
      }
      try {
        const result = await pool.query(
          'DELETE FROM readings WHERE id = $1 AND user_id = $2',
          [req.params.id, req.user.id],
        );
        if (!result.rowCount) return res.status(404).json({ message: 'Reading not found.' });
        return res.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createReadingsController;
