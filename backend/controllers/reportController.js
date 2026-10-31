// Reports export. Controller sirf request samajhta hai aur response bhejta hai.
// File banane ka bhari kaam reportService ke zariye Worker Thread karta hai
// (workers/reportWorker.js), main Express thread nahi.
const asyncHandler = require('../utils/asyncHandler');
const { generateReport, ALL_TYPES } = require('../services/reportService');

const CONTENT_TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// types: ['workouts'] waghera. type 'all' ho to saare datasets.
const sendReport = async (req, res, types, label) => {
  const format = req.query.format || 'csv';
  const startedAt = Date.now();

  const report = await generateReport({ userId: req.user._id, types, format });

  const fileName = `fitcloud-${label}-${new Date().toISOString().slice(0, 10)}.${format}`;
  res.set({
    'Content-Type': CONTENT_TYPES[format],
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Content-Length': report.buffer.length,
    // Viva/demo ke liye: saboot ke report worker thread mein bana
    'X-Report-Generated-By': 'worker-thread',
    'X-Worker-Thread-Id': String(report.workerThreadId),
    'X-Worker-Time-Ms': String(report.elapsedMs),
    'X-Total-Time-Ms': String(Date.now() - startedAt),
    'X-Report-Rows': String(report.totalRows),
  });
  res.status(200).send(report.buffer);
};

// GET /api/reports/workouts | /diet | /progress | /exercises
const exportOne = (type) => asyncHandler((req, res) => sendReport(req, res, [type], type));

// GET /api/reports/export?type=all|workouts|diet|exercises|progress&format=csv|xlsx
const exportData = asyncHandler((req, res) => {
  const type = req.query.type || 'all';
  const types = type === 'all' ? ALL_TYPES : [type];
  return sendReport(req, res, types, type === 'all' ? 'all-data' : type);
});

module.exports = { exportOne, exportData };
