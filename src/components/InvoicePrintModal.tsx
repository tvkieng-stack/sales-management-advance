import React, { useEffect } from 'react';
import { Invoice } from '../types';
import { Printer, X, CheckCircle2, Store, FileText, QrCode } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  isDraft?: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  isDraft = false,
  onClose,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản (QR VietQR)';
      case 'CREDIT_CARD':
        return 'Thẻ tín dụng / Ghi nợ (POS)';
      default:
        return method;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:w-full">
        {/* Header Actions (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            {isDraft ? (
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Xem & In Phiếu Tạm Tính</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Thanh toán thành công</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt-modal"
              onClick={handlePrint}
              title="In hóa đơn (Enter hoặc Ctrl+P)"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (Ctrl+P)</span>
            </button>
            <button
              id="btn-close-receipt-modal"
              onClick={onClose}
              title="Đóng (Esc)"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="p-6 text-slate-800 text-sm font-sans">
          {/* Store Info */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <div className="flex items-center justify-center gap-1.5 font-bold text-lg text-slate-900 mb-1">
              <Store className="w-5 h-5 text-blue-600 print:text-black" />
              <span>CỬA HÀNG TIỆN LỢI & BÁN LẺ</span>
            </div>
            <p className="text-xs text-slate-500">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
            <p className="text-xs text-slate-500">Hotline: 0901 234 567 - 028 3838 3838</p>
            <div className="mt-2.5">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  isDraft
                    ? 'bg-amber-50 text-amber-800 border-amber-300 print:border-black print:text-black'
                    : 'bg-blue-50 text-blue-800 border-blue-200 print:border-black print:text-black'
                }`}
              >
                {isDraft ? 'Phiếu Tạm Tính (Pro-Forma)' : 'Hóa Đơn Bán Hàng (Receipt)'}
              </span>
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-xs">
            <div className="flex justify-between font-semibold text-slate-900">
              <span>Mã hóa đơn:</span>
              <span className="font-mono">{invoice.invoiceCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày tạo:</span>
              <span>{invoice.createdAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thu ngân:</span>
              <span>{invoice.employeeName || 'Nhân viên bán hàng'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-medium text-slate-800">{invoice.customerName || 'Khách lẻ vãng lai'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="text-left font-medium pb-2">Tên món</th>
                  <th className="text-center font-medium pb-2 w-10">SL</th>
                  <th className="text-right font-medium pb-2 w-20">Đ.Giá</th>
                  <th className="text-right font-medium pb-2 w-24">T.Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="text-slate-700">
                    <td className="py-2 pr-1 font-medium">
                      <div>{item.productName}</div>
                      {item.barcode && (
                        <div className="text-[10px] text-slate-400 font-mono">[{item.barcode}]</div>
                      )}
                    </td>
                    <td className="py-2 text-center text-slate-600 font-semibold">{item.quantity}</td>
                    <td className="py-2 text-right">{item.unitPrice.toLocaleString('vi-VN')}</td>
                    <td className="py-2 text-right font-medium">
                      {item.subtotal.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation */}
          <div className="py-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tạm tính hàng hóa:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Chiết khấu / Giảm giá:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            {invoice.pointsRedeemed && invoice.pointsRedeemed > 0 ? (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Đổi điểm thưởng (-{invoice.pointsRedeemed} điểm):</span>
                <span>-{formatCurrency(invoice.pointsDiscount || invoice.pointsRedeemed * 100)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>TỔNG CỘNG:</span>
              <span className="text-blue-600 print:text-black font-mono text-lg">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.pointsEarned && invoice.pointsEarned > 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                <span>Điểm tích lũy đơn này:</span>
                <span>+{invoice.pointsEarned} điểm</span>
              </div>
            ) : null}
            <div className="flex justify-between text-slate-500 pt-1">
              <span>Phương thức:</span>
              <span className="font-medium text-slate-700">
                {getPaymentMethodName(invoice.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Trạng thái:</span>
              <span className={`font-semibold ${isDraft ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isDraft ? 'Chưa thanh toán (Tạm tính)' : 'Đã thanh toán (PAID)'}
              </span>
            </div>
          </div>

          {/* Footer Note & Barcode simulation */}
          <div className="pt-4 text-center text-xs text-slate-400 border-t border-dashed border-slate-300 space-y-2">
            <p className="font-medium text-slate-600">Cảm ơn Quý khách & Hẹn gặp lại!</p>
            <p className="text-[11px]">Hóa đơn có giá trị đổi trả trong vòng 24 giờ kể từ lúc mua hàng.</p>
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded border border-slate-200">
                <QrCode className="w-3.5 h-3.5 text-slate-500" />
                <span>Mã tra cứu: {invoice.invoiceCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-400">Hỗ trợ máy in nhiệt khổ K80 / K57 và A4/A5</span>
          <button
            id="btn-close-receipt-bottom"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

