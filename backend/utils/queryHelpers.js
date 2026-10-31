// Chhote helper functions jo controllers mein baar baar kaam aate hain.

// User ki search text ko regex mein safe banata hai (regex injection se bachao)
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// req.body se sirf allowed fields uthata hai (mass-assignment se bachao:
// user body mein userId ya _id bhej kar kuch ghalat nahi kar sakta)
const pickFields = (source, allowedFields) =>
  allowedFields.reduce((picked, field) => {
    if (source[field] !== undefined) picked[field] = source[field];
    return picked;
  }, {});

// "2026-10-25" -> us din ki UTC range. Dates hum UTC midnight par store karte hain.
const dayRange = (dateString) => {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { $gte: start, $lt: end };
};

const todayString = () => new Date().toISOString().slice(0, 10);

// Default date: aaj ki UTC midnight
const startOfTodayUTC = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

module.exports = { escapeRegex, pickFields, dayRange, todayString, startOfTodayUTC };
