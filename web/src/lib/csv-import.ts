import Papa from 'papaparse';

export interface ImportedEntry {
  month: string; // YYYY-MM
  grossSales: number | null;
  creditSales: number | null;
  cogs: number | null;
  otherExpenses: number | null;
  cashIn: number | null;
  arBalance: number | null;
  apBalance: number | null;
  cashOnHand: number | null;
  leakNote: string | null;
}

// Column name aliases (Thai + English)
const FIELD_MAP: Record<string, keyof ImportedEntry> = {
  // Month
  'month': 'month', 'เดือน': 'month', 'period': 'month',

  // grossSales
  'grosssales': 'grossSales', 'ยอดขายรวม': 'grossSales', 'ยอดขาย': 'grossSales',
  'sales': 'grossSales', 'revenue': 'grossSales',

  // creditSales
  'creditsales': 'creditSales', 'ขายเชื่อ': 'creditSales', 'credit': 'creditSales',

  // cogs
  'cogs': 'cogs', 'ต้นทุน': 'cogs', 'ต้นทุนสินค้า': 'cogs', 'cost': 'cogs',

  // otherExpenses
  'otherexpenses': 'otherExpenses', 'ค่าใช้จ่าย': 'otherExpenses', 'opex': 'otherExpenses', 'expenses': 'otherExpenses',

  // cashIn
  'cashin': 'cashIn', 'เงินเข้า': 'cashIn', 'เงินเข้าบัญชี': 'cashIn',

  // arBalance
  'arbalance': 'arBalance', 'ลูกหนี้': 'arBalance', 'ar': 'arBalance',

  // apBalance
  'apbalance': 'apBalance', 'เจ้าหนี้': 'apBalance', 'ap': 'apBalance',

  // cashOnHand
  'cashonhand': 'cashOnHand', 'เงินสด': 'cashOnHand', 'cash': 'cashOnHand', 'เงินสดในมือ': 'cashOnHand',

  // leakNote
  'leaknote': 'leakNote', 'จุดรั่ว': 'leakNote', 'note': 'leakNote', 'หมายเหตุ': 'leakNote',
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s_-]+/g, '').replace(/[()]/g, '');
}

function parseNumber(val: any): number | null {
  if (val == null || val === '') return null;
  const cleaned = String(val).replace(/[,\s฿บาท]/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseMonth(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();

  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(s)) return s;

  // YYYY-MM-DD or ISO date
  const isoMatch = s.match(/^(\d{4})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`;

  // MM/YYYY or M/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[2]}-${slashMatch[1].padStart(2, '0')}`;

  // Thai month name + Buddhist year (e.g. "มกราคม 2567")
  const thaiMonths: Record<string, string> = {
    'มกราคม': '01', 'กุมภาพันธ์': '02', 'มีนาคม': '03', 'เมษายน': '04',
    'พฤษภาคม': '05', 'มิถุนายน': '06', 'กรกฎาคม': '07', 'สิงหาคม': '08',
    'กันยายน': '09', 'ตุลาคม': '10', 'พฤศจิกายน': '11', 'ธันวาคม': '12',
  };
  for (const [name, mm] of Object.entries(thaiMonths)) {
    if (s.includes(name)) {
      const yearMatch = s.match(/(\d{4})/);
      if (yearMatch) {
        let year = parseInt(yearMatch[1]);
        if (year > 2500) year -= 543; // Buddhist year
        return `${year}-${mm}`;
      }
    }
  }

  return null;
}

export function parseCSV(file: File): Promise<{ entries: ImportedEntry[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const errors: string[] = [];
        const entries: ImportedEntry[] = [];

        if (!result.data.length) {
          errors.push('ไฟล์ว่าง — ไม่มีข้อมูล');
          resolve({ entries, errors });
          return;
        }

        // Map headers
        const headers = Object.keys(result.data[0] as any);
        const fieldMapping: Record<string, keyof ImportedEntry> = {};
        for (const h of headers) {
          const norm = normalizeHeader(h);
          if (FIELD_MAP[norm]) {
            fieldMapping[h] = FIELD_MAP[norm];
          }
        }

        if (!fieldMapping || Object.keys(fieldMapping).length === 0) {
          errors.push('ไม่พบ column ที่ตรงกัน — ต้องมีอย่างน้อย "เดือน" และ "ยอดขาย"');
          resolve({ entries, errors });
          return;
        }

        // Parse rows
        for (let i = 0; i < result.data.length; i++) {
          const row = result.data[i] as any;
          const entry: any = {
            month: null,
            grossSales: null, creditSales: null, cogs: null, otherExpenses: null,
            cashIn: null, arBalance: null, apBalance: null, cashOnHand: null, leakNote: null,
          };

          for (const [csvCol, field] of Object.entries(fieldMapping)) {
            const val = row[csvCol];
            if (field === 'month') {
              entry.month = parseMonth(val);
            } else if (field === 'leakNote') {
              entry.leakNote = val ? String(val).trim() : null;
            } else {
              entry[field] = parseNumber(val);
            }
          }

          if (!entry.month) {
            errors.push(`แถว ${i + 2}: ไม่พบเดือน — ข้าม`);
            continue;
          }

          entries.push(entry as ImportedEntry);
        }

        resolve({ entries, errors });
      },
      error: (err) => {
        resolve({ entries: [], errors: [`อ่านไฟล์ไม่ได้: ${err.message}`] });
      },
    });
  });
}

// Also support Excel-like text paste
export function parseExcelPaste(text: string): { entries: ImportedEntry[]; errors: string[] } {
  const blob = new Blob([text], { type: 'text/csv' });
  const file = new File([blob], 'paste.csv');
  // Sync-ish wrapper — but parseCSV is async, so caller should await
  // For paste, just split by tabs/lines
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { entries: [], errors: ['ข้อมูลน้อยเกินไป'] };

  const headers = lines[0].split('\t');
  const csv = lines.map(l => l.split('\t').map(c => c.trim()).join(',')).join('\n');
  const blob2 = new Blob([csv], { type: 'text/csv' });
  // Return a promise-compatible structure
  return { entries: [], errors: ['ใช้ parseCSV กับไฟล์แทน'] };
}
