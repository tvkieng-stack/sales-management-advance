import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/db';
import { Product, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Package,
  ShoppingCart,
  Users,
  CheckCircle,
  CheckCircle2,
  Search,
  Plus,
  X,
  Warehouse,
  Barcode,
  Truck,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Calendar,
  CalendarDays,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  // Version counter to trigger re-renders when data updates
  const [dataVersion, setDataVersion] = useState(0);

  // 30-Day Trend Chart Controls
  const [chartDaysRange, setChartDaysRange] = useState<30 | 14 | 7>(30);
  const [chartMetricView, setChartMetricView] = useState<'REVENUE_PROFIT' | 'REVENUE_ONLY' | 'REVENUE_ORDERS'>('REVENUE_PROFIT');

  // Low Stock Alerts Filter States
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockFilterType, setStockFilterType] = useState<'ALL_LOW' | 'OUT_OF_STOCK' | 'CRITICAL' | 'NEAR_THRESHOLD'>('ALL_LOW');
  const [customThreshold, setCustomThreshold] = useState<number | 'DEFAULT'>('DEFAULT');

  // Quick Restock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockSupplierId, setRestockSupplierId] = useState<number>(0);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockCost, setRestockCost] = useState<number>(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);

  const reloadData = () => {
    setDataVersion((v) => v + 1);
    const activeSuppliers = db.getSuppliers().filter((s) => s.status === 'ACTIVE');
    setSuppliers(activeSuppliers);
    if (activeSuppliers.length > 0 && restockSupplierId === 0) {
      setRestockSupplierId(activeSuppliers[0].id);
    }
  };

  useEffect(() => {
    reloadData();
  }, []);

  const data = useMemo(() => {
    // dataVersion is used as a dependency to force refresh
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    dataVersion;

    const products = db.getProducts();
    const invoices = db.getInvoices();
    const customers = db.getCustomers();

    const todayStr = new Date().toISOString().split('T')[0];

    // Invoices today
    const todayInvoices = invoices.filter((inv) => inv.createdAt.startsWith(todayStr));
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const todayOrders = todayInvoices.length;

    // Estimate profit today (selling total - cost total)
    let todayCost = 0;
    for (const inv of todayInvoices) {
      if (inv.items) {
        for (const item of inv.items) {
          const prod = products.find((p) => p.id === item.productId);
          if (prod) {
            todayCost += item.quantity * prod.costPrice;
          }
        }
      }
    }
    const todayProfit = Math.max(0, todayRevenue - todayCost);

    // Low stock products logic
    const activeProducts = products.filter((p) => p.status === 'ACTIVE');

    const lowStockProducts = activeProducts.filter((p) => {
      if (customThreshold === 'DEFAULT') {
        return p.stockQuantity <= p.minimumStock;
      }
      return p.stockQuantity <= customThreshold;
    });

    // Best selling products (all-time / recent 30 days)
    const productSalesMap = new Map<number, { name: string; qty: number; revenue: number }>();
    for (const inv of invoices) {
      if (inv.items) {
        for (const it of inv.items) {
          const existing = productSalesMap.get(it.productId) || {
            name: it.productName,
            qty: 0,
            revenue: 0,
          };
          existing.qty += it.quantity;
          existing.revenue += it.subtotal;
          productSalesMap.set(it.productId, existing);
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Stock stats
    const outOfStockCount = activeProducts.filter((p) => p.stockQuantity <= 0).length;
    const criticalStockCount = activeProducts.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= Math.max(1, Math.floor(p.minimumStock / 2))
    ).length;

    return {
      todayRevenue,
      todayOrders,
      todayProfit,
      lowStockProducts,
      allActiveProducts: activeProducts,
      outOfStockCount,
      criticalStockCount,
      topProducts,
      totalProducts: activeProducts.length,
      totalCustomers: customers.length,
    };
  }, [dataVersion, customThreshold]);

  // 30-Day Daily Sales Revenue Trends Calculation
  const salesTrends = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    dataVersion;

    const invoices = db.getInvoices();
    const products = db.getProducts();
    const productCostMap = new Map<number, number>();
    products.forEach((p) => productCostMap.set(p.id, p.costPrice));

    const now = new Date();
    const daysToCompute = chartDaysRange; // 30, 14, or 7
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    const dailyData: Array<{
      dateStr: string;
      displayDate: string;
      fullDateLabel: string;
      dayOfWeek: string;
      revenue: number;
      profit: number;
      ordersCount: number;
      avgOrderValue: number;
    }> = [];

    let totalPeriodRevenue = 0;
    let totalPeriodProfit = 0;
    let totalPeriodOrders = 0;
    let peakDay = { dateStr: '', displayDate: '', fullDateLabel: '', revenue: 0, ordersCount: 0 };

    for (let i = daysToCompute - 1; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-');
      const displayDate = `${day}/${month}`;
      const dayOfWeek = daysOfWeek[targetDate.getDay()];
      const fullDateLabel = `${dayOfWeek}, ${day}/${month}/${year}`;

      // Invoices for this date
      const dayInvoices = invoices.filter((inv) => inv.createdAt.startsWith(dateStr));
      const dayRevenue = dayInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const dayOrders = dayInvoices.length;

      let dayCost = 0;
      for (const inv of dayInvoices) {
        if (inv.items) {
          for (const item of inv.items) {
            const cost = productCostMap.get(item.productId) || 0;
            dayCost += item.quantity * cost;
          }
        }
      }
      const dayProfit = Math.max(0, dayRevenue - dayCost);
      const avgOrderValue = dayOrders > 0 ? Math.round(dayRevenue / dayOrders) : 0;

      totalPeriodRevenue += dayRevenue;
      totalPeriodProfit += dayProfit;
      totalPeriodOrders += dayOrders;

      if (dayRevenue >= peakDay.revenue) {
        peakDay = {
          dateStr,
          displayDate,
          fullDateLabel,
          revenue: dayRevenue,
          ordersCount: dayOrders,
        };
      }

      dailyData.push({
        dateStr,
        displayDate,
        fullDateLabel,
        dayOfWeek,
        revenue: dayRevenue,
        profit: dayProfit,
        ordersCount: dayOrders,
        avgOrderValue,
      });
    }

    const avgDailyRevenue = Math.round(totalPeriodRevenue / daysToCompute);
    const avgDailyOrders = (totalPeriodOrders / daysToCompute).toFixed(1);

    // Calculate growth comparing first half vs second half
    const half = Math.floor(daysToCompute / 2);
    const firstHalfRevenue = dailyData.slice(0, half).reduce((sum, d) => sum + d.revenue, 0);
    const secondHalfRevenue = dailyData.slice(half).reduce((sum, d) => sum + d.revenue, 0);
    const growthPercent =
      firstHalfRevenue > 0
        ? Math.round(((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100)
        : 0;

    return {
      dailyData,
      totalPeriodRevenue,
      totalPeriodProfit,
      totalPeriodOrders,
      avgDailyRevenue,
      avgDailyOrders,
      peakDay,
      growthPercent,
    };
  }, [dataVersion, chartDaysRange]);

  // Filtered Low Stock Products based on search and sub-filters
  const filteredLowStockProducts = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    return data.lowStockProducts.filter((p) => {
      // Search matching
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status Sub-filter
      if (stockFilterType === 'OUT_OF_STOCK') {
        return p.stockQuantity <= 0;
      }
      if (stockFilterType === 'CRITICAL') {
        return p.stockQuantity > 0 && p.stockQuantity <= Math.max(1, Math.floor(p.minimumStock / 2));
      }
      if (stockFilterType === 'NEAR_THRESHOLD') {
        return p.stockQuantity > Math.max(1, Math.floor(p.minimumStock / 2)) && p.stockQuantity <= p.minimumStock;
      }

      return true;
    });
  }, [data.lowStockProducts, stockSearchQuery, stockFilterType]);

  // Estimated restock capital needed
  const estimatedRestockBudget = useMemo(() => {
    return filteredLowStockProducts.reduce((sum, p) => {
      const suggestedQty = Math.max(p.minimumStock * 2 - p.stockQuantity, p.minimumStock);
      return sum + suggestedQty * p.costPrice;
    }, 0);
  }, [filteredLowStockProducts]);

  const openQuickRestock = (product: Product) => {
    setRestockProduct(product);
    const suggested = Math.max(product.minimumStock * 2 - product.stockQuantity, Math.max(10, product.minimumStock));
    setRestockQty(suggested);
    setRestockCost(product.costPrice);
    setRestockError(null);

    const activeSuppliers = db.getSuppliers().filter((s) => s.status === 'ACTIVE');
    setSuppliers(activeSuppliers);
    if (activeSuppliers.length > 0) {
      setRestockSupplierId(activeSuppliers[0].id);
    }
  };

  const handleConfirmRestock = () => {
    if (!restockProduct) return;
    if (restockQty <= 0) {
      setRestockError('Số lượng nhập phải lớn hơn 0.');
      return;
    }
    if (restockCost < 0) {
      setRestockError('Giá vốn nhập hàng không hợp lệ.');
      return;
    }
    if (!restockSupplierId) {
      setRestockError('Vui lòng chọn nhà cung cấp.');
      return;
    }

    try {
      db.confirmPurchase({
        supplierId: restockSupplierId,
        employeeId: currentUser?.employeeId || currentUser?.id || 1,
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
        items: [
          {
            product: restockProduct,
            quantity: restockQty,
            unitCost: restockCost,
          },
        ],
      });

      setToastMessage(`Đã nhập bổ sung thành công ${restockQty} ${restockProduct.unit} cho "${restockProduct.name}"!`);
      setTimeout(() => setToastMessage(null), 4000);
      setRestockProduct(null);
      reloadData();
    } catch (err: any) {
      setRestockError(err.message || 'Lỗi khi nhập hàng.');
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-emerald-400">Nhập kho thành công</div>
            <div className="text-slate-300 mt-0.5">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Tổng quan hoạt động kinh doanh hôm nay</h2>
          <p className="text-blue-100 text-sm mt-1">
            Theo dõi doanh thu tức thì, kiểm tra tồn kho và quản lý đơn bán hàng nhanh chóng.
          </p>
        </div>
        <button
          id="btn-goto-pos"
          onClick={() => onNavigate('POS')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold rounded-xl text-sm transition shadow-md cursor-pointer"
        >
          <ShoppingCart className="w-4.5 h-4.5" />
          <span>Mở Màn hình Thu Ngân (POS)</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Doanh thu hôm nay
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatCurrency(data.todayRevenue)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-emerald-600 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Trực tiếp
            </span>
            <span>từ hóa đơn thanh toán</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Số đơn hoàn thành
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {data.todayOrders} <span className="text-base font-medium text-slate-500">đơn</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Tất cả đã ghi nhận kho</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ước tính Lợi nhuận
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">
            {formatCurrency(data.todayProfit)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Doanh thu trừ Giá vốn hàng bán</div>
        </div>

        <div
          onClick={() => {
            const el = document.getElementById('section-low-stock-alerts');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="bg-white p-5 rounded-2xl border border-amber-200 hover:border-amber-400 shadow-2xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Cảnh báo Hết hàng
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-600">
            {data.lowStockProducts.length}{' '}
            <span className="text-base font-medium text-slate-500">mặt hàng</span>
          </div>
          <div className="mt-1 text-xs text-amber-700 flex items-center gap-1 font-medium">
            <span>{data.outOfStockCount} hết hàng • {data.criticalStockCount} nguy cấp</span>
          </div>
        </div>
      </div>

      {/* 30-DAY DAILY SALES REVENUE TRENDS LINE CHART (RECHARTS) */}
      <div id="section-sales-trend-chart" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Chart Header & Controls */}
        <div className="p-5 border-b border-slate-100 bg-linear-to-r from-blue-50/40 via-white to-indigo-50/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Xu hướng Doanh thu Bán hàng {chartDaysRange} Ngày gần nhất
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Recharts Live
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Biểu đồ trực quan hóa biến động doanh số hàng ngày, ước tính lợi nhuận và chu kỳ bán hàng.
                </p>
              </div>
            </div>
          </div>

          {/* Range and Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Range Selector */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => setChartDaysRange(7)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  chartDaysRange === 7
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7 ngày
              </button>
              <button
                onClick={() => setChartDaysRange(14)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  chartDaysRange === 14
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                14 ngày
              </button>
              <button
                onClick={() => setChartDaysRange(30)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  chartDaysRange === 30
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30 ngày
              </button>
            </div>

            {/* Metric Mode Selector */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                onClick={() => setChartMetricView('REVENUE_PROFIT')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartMetricView === 'REVENUE_PROFIT'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị đồng thời Doanh thu và Lợi nhuận ước tính"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Doanh thu & Lợi nhuận</span>
              </button>
              <button
                onClick={() => setChartMetricView('REVENUE_ONLY')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  chartMetricView === 'REVENUE_ONLY'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chỉ Doanh thu
              </button>
              <button
                onClick={() => setChartMetricView('REVENUE_ORDERS')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartMetricView === 'REVENUE_ORDERS'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị Doanh thu và Cột số lượng đơn hàng"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                <span>Kèm Số đơn</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('Reports')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <span>Xem báo cáo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Summary Indicator Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50/60 border-b border-slate-100 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="text-slate-500 font-medium flex items-center justify-between">
              <span>Tổng doanh thu ({chartDaysRange} ngày)</span>
              <span
                className={`text-2xs font-bold px-1.5 py-0.2 rounded ${
                  salesTrends.growthPercent >= 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {salesTrends.growthPercent >= 0 ? `+${salesTrends.growthPercent}%` : `${salesTrends.growthPercent}%`}
              </span>
            </div>
            <div className="text-base font-extrabold text-blue-700">
              {formatCurrency(salesTrends.totalPeriodRevenue)}
            </div>
            <div className="text-[11px] text-slate-400">
              Lợi nhuận: <b className="text-emerald-700">{formatCurrency(salesTrends.totalPeriodProfit)}</b>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="text-slate-500 font-medium">Trung bình mỗi ngày</div>
            <div className="text-base font-extrabold text-slate-900">
              {formatCurrency(salesTrends.avgDailyRevenue)}
            </div>
            <div className="text-[11px] text-slate-400">
              Ước tính ~<b>{salesTrends.avgDailyOrders}</b> đơn/ngày
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="text-slate-500 font-medium flex items-center gap-1 text-amber-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ngày đỉnh điểm (Peak)</span>
            </div>
            <div className="text-base font-extrabold text-amber-700">
              {formatCurrency(salesTrends.peakDay.revenue)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {salesTrends.peakDay.fullDateLabel || salesTrends.peakDay.displayDate} ({salesTrends.peakDay.ordersCount} đơn)
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="text-slate-500 font-medium">Tổng số đơn hoàn thành</div>
            <div className="text-base font-extrabold text-slate-900">
              {salesTrends.totalPeriodOrders} <span className="text-xs font-normal text-slate-500">đơn</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Đã hoàn tất thanh toán</span>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="p-5">
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={salesTrends.dailyData}
                margin={{ top: 15, right: chartMetricView === 'REVENUE_ORDERS' ? 25 : 15, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="displayDate"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={chartDaysRange === 30 ? 2 : chartDaysRange === 14 ? 1 : 0}
                  tickMargin={8}
                />

                <YAxis
                  yAxisId="left"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${Math.round(val / 1000)}k`
                      : `${val}`
                  }
                  tickMargin={8}
                />

                {chartMetricView === 'REVENUE_ORDERS' && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#8b5cf6"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => `${val}đ`}
                    tickMargin={8}
                  />
                )}

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[220px] space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" />
                              <span>{dataPoint.fullDateLabel}</span>
                            </div>
                            <span className="text-2xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono font-bold">
                              {dataPoint.ordersCount} đơn
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                                Doanh thu:
                              </span>
                              <span className="font-extrabold text-blue-400 font-mono text-[13px]">
                                {formatCurrency(dataPoint.revenue)}
                              </span>
                            </div>

                            {(chartMetricView === 'REVENUE_PROFIT' || chartMetricView === 'REVENUE_ONLY') && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                  Lợi nhuận ước tính:
                                </span>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {formatCurrency(dataPoint.profit)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[11px] text-slate-400">
                              <span>TB/Đơn hàng (AOV):</span>
                              <span className="font-semibold text-slate-200 font-mono">
                                {formatCurrency(dataPoint.avgOrderValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Optional Bar chart for Orders in dual axis mode */}
                {chartMetricView === 'REVENUE_ORDERS' && (
                  <Bar
                    yAxisId="right"
                    dataKey="ordersCount"
                    name="Số đơn hàng"
                    fill="#a78bfa"
                    radius={[4, 4, 0, 0]}
                    barSize={chartDaysRange === 30 ? 12 : 20}
                    opacity={0.7}
                  />
                )}

                {/* Revenue Main Line + Gradient Fill */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueFill)"
                  activeDot={{
                    r: 6,
                    stroke: '#2563eb',
                    strokeWidth: 2,
                    fill: '#ffffff',
                  }}
                />

                {/* Profit Dashed Line */}
                {chartMetricView === 'REVENUE_PROFIT' && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="profit"
                    name="Lợi nhuận"
                    stroke="#059669"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{
                      r: 5,
                      stroke: '#059669',
                      strokeWidth: 2,
                      fill: '#ffffff',
                    }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend & Context Information */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shadow-2xs"></span>
                <span>Doanh thu bán hàng (VNĐ)</span>
              </div>

              {chartMetricView === 'REVENUE_PROFIT' && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-emerald-600 inline-block"></span>
                  <span>Lợi nhuận gộp ước tính (VNĐ)</span>
                </div>
              )}

              {chartMetricView === 'REVENUE_ORDERS' && (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-3 h-3 rounded bg-purple-400 inline-block"></span>
                  <span>Số lượng đơn hàng (Đơn)</span>
                </div>
              )}
            </div>

            <div className="text-slate-400 text-[11px] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span>Dữ liệu đồng bộ tự động theo thời gian thực từ quầy POS</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED LOW STOCK ALERT SECTION */}
      <div id="section-low-stock-alerts" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header with Title & Summary Metrics */}
        <div className="p-5 border-b border-slate-100 bg-linear-to-r from-amber-50/50 via-white to-orange-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Bảng Cảnh báo Tồn kho Thấp & Kế hoạch Nhập hàng
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {data.lowStockProducts.length} sản phẩm
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Danh sách các mặt hàng có lượng tồn kho đã chạm hoặc giảm xuống dưới định mức an toàn, hỗ trợ quản lý tạo phiếu nhập bổ sung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('Inventory')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Warehouse className="w-4 h-4" />
              <span>Quản lý Nhập kho (Tất cả)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={stockSearchQuery}
              onChange={(e) => setStockSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, SKU hoặc danh mục cần nhập..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {stockSearchQuery && (
              <button
                onClick={() => setStockSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sub Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setStockFilterType('ALL_LOW')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  stockFilterType === 'ALL_LOW'
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({data.lowStockProducts.length})
              </button>
              <button
                onClick={() => setStockFilterType('OUT_OF_STOCK')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  stockFilterType === 'OUT_OF_STOCK'
                    ? 'bg-red-100 text-red-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-red-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>Hết hàng ({data.outOfStockCount})</span>
              </button>
              <button
                onClick={() => setStockFilterType('CRITICAL')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  stockFilterType === 'CRITICAL'
                    ? 'bg-orange-100 text-orange-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-orange-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                <span>Nguy cấp ({data.criticalStockCount})</span>
              </button>
              <button
                onClick={() => setStockFilterType('NEAR_THRESHOLD')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  stockFilterType === 'NEAR_THRESHOLD'
                    ? 'bg-amber-100 text-amber-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dưới định mức
              </button>
            </div>

            {/* Threshold Selector */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Ngưỡng:</span>
              <select
                value={customThreshold}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomThreshold(val === 'DEFAULT' ? 'DEFAULT' : Number(val));
                }}
                className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="DEFAULT">Định mức an toàn từng món</option>
                <option value="5">Tồn ≤ 5</option>
                <option value="10">Tồn ≤ 10</option>
                <option value="20">Tồn ≤ 20</option>
                <option value="50">Tồn ≤ 50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estimated Budget Summary Bar */}
        {filteredLowStockProducts.length > 0 && (
          <div className="px-5 py-2.5 bg-amber-50/60 border-b border-amber-100 flex flex-wrap items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Hiển thị <b>{filteredLowStockProducts.length}</b> mặt hàng cần nhập bổ sung.
              </span>
            </div>
            <div className="font-semibold text-slate-700">
              Ước tính vốn cần nhập bổ sung: <b className="text-amber-800 font-extrabold">{formatCurrency(estimatedRestockBudget)}</b>
            </div>
          </div>
        )}

        {/* Detailed Table / Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Sản phẩm & SKU</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3 text-center">Tồn / Định mức</th>
                <th className="px-4 py-3">Mức độ tồn kho</th>
                <th className="px-4 py-3 text-right">Giá vốn</th>
                <th className="px-4 py-3 text-center">Gợi ý nhập</th>
                <th className="px-4 py-3 text-right">Thao tác nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        Không có mặt hàng nào cần cảnh báo trong danh sách này!
                      </p>
                      <p className="text-xs text-slate-400">
                        {stockSearchQuery
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.'
                          : 'Tất cả sản phẩm đều đảm bảo lượng tồn kho an toàn.'}
                      </p>
                      {stockSearchQuery && (
                        <button
                          onClick={() => setStockSearchQuery('')}
                          className="mt-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                        >
                          Xóa tìm kiếm
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLowStockProducts.map((p) => {
                  const shortage = Math.max(0, p.minimumStock - p.stockQuantity);
                  const suggestedQty = Math.max(p.minimumStock * 2 - p.stockQuantity, Math.max(10, p.minimumStock));
                  const percentage =
                    p.minimumStock > 0
                      ? Math.min(100, Math.round((p.stockQuantity / p.minimumStock) * 100))
                      : 0;

                  const isOutOfStock = p.stockQuantity <= 0;
                  const isCritical =
                    !isOutOfStock && p.stockQuantity <= Math.max(1, Math.floor(p.minimumStock / 2));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{p.name}</span>
                          {isOutOfStock ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                              HẾT HÀNG
                            </span>
                          ) : isCritical ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              NGUY CẤP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              TỒN THẤP
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>SKU: {p.barcode || `PRD-${p.id}`}</span>
                          <span>•</span>
                          <span>ĐVT: {p.unit}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium">
                          {p.categoryName || 'Mặc định'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-slate-900">
                          <span className={isOutOfStock ? 'text-red-600 font-extrabold' : isCritical ? 'text-orange-600' : 'text-amber-700'}>
                            {p.stockQuantity}
                          </span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-600">{p.minimumStock}</span>
                        </div>
                        {shortage > 0 && (
                          <div className="text-[10px] font-semibold text-red-600 mt-0.5">
                            Thiếu {shortage} {p.unit}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                            <span>Độ đáp ứng:</span>
                            <span className="font-bold text-slate-700">{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isOutOfStock
                                  ? 'bg-red-500 w-1'
                                  : isCritical
                                  ? 'bg-orange-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.max(4, percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-medium text-slate-800">
                        {formatCurrency(p.costPrice)}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                          +{suggestedQty} {p.unit}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openQuickRestock(p)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 ml-auto cursor-pointer"
                          title="Nhập bổ sung sản phẩm này ngay"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nhập hàng nhanh</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns: Best Selling Products & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800">Top Sản phẩm bán chạy</h3>
              <p className="text-xs text-slate-500 mt-0.5">Xếp hạng theo số lượng đã bán</p>
            </div>
            <button
              onClick={() => onNavigate('Reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Xem báo cáo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {data.topProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                Chưa có dữ liệu bán hàng.
              </div>
            ) : (
              data.topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-400">Đã bán: {p.qty} sản phẩm</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(p.revenue)}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium">Doanh số</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Lối tắt Quản trị nhanh</h3>
              <p className="text-xs text-slate-500 mt-0.5">Truy cập tức thì các phân hệ quản lý chính</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('Products')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Package className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Sản phẩm</div>
                <div className="text-[11px] text-slate-400">{data.totalProducts} mặt hàng</div>
              </button>

              <button
                onClick={() => onNavigate('Customers')}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Users className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Khách hàng</div>
                <div className="text-[11px] text-slate-400">{data.totalCustomers} thành viên</div>
              </button>

              <button
                onClick={() => onNavigate('Inventory')}
                className="p-3.5 bg-slate-50 hover:bg-purple-50/60 rounded-xl border border-slate-200 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Phiếu Nhập kho</div>
                <div className="text-[11px] text-slate-400">Quản lý kho hàng</div>
              </button>

              <button
                onClick={() => onNavigate('Reports')}
                className="p-3.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200 text-left transition cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Báo cáo Tài chính</div>
                <div className="text-[11px] text-slate-400">Xuất CSV & Doanh thu</div>
              </button>

              <button
                onClick={() => onNavigate('ActivityLog')}
                className="p-3.5 bg-slate-50 hover:bg-rose-50/60 rounded-xl border border-slate-200 text-left transition cursor-pointer group col-span-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>Nhật ký Hoạt động (Audit Log)</span>
                        <span className="text-2xs bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">Manager</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Xem vết kiểm toán xóa dữ liệu, chỉnh kho & bảo mật</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
                </div>
              </button>
            </div>
          </div>

          <div className="p-3.5 mt-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="font-bold text-blue-900">Quản lý Tồn kho Tự động</div>
              <div className="text-blue-700 text-[11px]">Tồn kho tự động trừ khi xuất hóa đơn POS</div>
            </div>
            <button
              onClick={() => onNavigate('POS')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Mở POS
            </button>
          </div>
        </div>
      </div>

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tạo Phiếu Nhập Bổ Sung Nhanh</h3>
                  <p className="text-xs text-slate-500">Cập nhật kho tức thì vào hệ thống</p>
                </div>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {restockError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{restockError}</span>
              </div>
            )}

            {/* Product Summary Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="font-bold text-sm text-slate-900">{restockProduct.name}</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>SKU: {restockProduct.barcode || `PRD-${restockProduct.id}`}</span>
                <span>
                  Tồn hiện tại: <b className="text-amber-700">{restockProduct.stockQuantity}</b> / Định mức:{' '}
                  <b>{restockProduct.minimumStock} {restockProduct.unit}</b>
                </span>
              </div>
            </div>

            {/* Restock Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <select
                  value={restockSupplierId}
                  onChange={(e) => setRestockSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số lượng nhập ({restockProduct.unit}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giá vốn nhập (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={restockCost}
                    onChange={(e) => setRestockCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">Tổng tiền nhập hàng:</span>
                <span className="text-sm font-extrabold text-emerald-800">
                  {formatCurrency(restockQty * restockCost)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận nhập kho ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

