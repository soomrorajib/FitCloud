// =====================================================================
// REPORT WORKER THREAD  (Node.js Worker Threads)
// =====================================================================
// Ye file main Express server se ALAG thread mein chalti hai.
//
// Masla: Node.js ka main thread sirf ek hai. Agar wo bari XLSX/CSV file banane
// mein masroof ho jaye to us dauran baaki users ki requests (login, dashboard
// waghera) atak jati hain.
//
// Hal: reportController data nikal kar reportService ko deta hai, reportService
// ye worker start karta hai. Asli heavy kaam (har row ko format karna, CSV
// escaping, XLSX workbook banana, styling, buffer likhna) YAHAN hota hai.
// Main thread us dauran free rehta hai aur doosri requests serve karta rehta hai.
//
// Flow:  Controller -> reportService (worker pool) -> reportWorker.js
//        -> CSV/XLSX buffer -> wapas main thread -> HTTP response (download)
//
// Main thread aur worker ke darmiyan data workerData / postMessage se jata hai.
// =====================================================================
const { parentPort, workerData, threadId } = require('worker_threads');
const ExcelJS = require('exceljs');

// CSV injection se bachao: jo cell "=", "+", "-" ya "@" se shuru ho, Excel usay formula samajhta hai
const neutralizeFormula = (value) => (typeof value === 'string' && /^[=+\-@]/.test(value) ? `'${value}` : value);

const toCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(neutralizeFormula(value));
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Ek ya zyada sheets ko CSV text mein badalta hai
const buildCsv = (sheets) => {
  const sections = sheets.map((sheet) => {
    const lines = [];
    if (sheets.length > 1) lines.push(toCsvCell(`## ${sheet.name}`));
    lines.push(sheet.columns.map((column) => toCsvCell(column.header)).join(','));
    for (const row of sheet.rows) {
      lines.push(sheet.columns.map((column) => toCsvCell(row[column.key])).join(','));
    }
    return lines.join('\r\n');
  });
  // \uFEFF (BOM) taake Excel UTF-8 sahi kholay
  return Buffer.from('\uFEFF' + sections.join('\r\n\r\n'), 'utf8');
};

const buildXlsx = async (sheets) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'FitCloud';
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width || 18,
    }));

    sheet.rows.forEach((row) => {
      const safeRow = {};
      sheet.columns.forEach((column) => { safeRow[column.key] = neutralizeFormula(row[column.key]); });
      worksheet.addRow(safeRow);
    });

    // Header ki styling, freeze aur filter
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } };
    header.alignment = { vertical: 'middle' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (sheet.rows.length > 0) {
      worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const run = async () => {
  const startedAt = Date.now();
  try {
    const { format, sheets } = workerData;
    const buffer = format === 'xlsx' ? await buildXlsx(sheets) : buildCsv(sheets);

    // Buffer ko copy kiye baghair main thread ko transfer kar dete hain (fast)
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    parentPort.postMessage(
      { ok: true, buffer: arrayBuffer, workerThreadId: threadId, elapsedMs: Date.now() - startedAt },
      [arrayBuffer]
    );
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error.message });
  }
};

run();
