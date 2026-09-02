import React, { useState, useMemo } from 'react';
import { db } from '../lib/db';
import { Invoice } from '../types';
import { exportFinancialReportToCsv } from '../lib/csvExport';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  FileText,
  Printer,
  Calendar,
  Layers,
  ArrowDownRight,
  Filter,
  Download,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { InvoicePrintModal } from './InvoicePrintModal';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [filterPeriod, setFilterPeriod] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const reportData = useMemo(() => {
    const invoices = db.getInvoices();
    const products = db.getProducts();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filteredInvoices = invoices.filter((inv) => {
      const datePart = inv.createdAt.slice(0, 10);
      if (filterPeriod === 'TODAY') return datePart === todayStr;
      if (filterPeriod === '7DAYS') return datePart >= d7Ago;
      if (filterPeriod === '30DAYS') return datePart >= d30Ago;
      return true;
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCost = 0;

    // Daily breakdown for charts
    const dailyMap = new Map<string, { date: string; revenue: number; cost: number; profit: number; count: number }>();

    // Product sold metrics
    const productSoldMap = new Map<number, { name: string; qty: number; revenue: number }>();

    for (const inv of filteredInvoices) {
      totalRevenue += inv.total;
      totalDiscount += inv.discount;

      const day = inv.createdAt.slice(5, 10); // MM-DD
      const existingDay = dailyMap.get(day) || {
        date: day,
        revenue: 0,
        cost: 0,
        profit: 0,
        count: 0,
      };
      existingDay.revenue += inv.total;
      existingDay.count += 1;

      if (inv.items) {
        for (const item of inv.items) {
          const prod = products.find((p) => p.id === item.productId);
          const itemCost = prod ? prod.costPrice * item.quantity : 0;
          totalCost += itemCost;
          existingDay.cost += itemCost;

          const pInfo = productSoldMap.get(item.productId) || {
            name: item.productName,
            qty: 0,
            revenue: 0,
          };
          pInfo.qty += item.quantity;
          pInfo.revenue += item.subtotal;
          productSoldMap.set(item.productId, pInfo);
        }
      }
      existingDay.profit = Math.max(0, existingDay.revenue - existingDay.cost);
      dailyMap.set(day, existingDay);
    }

    const totalProfit = Math.max(0, totalRevenue - totalCost);
    const avgOrderValue = filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0;

    const chartData = Array.from(dailyMap.values()).reverse();
    const topProducts = Array.from(productSoldMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    return {
      invoices: filteredInvoices,
      totalRevenue,
      totalDiscount,
      totalCost,
      totalProfit,
      orderCount: filteredInvoices.length,
      avgOrderValue,
      chartData,
      topProducts,
    };
  }, [filterPeriod]);

  const getPeriodLabel = (period: 'TODAY' | '7DAYS' | '30DAYS' | 'ALL') => {
    switch (period) {
      case 'TODAY':
        return 'Hôm nay (' + new Date().toISOString().slice(0, 10) + ')';
      case '7DAYS':
        return '7 ngày gần nhất';
      case '30DAYS':
        return '30 ngày gần nhất';
      case 'ALL':
        return 'Toàn bộ thời gian (Tất cả)';
    }
  };

  const handleDownloadCsv = () => {
    exportFinancialReportToCsv({
      periodLabel: getPeriodLabel(filterPeriod),
      totalRevenue: reportData.totalRevenue,
      totalCost: reportData.totalCost,
      totalProfit: reportData.totalProfit,
      totalDiscount: reportData.totalDiscount,
      orderCount: reportData.orderCount,
      avgOrderValue: reportData.avgOrderValue,
      chartData: reportData.chartData,
      topProducts: reportData.topProducts,
      invoices: reportData.invoices,
    });

    // Log Activity for Manager Auditing
    db.logActivity({
      userId: currentUser?.id,
      username: currentUser?.username || 'admin',
      userRole: currentUser?.roleName || 'MANAGER',
      employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
      action: 'REPORT_EXPORT',
      actionTitle: 'Xuất báo cáo tài chính',
      targetType: 'FINANCE',
      targetId: `REPORT-${filterPeriod}`,
      targetName: `Báo cáo tài chính (${getPeriodLabel(filterPeriod)})`,
      details: `Xuất file CSV báo cáo tài chính kỳ ${getPeriodLabel(filterPeriod)}: Doanh thu ${formatCurrency(reportData.totalRevenue)}, Lợi nhuận ${formatCurrency(reportData.totalProfit)}, ${reportData.orderCount} đơn hàng.`,
      metadata: {
        filterPeriod,
        totalRevenue: reportData.totalRevenue,
        totalProfit: reportData.totalProfit,
        orderCount: reportData.orderCount,
      },
      severity: 'INFO',
    });

    setExportToast(`Đã xuất báo cáo CSV (${getPeriodLabel(filterPeriod)}) thành công!`);
    setTimeout(() => {
      setExportToast(null);
    }, 3500);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {exportToast && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-emerald-400">Xuất file thành công</div>
            <div className="text-slate-300 mt-0.5">{exportToast}</div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Báo cáo Kinh doanh & Thống kê Doanh số</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp doanh thu, giá vốn, lợi nhuận gộp và lịch sử chi tiết từng hóa đơn.
          </p>
        </div>

        {/* Filter Period Buttons & Download CSV Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterPeriod('TODAY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterPeriod === 'TODAY'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilterPeriod('7DAYS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterPeriod === '7DAYS'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setFilterPeriod('30DAYS')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterPeriod === '30DAYS'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày qua
            </button>
            <button
              onClick={() => setFilterPeriod('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterPeriod === 'ALL'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            id="btn-export-csv"
            onClick={handleDownloadCsv}
            title="Tải xuống dữ liệu hiệu suất tài chính dưới dạng file CSV"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng Doanh thu
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatCurrency(reportData.totalRevenue)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Tổng chiết khấu: <b>{formatCurrency(reportData.totalDiscount)}</b>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ước tính Lợi nhuận
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-600">
            {formatCurrency(reportData.totalProfit)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Giá vốn hàng bán: {formatCurrency(reportData.totalCost)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tổng số Hóa đơn
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {reportData.orderCount} <span className="text-sm font-medium text-slate-500">đơn</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">Đã hoàn thành thanh toán</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Giá trị TB / Đơn
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatCurrency(reportData.avgOrderValue)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Average Order Value (AOV)</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Biểu đồ So sánh Doanh thu & Lợi nhuận</h3>
            <p className="text-xs text-slate-400 mt-0.5">Dữ liệu theo các mốc thời gian</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={reportData.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toLocaleString('vi-VN')}k`}
              />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="revenue" name="Doanh thu" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Danh sách Hóa đơn Bán hàng</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click xem chi tiết và in lại hóa đơn ({reportData.invoices.length} đơn)
            </p>
          </div>
          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Mã hóa đơn</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Thu ngân</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-right">Tạm tính</th>
                <th className="px-4 py-3 text-right">Giảm giá</th>
                <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportData.invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không có hóa đơn nào trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                reportData.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{inv.invoiceCode}</td>
                    <td className="px-4 py-3 text-slate-500">{inv.createdAt}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{inv.employeeName}</td>
                    <td className="px-4 py-3 text-slate-700">{inv.customerName || 'Khách vãng lai'}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {inv.discount > 0 ? `-${formatCurrency(inv.discount)}` : '0đ'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Xem & In</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoicePrintModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
