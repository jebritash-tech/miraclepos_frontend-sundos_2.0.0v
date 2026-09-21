// src/js/utils/thermalPrinter.js

/* ============================================================
   miraclepos - Thermal Receipt Printer
   ------------------------------------------------------------
   يدعم: 80mm (افتراضي) و 58mm
   يعمل مع: Xprinter، Epson، Bixolon، Microsoft Print to PDF
   ============================================================ */

const PHARMACY_INFO_KEY = 'miraclepos_pharmacy_info';

/**
 * إعدادات الصيدلية (اسم، هاتف، عنوان)
 * تُحفظ في localStorage ليتم تحريرها من الإعدادات لاحقاً
 */


export function savePharmacyInfo(info) {
  try {
    localStorage.setItem(PHARMACY_INFO_KEY, JSON.stringify(info));
    return true;
  } catch (e) {
    return false;
  }
}

// حالة عامة تُحمَّل من السرفر عند تهيئة POS
let serverSettings = null;

export function setPrintServerSettings(settings) {
    serverSettings = settings;
}

export function getPrintServerSettings() {
    return serverSettings;
}

// ✅ تعديل getPharmacyInfo ليقرأ من السرفر أولاً
export function getPharmacyInfo() {
    if (serverSettings) {
        return {
            name:      serverSettings['pharmacy.name']      || 'صيدلية',
            phone:     serverSettings['pharmacy.phone']     || '',
            address:   serverSettings['pharmacy.address']   || '',
            taxNumber: serverSettings['pharmacy.tax_number']|| '',
            currency:  serverSettings['pharmacy.currency']  || 'ج.س',
        };
    }
    // fallback من localStorage
    try {
        const raw = localStorage.getItem(PHARMACY_INFO_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { name: 'صيدلية', phone: '', address: '', taxNumber: '', currency: 'ج.س' };
}

// ✅ نفس الشيء للإعدادات
export function getPrintSettings() {
    if (serverSettings) {
        return {
            enabled:       Boolean(serverSettings['print.enabled']),
            autoAfterSale: Boolean(serverSettings['print.auto_after_sale']),
            defaultWidth:  parseInt(serverSettings['print.width']) || 80,
            allowReprint:  Boolean(serverSettings['print.allow_reprint']),
        };
    }
    // fallback من localStorage
    try {
        const raw = localStorage.getItem('miraclepos_print_settings');
        if (!raw) return { ...DEFAULT_PRINT_SETTINGS };
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
        return { ...DEFAULT_PRINT_SETTINGS };
    }
}

/* ============================================================
   CSS أساسي للطباعة الحرارية
   ============================================================ */
function thermalCSS(width = 80) {
  // 80mm ≈ 302px، 58mm ≈ 219px
  const mmWidth = width === 58 ? '58mm' : '80mm';
  const fontBase = width === 58 ? '11px' : '12px';
  const fontSmall = width === 58 ? '9px' : '10px';
  const fontLarge = width === 58 ? '13px' : '15px';

  return `
    @page {
      size: ${mmWidth} auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: ${mmWidth};
      font-family: 'Cairo', 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      background: #fff;
      color: #000;
      font-size: ${fontBase};
      line-height: 1.45;
    }
    .receipt {
      width: 100%;
      padding: 4mm 3mm;
    }

    /* ====== Header ====== */
    .rx-header {
      text-align: center;
      padding-bottom: 2mm;
      border-bottom: 1px dashed #000;
      margin-bottom: 2mm;
    }
    .rx-pharmacy-name {
      font-size: ${fontLarge};
      font-weight: 800;
      margin-bottom: 1mm;
    }
    .rx-pharmacy-sub {
      font-size: ${fontSmall};
      color: #333;
      line-height: 1.3;
    }
    .rx-invoice-title {
      font-size: ${fontBase};
      font-weight: 700;
      margin-top: 2mm;
      padding: 1mm;
      background: #000;
      color: #fff;
      display: inline-block;
      padding: 1mm 4mm;
      border-radius: 2mm;
    }

    /* ====== Meta ====== */
    .rx-meta {
      margin: 2mm 0;
      font-size: ${fontSmall};
    }
    .rx-meta-row {
      display: flex;
      justify-content: space-between;
      padding: 0.6mm 0;
    }
    .rx-meta-row strong {
      font-weight: 700;
    }

    /* ====== Items table ====== */
    .rx-items {
      width: 100%;
      border-collapse: collapse;
      margin: 2mm 0;
      font-size: ${fontSmall};
    }
    .rx-items thead th {
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 1mm 0.5mm;
      text-align: right;
      font-weight: 700;
      font-size: ${fontSmall};
    }
    .rx-items tbody td {
      padding: 1.2mm 0.5mm;
      border-bottom: 1px dotted #ccc;
      vertical-align: top;
    }
    .rx-items .col-name {
      width: 45%;
    }
    .rx-items .col-qty,
    .rx-items .col-price,
    .rx-items .col-total {
      text-align: center;
      width: 18%;
    }
    .rx-items .item-name {
      font-weight: 700;
      display: block;
      margin-bottom: 0.3mm;
    }
    .rx-items .item-unit {
      font-size: ${fontSmall};
      color: #555;
    }

    /* ====== Totals ====== */
    .rx-totals {
      margin-top: 2mm;
      border-top: 1px dashed #000;
      padding-top: 2mm;
    }
    .rx-total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.8mm 0;
      font-size: ${fontBase};
    }
    .rx-total-row.grand {
      font-size: ${fontLarge};
      font-weight: 800;
      border-top: 1px solid #000;
      border-bottom: 3px double #000;
      margin-top: 1.5mm;
      padding: 2mm 0;
    }
    .rx-total-row.refund {
      color: #b91c1c;
      font-size: ${fontSmall};
    }

    /* ====== Footer ====== */
    .rx-footer {
      margin-top: 3mm;
      padding-top: 2mm;
      border-top: 1px dashed #000;
      text-align: center;
      font-size: ${fontSmall};
    }
    .rx-footer .thanks {
      font-weight: 800;
      font-size: ${fontBase};
      margin-bottom: 1mm;
    }
    .rx-footer .cut-mark {
      margin-top: 4mm;
      letter-spacing: 1mm;
      font-family: monospace;
      font-size: ${fontSmall};
      color: #999;
    }

    /* ====== Screen preview (عند الفتح بدون طباعة) ====== */
    @media screen {
      body {
        background: #e5e7eb;
        padding: 10px;
      }
      .receipt {
        background: #fff;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
    }
  `;
}

/* ============================================================
   Helpers
   ============================================================ */
const formatCurrency = (v) =>
  Number(v || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
};

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const UNIT_LABELS = {
  box: 'علبة',
  strip: 'شريط',
  piece: 'حبة',
  bottle: 'زجاجة',
  vial: 'فيال',
  tube: 'أنبوب',
  pack: 'عبوة',
};

const unitLabel = (unit) => UNIT_LABELS[unit] || unit || 'وحدة';

/* ============================================================
   نافذة الطباعة الموحدة
   ============================================================ */
function openPrintWindow(html, title, { autoPrint = true, width = 80 } = {}) {
  const w = window.open('', '_blank', `width=${width === 58 ? 320 : 400},height=650`);
  if (!w) {
    alert('الرجاء السماح بالنوافذ المنبثقة لطباعة الفاتورة');
    return null;
  }

  w.document.open();
  w.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <style>${thermalCSS(width)}</style>
    </head>
    <body>${html}</body>
    </html>
  `);
  w.document.close();

  // ننتظر تحميل الخطوط قبل الطباعة
  if (autoPrint) {
    w.onload = () => {
      setTimeout(() => {
        try {
          w.focus();
          w.print();
        } catch (e) {
          console.warn('Auto print failed:', e);
        }
      }, 250);
    };
  }

  return w;
}

/* ============================================================
   Public API: طباعة فاتورة بيع
   ============================================================ */
export function printInvoice(sale, options = {}) {
  const { autoPrint = true, width = 80 } = options;
  const pharmacy = getPharmacyInfo();

  if (!sale) {
    console.warn('printInvoice: sale object is required');
    return;
  }

  const items = sale.items || [];
  const totalRefunded = Number(sale.total_refunded || 0);
  const total = Number(sale.total_amount || 0);
  const net = Math.max(0, total - totalRefunded);

  const itemsRows = items.map((item, idx) => {
    const name = item.batch?.medicine?.name || item.medicine_name || 'دواء';
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const lineTotal = qty * price;
    const unit = unitLabel(item.unit);

    return `
      <tr>
        <td class="col-name">
          <span class="item-name">${escapeHtml(name)}</span>
          <span class="item-unit">${escapeHtml(unit)}</span>
        </td>
        <td class="col-qty">${qty}</td>
        <td class="col-price">${formatCurrency(price)}</td>
        <td class="col-total">${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  const paymentLabel =
    sale.payment_method === 'cash' ? 'نقدي' :
    sale.payment_method === 'bank' ? 'تحويل بنكي' :
    sale.payment_method || 'نقدي';

  const bankRows = (sale.payment_method === 'bank' && (sale.bank_name || sale.bank_reference)) ? `
    <div class="rx-meta-row"><span>البنك:</span><strong>${escapeHtml(sale.bank_name || '—')}</strong></div>
    ${sale.bank_reference ? `<div class="rx-meta-row"><span>رقم الحوالة:</span><strong>${escapeHtml(sale.bank_reference)}</strong></div>` : ''}
  ` : '';

  const refundRow = totalRefunded > 0 ? `
    <div class="rx-total-row refund">
      <span>مرتجع سابق:</span>
      <span>− ${formatCurrency(totalRefunded)}</span>
    </div>
  ` : '';

  const html = `
    <div class="receipt">
      <div class="rx-header">
        <div class="rx-pharmacy-name">${escapeHtml(pharmacy.name)}</div>
        ${pharmacy.address ? `<div class="rx-pharmacy-sub">${escapeHtml(pharmacy.address)}</div>` : ''}
        ${pharmacy.phone ? `<div class="rx-pharmacy-sub">هاتف: ${escapeHtml(pharmacy.phone)}</div>` : ''}
        ${pharmacy.taxNumber ? `<div class="rx-pharmacy-sub">الرقم الضريبي: ${escapeHtml(pharmacy.taxNumber)}</div>` : ''}
        <div class="rx-invoice-title">فاتورة بيع</div>
      </div>

      <div class="rx-meta">
        <div class="rx-meta-row">
          <span>رقم الفاتورة:</span>
          <strong>#${escapeHtml(sale.id)}</strong>
        </div>
        <div class="rx-meta-row">
          <span>التاريخ:</span>
          <strong>${formatDateTime(sale.created_at)}</strong>
        </div>
        ${sale.user?.name ? `
        <div class="rx-meta-row">
          <span>الكاشير:</span>
          <strong>${escapeHtml(sale.user.name)}</strong>
        </div>` : ''}
        <div class="rx-meta-row">
          <span>طريقة الدفع:</span>
          <strong>${escapeHtml(paymentLabel)}</strong>
        </div>
        ${bankRows}
      </div>

      <table class="rx-items">
        <thead>
          <tr>
            <th class="col-name">الصنف</th>
            <th class="col-qty">كمية</th>
            <th class="col-price">سعر</th>
            <th class="col-total">إجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows || '<tr><td colspan="4" style="text-align:center;padding:3mm;">لا توجد أصناف</td></tr>'}
        </tbody>
      </table>

      <div class="rx-totals">
        <div class="rx-total-row">
          <span>عدد الأصناف:</span>
          <span>${items.length}</span>
        </div>
        ${refundRow}
        <div class="rx-total-row grand">
          <span>الإجمالي:</span>
          <span>${formatCurrency(net)} ج.س</span>
        </div>
      </div>

      <div class="rx-footer">
        <div class="thanks">شكراً لزيارتكم 🌿</div>
        <div>نتمنى لكم الشفاء العاجل</div>
        <div class="cut-mark">- - - - - - - - - - - - - -</div>
      </div>
    </div>
  `;

  return openPrintWindow(html, `فاتورة #${sale.id}`, { autoPrint, width });
}

/* ============================================================
   Public API: طباعة تقرير إغلاق وردية
   ============================================================ */
export function printShiftClose(shift, options = {}) {
  const { autoPrint = true, width = 80 } = options;
  const pharmacy = getPharmacyInfo();

  if (!shift) return;

  const openingCash   = Number(shift.opening_cash || 0);
  const cashSales     = Number(shift.cash_sales || 0);
  const cardSales     = Number(shift.card_sales || 0);
  const debtsAmount   = Number(shift.debts_amount || 0);
  const expensesAmount = Number(shift.expenses_amount || 0);
  const withdrawAmount = Number(shift.withdraw_amount || 0);
  const refundAmount  = Number(shift.refund_amount || 0);
  const expectedCash  = Number(shift.expected_cash ?? (openingCash + cashSales + debtsAmount - expensesAmount - withdrawAmount));
  const closingCash   = Number(shift.closing_cash || 0);
  const difference    = closingCash - expectedCash;

  const diffLabel = difference === 0
    ? 'مطابق ✅'
    : difference > 0
      ? `زيادة +${formatCurrency(difference)}`
      : `عجز ${formatCurrency(difference)}`;

  const html = `
    <div class="receipt">
      <div class="rx-header">
        <div class="rx-pharmacy-name">${escapeHtml(pharmacy.name)}</div>
        <div class="rx-invoice-title">إغلاق وردية</div>
      </div>

      <div class="rx-meta">
        <div class="rx-meta-row"><span>رقم الوردية:</span><strong>#${escapeHtml(shift.id)}</strong></div>
        ${shift.user_name ? `<div class="rx-meta-row"><span>الموظف:</span><strong>${escapeHtml(shift.user_name)}</strong></div>` : ''}
        <div class="rx-meta-row"><span>الفتح:</span><strong>${formatDateTime(shift.opened_at)}</strong></div>
        <div class="rx-meta-row"><span>الإغلاق:</span><strong>${formatDateTime(shift.closed_at || new Date().toISOString())}</strong></div>
      </div>

      <div class="rx-totals">
        <div class="rx-total-row"><span>الرصيد الافتتاحي:</span><span>${formatCurrency(openingCash)}</span></div>
        <div class="rx-total-row"><span>مبيعات نقدية (+):</span><span>${formatCurrency(cashSales)}</span></div>
        <div class="rx-total-row"><span>مبيعات بطاقة:</span><span>${formatCurrency(cardSales)}</span></div>
        <div class="rx-total-row"><span>سداد ديون (+):</span><span>${formatCurrency(debtsAmount)}</span></div>
        <div class="rx-total-row refund"><span>مصروفات (−):</span><span>${formatCurrency(expensesAmount)}</span></div>
        <div class="rx-total-row refund"><span>سحوبات (−):</span><span>${formatCurrency(withdrawAmount)}</span></div>
        <div class="rx-total-row refund"><span>مرتجعات (−):</span><span>${formatCurrency(refundAmount)}</span></div>
        <div class="rx-total-row grand">
          <span>الرصيد المتوقع:</span>
          <span>${formatCurrency(expectedCash)}</span>
        </div>
        <div class="rx-total-row">
          <span>الرصيد الفعلي:</span>
          <strong>${formatCurrency(closingCash)}</strong>
        </div>
        <div class="rx-total-row" style="font-weight:800;">
          <span>الفرق:</span>
          <span>${diffLabel}</span>
        </div>
      </div>

      <div class="rx-meta" style="margin-top:3mm;">
        <div class="rx-meta-row"><span>عدد الفواتير:</span><strong>${shift.sales_count || 0}</strong></div>
      </div>

      <div class="rx-footer">
        <div class="cut-mark">- - - - - - - - - - - - - -</div>
        <div style="margin-top:2mm;">توقيع الموظف: ______________</div>
        <div style="margin-top:2mm;">توقيع المدير: ______________</div>
      </div>
    </div>
  `;

  return openPrintWindow(html, `إغلاق وردية #${shift.id}`, { autoPrint, width });
}

/* ============================================================
   Public API: إشعار إرجاع
   ============================================================ */
export function printRefund(refund, sale, options = {}) {
  const { autoPrint = true, width = 80 } = options;
  const pharmacy = getPharmacyInfo();

  if (!refund) return;

  const items = refund.items || [];
  const amount = Number(refund.amount || 0);

  const itemsRows = items.map((it) => `
    <tr>
      <td class="col-name">${escapeHtml(it.medicine_name || 'دواء')}</td>
      <td class="col-qty">${it.quantity || 0}</td>
      <td class="col-price">${formatCurrency(it.price || 0)}</td>
      <td class="col-total">${formatCurrency((it.quantity || 0) * (it.price || 0))}</td>
    </tr>
  `).join('');

  const html = `
    <div class="receipt">
      <div class="rx-header">
        <div class="rx-pharmacy-name">${escapeHtml(pharmacy.name)}</div>
        <div class="rx-invoice-title">إشعار إرجاع</div>
      </div>

      <div class="rx-meta">
        <div class="rx-meta-row"><span>رقم الإرجاع:</span><strong>#${escapeHtml(refund.id)}</strong></div>
        <div class="rx-meta-row"><span>الفاتورة الأصلية:</span><strong>#${escapeHtml(sale?.id || refund.sale_id || '—')}</strong></div>
        <div class="rx-meta-row"><span>التاريخ:</span><strong>${formatDateTime(refund.created_at || new Date().toISOString())}</strong></div>
        ${refund.reason ? `<div class="rx-meta-row"><span>السبب:</span><strong>${escapeHtml(refund.reason)}</strong></div>` : ''}
      </div>

      <table class="rx-items">
        <thead>
          <tr>
            <th class="col-name">الصنف</th>
            <th class="col-qty">كمية</th>
            <th class="col-price">سعر</th>
            <th class="col-total">إجمالي</th>
          </tr>
        </thead>
        <tbody>${itemsRows || '<tr><td colspan="4" style="text-align:center;padding:3mm;">—</td></tr>'}</tbody>
      </table>

      <div class="rx-totals">
        <div class="rx-total-row grand">
          <span>قيمة الإرجاع:</span>
          <span>${formatCurrency(amount)} ج.س</span>
        </div>
      </div>

      <div class="rx-footer">
        <div class="thanks">شكراً لتفهمكم</div>
        <div class="cut-mark">- - - - - - - - - - - - - -</div>
      </div>
    </div>
  `;

  return openPrintWindow(html, `إرجاع #${refund.id}`, { autoPrint, width });
}
/* ============================================================
   Print Settings — تحكم كامل من الواجهة
   ============================================================ */
const PRINT_SETTINGS_KEY = 'miraclepos_print_settings';

const DEFAULT_PRINT_SETTINGS = {
  enabled:       false,   // ⚠️ افتراضياً معطّلة (لأن الصيدلية قد لا تملك طابعة)
  autoAfterSale: false,   // لا تطبع تلقائياً
  defaultWidth:  80,      // 80mm افتراضي
  allowReprint:  true,    // زر "إعادة طباعة" يظهر دائماً
};




export function savePrintSettings(settings) {
  try {
    const merged = { ...DEFAULT_PRINT_SETTINGS, ...settings };
    localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('تعذر حفظ إعدادات الطباعة:', e);
    return null;
  }
}

/**
 * طباعة آمنة: تحترم الإعدادات
 * @param {Object} sale - بيانات الفاتورة
 * @param {Object} options - { force: true لتجاوز الإعدادات }
 */
export function safePrintInvoice(sale, options = {}) {
  const settings = getPrintSettings();

  // إذا الطباعة معطّلة ولا يوجد force → تجاهل بصمت
  if (!settings.enabled && !options.force) {
    console.log('🖨️ الطباعة معطّلة في الإعدادات، تم تجاهل الطلب');
    return null;
  }

  return printInvoice(sale, {
    autoPrint: options.autoPrint ?? true,
    width: options.width ?? settings.defaultWidth,
  });
}