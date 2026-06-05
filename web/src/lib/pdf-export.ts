// PDF Export — uses browser print dialog (supports Thai fonts natively)

interface DashboardData {
  businessName: string;
  month: string;
  boxes: Record<string, any>;
  verdict: { level: string; messages: string[] };
}

function money(n: number | null | undefined): string {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('en-US');
}

function fmtValue(box: any): string {
  if (!box) return '—';
  if (box.display) return box.display;
  if (box.value == null && box.months == null) return '—';
  if (box.format === 'currency') return money(box.value) + ' บาท';
  if (box.format === 'percent') return (Number(box.value) * 100).toFixed(1) + '%';
  if (box.format === 'text') return String(box.value || '—');
  if (box.format === 'mix') return `สด ${((box.cashPct || 0) * 100).toFixed(0)}% / เชื่อ ${((box.creditPct || 0) * 100).toFixed(0)}%`;
  if (box.months != null) return box.months.toFixed(1) + ' เดือน';
  return String(box.value);
}

function fmtStatus(box: any): string {
  if (!box?.color) return '';
  if (box.color === 'green') return '🟢';
  if (box.color === 'yellow') return '🟡';
  if (box.color === 'red') return '🔴';
  return '';
}

const BOX_ORDER = [
  { key: '1_grossSales', label: 'ยอดขายรวม' },
  { key: '2_salesMix', label: 'สัดส่วน ขายสด / ขายเชื่อ' },
  { key: '3_grossMargin', label: 'Gross Margin (กำไรขั้นต้น %)' },
  { key: '4_netProfit', label: 'Net Profit (กำไรสุทธิ)' },
  { key: '5_expenseRatio', label: 'ค่าใช้จ่ายกินยอดขาย %' },
  { key: '6_leakNote', label: 'จุดรั่วเดือนนี้' },
  { key: '7_cashIn', label: 'Cash In (เงินเข้าจริง)' },
  { key: '8_arBalance', label: 'ลูกหนี้ค้างเก็บ' },
  { key: '9_apBalance', label: 'เจ้าหนี้ค้างจ่าย' },
  { key: '10_runway', label: 'Cash Runway (เงินสดอยู่ได้กี่เดือน)' },
];

export function exportDashboardPDF(data: DashboardData) {
  const verdictEmoji = data.verdict.level === 'ok' ? '🟢' : data.verdict.level === 'warning' ? '🟡' : '🔴';
  const verdictLabel = data.verdict.level === 'ok' ? 'สุขภาพดี' : data.verdict.level === 'warning' ? 'ระวัง' : 'วิกฤต';

  const rows = BOX_ORDER.map((item) => {
    const box = data.boxes[item.key];
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5ea;font-size:13px;">${item.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5ea;font-size:13px;font-family:Inter,system-ui;text-align:right;">${fmtValue(box)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5ea;font-size:13px;text-align:center;">${fmtStatus(box)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>WinWin Analyzer — ${data.month}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans Thai', 'Inter', system-ui, sans-serif; color: #1D1D1F; padding: 40px; max-width: 800px; margin: 0 auto; }
    @media print { body { padding: 20px; } @page { margin: 15mm; } }
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
    <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;">WinWin Analyzer</div>
  </div>

  <div style="margin-bottom:8px;">
    <div style="font-size:12px;color:#86868B;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${data.businessName}</div>
    <div style="font-size:28px;font-weight:600;letter-spacing:-0.5px;">${data.month}</div>
  </div>

  <div style="background:${data.verdict.level === 'ok' ? '#f0fdf4' : data.verdict.level === 'warning' ? '#fff7ed' : '#fef2f2'};border-radius:14px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#86868B;margin-bottom:4px;">${verdictEmoji} ${verdictLabel}</div>
    <div style="font-size:15px;font-weight:600;">${data.verdict.messages[0] || ''}</div>
    ${data.verdict.messages.length > 1 ? `<div style="font-size:13px;color:#86868B;margin-top:4px;">${data.verdict.messages.slice(1).join(' · ')}</div>` : ''}
  </div>

  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e5ea;border-radius:12px;overflow:hidden;">
    <thead>
      <tr style="background:#f5f5f7;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#86868B;text-transform:uppercase;letter-spacing:0.3px;">ตัวชี้วัด</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#86868B;text-transform:uppercase;letter-spacing:0.3px;">ค่า</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#86868B;text-transform:uppercase;letter-spacing:0.3px;">สถานะ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5ea;display:flex;justify-content:space-between;font-size:11px;color:#B0B0B5;">
    <span>WinWin Analyzer · winwinwealth.co</span>
    <span>${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
</body>
</html>`;

  // Open print dialog in new window
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.print();
  }, 500);
}
