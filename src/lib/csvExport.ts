/**
 * CSV Export utilities with RFC-4180 compliance and UTF-8 BOM for Excel support
 */

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If contains commas, double quotes, or newlines, enclose in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function rowToCsv(row: (string | number | null | undefined)[]): string {
  return row.map(escapeCsvCell).join(',');
}

export interface FinancialReportExportParams {
  periodLabel: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalDiscount: number;
  orderCount: number;
  avgOrderValue: number;
  chartData: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    qty: number;
    revenue: number;
  }>;
  invoices: Array<{
    invoiceCode: string;
    createdAt: string;
    employeeName?: string;
    customerName?: string;
    paymentMethod: string;
    subtotal: number;
    discount: number;
    total: number;
    items?: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      subtotal: number;
    }>;
  }>;
}

export function exportFinancialReportToCsv(params: FinancialReportExportParams) {
  const rows: string[] = [];

  // Title & Metadata
  rows.push(rowToCsv(['BÁO CÁO KẾT QUẢ KINH DOANH VÀ HIỆU SUẤT TÀI CHÍNH']));
  rows.push(rowToCsv(['Kỳ báo cáo:', params.periodLabel]));
  rows.push(rowToCsv(['Thời gian xuất báo cáo:', new Date().toLocaleString('vi-VN')]));
  rows.push(rowToCsv([]));

  // Key Financial Metrics
  rows.push(rowToCsv(['I. TỔNG QUAN CÁC CHỈ SỐ TÀI CHÍNH CHÍNH']));
  rows.push(rowToCsv(['Chỉ số', 'Giá trị', 'Đơn vị']));
  rows.push(rowToCsv(['Tổng Doanh thu thuần', params.totalRevenue, 'VND']));
  rows.push(rowToCsv(['Giá vốn hàng bán (COGS)', params.totalCost, 'VND']));
  rows.push(rowToCsv(['Lợi nhuận gộp ước tính', params.totalProfit, 'VND']));
  const profitMargin =
    params.totalRevenue > 0
      ? ((params.totalProfit / params.totalRevenue) * 100).toFixed(2) + '%'
      : '0%';
  rows.push(rowToCsv(['Tỷ suất lợi nhuận gộp', profitMargin, '']));
  rows.push(rowToCsv(['Tổng chiết khấu / Khuyến mãi', params.totalDiscount, 'VND']));
  rows.push(rowToCsv(['Tổng số đơn hàng hoàn thành', params.orderCount, 'Đơn']));
  rows.push(rowToCsv(['Giá trị đơn hàng trung bình (AOV)', Math.round(params.avgOrderValue), 'VND']));
  rows.push(rowToCsv([]));

  // Breakdown by date
  if (params.chartData.length > 0) {
    rows.push(rowToCsv(['II. THỐNG KÊ DOANH THU & LỢI NHUẬN THEO NGÀY']));
    rows.push(rowToCsv(['Ngày / Mốc thời gian', 'Số đơn hàng', 'Doanh thu (VND)', 'Giá vốn (VND)', 'Lợi nhuận (VND)']));
    for (const d of params.chartData) {
      rows.push(rowToCsv([d.date, d.count, d.revenue, d.cost, d.profit]));
    }
    rows.push(rowToCsv([]));
  }

  // Top selling products
  if (params.topProducts.length > 0) {
    rows.push(rowToCsv(['III. TOP SẢN PHẨM BÁN CHẠY NHẤT']));
    rows.push(rowToCsv(['Tên sản phẩm', 'Số lượng bán ra', 'Doanh thu sản phẩm (VND)']));
    for (const p of params.topProducts) {
      rows.push(rowToCsv([p.name, p.qty, p.revenue]));
    }
    rows.push(rowToCsv([]));
  }

  // Detailed Invoices List
  rows.push(rowToCsv(['IV. DANH SÁCH CHI TIẾT HÓA ĐƠN GIAO DỊCH']));
  rows.push(
    rowToCsv([
      'Mã hóa đơn',
      'Thời gian giao dịch',
      'Nhân viên thu ngân',
      'Tên khách hàng',
      'Phương thức thanh toán',
      'Tạm tính (VND)',
      'Giảm giá (VND)',
      'Tổng thanh toán (VND)',
      'Chi tiết sản phẩm đã mua',
    ])
  );

  const formatPaymentMethod = (m: string) => {
    switch (m) {
      case 'CASH':
        return 'Tiền mặt';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản';
      case 'CREDIT_CARD':
        return 'Thẻ tín dụng';
      default:
        return m;
    }
  };

  for (const inv of params.invoices) {
    const itemsSummary = inv.items
      ? inv.items.map((i) => `${i.productName} (SL: ${i.quantity})`).join('; ')
      : '';

    rows.push(
      rowToCsv([
        inv.invoiceCode,
        inv.createdAt,
        inv.employeeName || 'Nhân viên',
        inv.customerName || 'Khách vãng lai',
        formatPaymentMethod(inv.paymentMethod),
        inv.subtotal,
        inv.discount,
        inv.total,
        itemsSummary,
      ])
    );
  }

  // Generate CSV Blob with UTF-8 Byte Order Mark (BOM)
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Bao-cao-tai-chinh-${timestamp}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
