function dateForApi(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new TypeError('Database returned an invalid reading date.');
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/);
    if (match) return match[1];
  }

  throw new TypeError('Database returned an invalid reading date.');
}

function serializeReading(reading) {
  return { ...reading, date: dateForApi(reading.date) };
}

module.exports = { dateForApi, serializeReading };
