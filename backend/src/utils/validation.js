const TIME_SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function validateReading(input = {}) {
  const { date, timeSlot, value } = input && typeof input === 'object' ? input : {};
  const errors = {};
  if (!isValidDate(date)) {
    errors.date = 'Enter a valid date.';
  } else if (date > todayUtc()) {
    errors.date = 'Future dates are not allowed.';
  }

  if (!TIME_SLOTS.includes(timeSlot)) {
    errors.timeSlot = 'Choose a valid time slot.';
  }

  const numberValue = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (numberValue === '' || numberValue === undefined || numberValue === null) {
    errors.value = 'Glucose value is required.';
  } else if (!Number.isInteger(numberValue) || numberValue < 40 || numberValue > 600) {
    errors.value = 'Glucose value must be a whole number between 40 and 600 mg/dL.';
  }

  return { errors, value: numberValue };
}

module.exports = { TIME_SLOTS, isValidDate, todayUtc, validateReading };
