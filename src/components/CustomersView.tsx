import React, { useState, useEffect, useMemo } from 'react';
import { db, getTierInfo, LOYALTY_CONFIG } from '../lib/db';
import { Customer, Invoice, LoyaltyTransaction } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  ShoppingBag,
  Award,
  ChevronDown,
  ChevronUp,
  Receipt,
  Calendar,
  CreditCard,
  Eye,
  TrendingUp,
  Package,
  Clock,
  Layers,
  Sparkles,
  Gift,
  Coins,
  History,
  Sliders,
} from 'lucide-react';
import { InvoicePrintModal } from './InvoicePrintModal';

export const CustomersView: React.FC = () => {
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<Set<number>>(new Set());
  const [activeCustomerSubTab, setActiveCustomerSubTab] = useState<Record<number, 'ORDERS' | 'LOYALTY'>>({});

  // Modal State for Add / Edit Customer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Points Adjustment
  const [adjustModalCustomer, setAdjustModalCustomer] = useState<Customer | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustMessage, setAdjustMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Invoice for Full Receipt Modal View
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const loadData = () => {
    setCustomers(db.getCustomers());
    setInvoices(db.getInvoices());
    setLoyaltyTransactions(db.getLoyaltyTransactions());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pre-calculate customer purchase stats & map invoices by customerId
  const customerInvoicesMap = useMemo(() => {
    const map = new Map<number, Invoice[]>();
    for (const inv of invoices) {
      if (inv.customerId) {
        if (!map.has(inv.customerId)) {
          map.set(inv.customerId, []);
        }
        map.get(inv.customerId)!.push(inv);
      }
    }
    map.forEach((invList) => {
      invList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return map;
  }, [invoices]);

  // Map loyalty transactions by customerId
  const customerLoyaltyMap = useMemo(() => {
    const map = new Map<number, LoyaltyTransaction[]>();
    for (const tx of loyaltyTransactions) {
      if (!map.has(tx.customerId)) {
        map.set(tx.customerId, []);
      }
      map.get(tx.customerId)!.push(tx);
    }
    map.forEach((txList) => {
      txList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return map;
  }, [loyaltyTransactions]);

  const toggleCustomerHistory = (customerId: number) => {
    setExpandedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }
      return next;
    });
  };

  const handleToggleAllHistory = () => {
    if (expandedCustomerIds.size === filteredCustomers.length && filteredCustomers.length > 0) {
      setExpandedCustomerIds(new Set());
    } else {
      setExpandedCustomerIds(new Set(filteredCustomers.map((c) => c.id)));
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCustomer(c);
    setFormData({ name: c.name, phone: c.phone, email: c.email, address: c.address });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openAdjustPointsModal = (c: Customer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAdjustModalCustomer(c);
    setAdjustPointsDelta(0);
    setAdjustReason('');
    setAdjustMessage(null);
  };

  const handleAdjustPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalCustomer) return;
    if (adjustPointsDelta === 0) {
      setAdjustMessage({ type: 'error', text: 'Số điểm thay đổi phải khác 0.' });
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustMessage({ type: 'error', text: 'Vui lòng nhập lý do điều chỉnh điểm.' });
      return;
    }

    try {
      db.adjustCustomerPoints(
        adjustModalCustomer.id,
        adjustPointsDelta,
        adjustReason.trim(),
        currentUser?.employeeId || 1,
        currentUser?.employeeName || currentUser?.username || 'Quản trị viên'
      );
      setAdjustMessage({ type: 'success', text: 'Điều chỉnh điểm thành công!' });
      loadData();
      setTimeout(() => {
        setAdjustModalCustomer(null);
      }, 600);
    } catch (err: any) {
      setAdjustMessage({ type: 'error', text: err.message || 'Lỗi điều chỉnh điểm.' });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập họ tên khách hàng.' });
      return;
    }
    if (!formData.phone.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số điện thoại.' });
      return;
    }

    try {
      if (editingCustomer) {
        db.updateCustomer({
          ...editingCustomer,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        setMessage({ type: 'success', text: 'Cập nhật khách hàng thành công!' });
      } else {
        db.createCustomer({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });
        setMessage({ type: 'success', text: 'Thêm khách hàng thành công!' });
      }
      loadData();
      setTimeout(() => setIsModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xử lý.' });
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchQuery =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const tier = c.tier || getTierInfo(c.loyaltyPoints || 0).tierName;
      const matchTier = tierFilter === 'ALL' || c.tier === tierFilter;

      return matchQuery && matchTier;
    });
  }, [customers, searchQuery, tierFilter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'BANK_TRANSFER':
        return 'Chuyển khoản';
      case 'CREDIT_CARD':
        return 'Thẻ tín dụng';
      default:
        return method;
    }
  };

  // Aggregate Metrics for Loyalty Overview
  const totalLoyaltyPointsInCirculation = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalPointsRedeemedCount = customers.reduce((sum, c) => sum + (c.totalRedeemedPoints || 0), 0);
  const totalPointsRedeemedValue = totalPointsRedeemedCount * LOYALTY_CONFIG.VND_PER_POINT_REDEEM;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Quản lý Khách hàng & Hệ thống Điểm Tích lũy (Loyalty)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tích 1 điểm mỗi 10.000đ mua hàng &bull; Đổi 1 điểm = 100đ giảm giá trực tiếp tại POS &bull; Hạng thành viên ưu đãi nhân điểm.
          </p>
        </div>

        <button
          id="btn-add-customer"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách hàng Mới</span>
        </button>
      </div>

      {/* Loyalty & Customer Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tổng thành viên</div>
            <div className="text-lg font-extrabold text-slate-900">{customers.length} khách</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Điểm đang lưu hành</div>
            <div className="text-lg font-extrabold text-amber-700 font-mono">
              {totalLoyaltyPointsInCirculation.toLocaleString('vi-VN')} <span className="text-xs font-normal">điểm</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Đã quy đổi giảm giá</div>
            <div className="text-lg font-extrabold text-emerald-700">
              {formatCurrency(totalPointsRedeemedValue)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tỷ lệ quy đổi</div>
            <div className="text-xs font-bold text-purple-900 mt-0.5">
              1đ = 100đ &bull; Hạng VIP x1.5-2.0
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Tier Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, số điện thoại, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Tier Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { id: 'ALL', label: 'Tất cả hạng' },
              { id: 'BRONZE', label: 'Đồng' },
              { id: 'SILVER', label: 'Bạc' },
              { id: 'GOLD', label: 'Vàng' },
              { id: 'PLATINUM', label: 'Bạch Kim' },
              { id: 'DIAMOND', label: 'Kim Cương' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTierFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  tierFilter === t.id
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleToggleAllHistory}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {expandedCustomerIds.size > 0 && expandedCustomerIds.size === filteredCustomers.length
                ? 'Thu gọn tất cả'
                : 'Mở rộng tất cả lịch sử'}
            </span>
          </button>
        </div>
      </div>

      {/* Customers Table with Expandable Purchase History and Loyalty Points */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-3 py-3 w-10 text-center"></th>
                <th className="px-3 py-3 w-14">ID</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Hạng thành viên</th>
                <th className="px-4 py-3 text-center">Điểm khả dụng</th>
                <th className="px-4 py-3 text-right">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-right">Thao tác & Lịch sử</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy khách hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const customerInvoices = customerInvoicesMap.get(c.id) || [];
                  const customerLoyaltyTxs = customerLoyaltyMap.get(c.id) || [];
                  const isExpanded = expandedCustomerIds.has(c.id);
                  const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
                  const tierInfo = getTierInfo(c.loyaltyPoints || 0);
                  const subTab = activeCustomerSubTab[c.id] || 'ORDERS';

                  return (
                    <React.Fragment key={c.id}>
                      {/* Customer Row */}
                      <tr
                        className={`transition cursor-pointer select-none ${
                          isExpanded ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/80'
                        }`}
                        onClick={() => toggleCustomerHistory(c.id)}
                      >
                        {/* Toggle Arrow Column */}
                        <td className="px-3 py-3.5 text-center text-slate-400">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCustomerHistory(c.id);
                            }}
                            className={`p-1 rounded-lg transition hover:bg-slate-200 cursor-pointer ${
                              isExpanded ? 'text-blue-600 font-bold bg-blue-100/70' : 'text-slate-400'
                            }`}
                            title={isExpanded ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-3.5 text-slate-400 font-mono">#{c.id}</td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{c.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {c.email || c.address || `Đăng ký: ${c.createdAt.slice(0, 10)}`}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-semibold text-slate-800">{c.phone}</td>

                        {/* Customer Tier Badge */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border w-fit ${tierInfo.badgeBg}`}>
                              <Award className="w-3.5 h-3.5" />
                              <span>{tierInfo.tierName}</span>
                              <span className="text-[10px] opacity-75 font-normal">({tierInfo.multiplier}x)</span>
                            </span>
                            {tierInfo.nextTierName && (
                              <div className="text-[10px] text-slate-400">
                                Cần +{tierInfo.pointsNeededForNext}đ lên {tierInfo.nextTierName}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Loyalty Points */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/90 font-mono font-extrabold text-xs">
                              <Coins className="w-3.5 h-3.5 text-amber-600" />
                              <span>{c.loyaltyPoints || 0}</span>
                              <span className="text-[10px] font-normal text-amber-700">điểm</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              ≈ {formatCurrency((c.loyaltyPoints || 0) * LOYALTY_CONFIG.VND_PER_POINT_REDEEM)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {formatCurrency(totalSpent)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Adjust Points Button */}
                            <button
                              type="button"
                              onClick={(e) => openAdjustPointsModal(c, e)}
                              title="Cộng / Trừ điểm thưởng thủ công"
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Sliders className="w-3.5 h-3.5 text-amber-600" />
                              <span>Sửa điểm</span>
                            </button>

                            {/* Purchase History Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleCustomerHistory(c.id)}
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                isExpanded
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isExpanded
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {customerInvoices.length}
                              </span>
                            </button>

                            {/* Edit Customer Button */}
                            <button
                              type="button"
                              onClick={(e) => openEditModal(c, e)}
                              title="Sửa thông tin khách hàng"
                              className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable History Detailed Sub-View */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="p-0 border-b border-slate-200">
                            <div className="p-4 sm:p-5 border-l-4 border-blue-600 bg-linear-to-b from-blue-50/40 via-white to-slate-50/70 space-y-4">
                              {/* Customer Loyalty & Purchasing Quick Stats Bar */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Tổng số đơn</span>
                                  </div>
                                  <div className="text-sm font-bold text-slate-900">
                                    {customerInvoices.length} đơn hàng
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Tổng chi tiêu</span>
                                  </div>
                                  <div className="text-sm font-bold text-emerald-700">
                                    {formatCurrency(totalSpent)}
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                    <Award className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Tổng điểm đã tích</span>
                                  </div>
                                  <div className="text-sm font-bold text-amber-700 font-mono">
                                    +{(c.totalEarnedPoints || c.loyaltyPoints || 0).toLocaleString('vi-VN')} điểm
                                  </div>
                                </div>

                                <div className="space-y-0.5">
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                    <Gift className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Điểm đã quy đổi</span>
                                  </div>
                                  <div className="text-sm font-bold text-purple-700 font-mono">
                                    -{(c.totalRedeemedPoints || 0).toLocaleString('vi-VN')} điểm
                                  </div>
                                </div>
                              </div>

                              {/* Sub Tabs Selector: Orders History vs Loyalty Points History */}
                              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveCustomerSubTab((prev) => ({ ...prev, [c.id]: 'ORDERS' }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    subTab === 'ORDERS'
                                      ? 'bg-blue-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Hóa đơn mua hàng ({customerInvoices.length})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveCustomerSubTab((prev) => ({ ...prev, [c.id]: 'LOYALTY' }))
                                  }
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                    subTab === 'LOYALTY'
                                      ? 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  <History className="w-3.5 h-3.5" />
                                  <span>Lịch sử tích / đổi điểm ({customerLoyaltyTxs.length})</span>
                                </button>
                              </div>

                              {/* Sub Tab Content: 1. Invoices List */}
                              {subTab === 'ORDERS' && (
                                <div>
                                  {customerInvoices.length === 0 ? (
                                    <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400">
                                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                                      <p className="text-xs font-semibold text-slate-600">Khách hàng chưa có giao dịch nào</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Các hóa đơn thanh toán chọn khách hàng này ở màn hình Bán hàng (POS) sẽ hiển thị tại đây.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                                      {customerInvoices.map((inv) => (
                                        <div
                                          key={inv.id}
                                          className="p-4 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3.5"
                                        >
                                          {/* Invoice Meta */}
                                          <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-2">
                                              <span className="font-bold text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/80">
                                                {inv.invoiceCode}
                                              </span>
                                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span>{inv.createdAt}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                                <CreditCard className="w-3 h-3 text-slate-500" />
                                                <span>{getPaymentMethodLabel(inv.paymentMethod)}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                <span>Đã thanh toán</span>
                                              </span>
                                              {inv.pointsRedeemed ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                  <span>Đổi -{inv.pointsRedeemed}đ</span>
                                                </span>
                                              ) : null}
                                              {inv.pointsEarned ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                  <span>Tích +{inv.pointsEarned}đ</span>
                                                </span>
                                              ) : null}
                                            </div>

                                            {/* Purchased Items Detailed Breakdown */}
                                            {inv.items && inv.items.length > 0 && (
                                              <div className="pt-1">
                                                <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                                                  <Package className="w-3 h-3 text-slate-400" />
                                                  <span>Chi tiết sản phẩm ({inv.items.length} món):</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {inv.items.map((item, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs transition"
                                                    >
                                                      <span className="font-bold text-blue-700">
                                                        {item.quantity}x
                                                      </span>
                                                      <span className="font-medium text-slate-800 max-w-[200px] truncate">
                                                        {item.productName}
                                                      </span>
                                                      <span className="text-[11px] text-slate-500 font-mono">
                                                        ({formatCurrency(item.unitPrice)})
                                                      </span>
                                                      {item.discount > 0 && (
                                                        <span className="text-[10px] text-red-600 font-semibold">
                                                          - {formatCurrency(item.discount)}
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            <div className="text-[11px] text-slate-400">
                                              Thu ngân phụ trách: <span className="text-slate-600 font-medium">{inv.employeeName || 'Nhân viên'}</span>
                                            </div>
                                          </div>

                                          {/* Amounts & View Receipt Action */}
                                          <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <div className="text-left md:text-right">
                                              {inv.discount > 0 && (
                                                <div className="text-[11px] text-slate-400 line-through">
                                                  {formatCurrency(inv.subtotal)}
                                                </div>
                                              )}
                                              <div className="text-sm font-extrabold text-slate-900">
                                                {formatCurrency(inv.total)}
                                              </div>
                                              {inv.discount > 0 && (
                                                <div className="text-[10px] text-red-600 font-medium">
                                                  Giảm: -{formatCurrency(inv.discount)}
                                                </div>
                                              )}
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => setViewInvoice(inv)}
                                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer flex-shrink-0"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              <span>Xem & In hóa đơn</span>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Sub Tab Content: 2. Loyalty Points History */}
                              {subTab === 'LOYALTY' && (
                                <div>
                                  {customerLoyaltyTxs.length === 0 ? (
                                    <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-slate-400">
                                      <Award className="w-8 h-8 mx-auto text-amber-300 stroke-[1.5] mb-2" />
                                      <p className="text-xs font-semibold text-slate-600">Chưa có lịch sử tích/đổi điểm nào</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Mọi giao dịch tích điểm qua đơn hàng POS hoặc điều chỉnh điểm sẽ hiển thị chi tiết tại đây.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100">
                                      {customerLoyaltyTxs.map((tx) => {
                                        const isEarn = tx.type === 'EARN';
                                        const isRedeem = tx.type === 'REDEEM';
                                        const isAdjust = tx.type === 'ADJUST';

                                        return (
                                          <div
                                            key={tx.id}
                                            className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-3 text-xs"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div
                                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                  isEarn
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                    : isRedeem
                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                }`}
                                              >
                                                {isEarn ? '+' : isRedeem ? '-' : '⚙'}
                                              </div>
                                              <div>
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                  <span>{tx.note}</span>
                                                  {tx.invoiceCode && (
                                                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                                      {tx.invoiceCode}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                  <span>{tx.createdAt}</span>
                                                  <span>&bull;</span>
                                                  <span>Loại: {isEarn ? 'Tích điểm mua hàng' : isRedeem ? 'Đổi điểm giảm giá' : 'Điều chỉnh thủ công'}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="text-right">
                                              <div
                                                className={`font-mono font-extrabold text-sm ${
                                                  tx.points > 0 ? 'text-emerald-600' : 'text-amber-700'
                                                }`}
                                              >
                                                {tx.points > 0 ? `+${tx.points}` : tx.points} điểm
                                              </div>
                                              <div className="text-[10px] text-slate-400 font-mono">
                                                Số dư sau: {tx.balanceAfter} điểm
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Sửa thông tin Khách hàng' : 'Thêm Khách hàng Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Hoàng Anh Dũng"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ví dụ: 0933112233"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="khachhang@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Địa chỉ giao hàng / cư trú..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Lưu Khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Loyalty Points Modal */}
      {adjustModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Điều chỉnh Điểm thưởng</h3>
                  <p className="text-[11px] text-slate-500">{adjustModalCustomer.name} - {adjustModalCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustModalCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-amber-800 font-medium">Điểm hiện tại:</span>
                <div className="text-lg font-mono font-extrabold text-amber-900">
                  {adjustModalCustomer.loyaltyPoints || 0} điểm
                </div>
              </div>
              <div className="text-right">
                <span className="text-amber-800 font-medium">Hạng hiện tại:</span>
                <div className="font-bold text-amber-900">
                  {adjustModalCustomer.tier || 'BRONZE'}
                </div>
              </div>
            </div>

            {adjustMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  adjustMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {adjustMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                )}
                <span>{adjustMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAdjustPointsSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điểm thay đổi (+ để cộng, - để trừ) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={adjustPointsDelta || ''}
                    onChange={(e) => setAdjustPointsDelta(Number(e.target.value))}
                    placeholder="Ví dụ: 50 hoặc -20"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAdjustPointsDelta(50)}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      +50
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustPointsDelta(100)}
                      className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      +100
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Số dư sau điều chỉnh:{' '}
                  <strong className="font-mono text-slate-800">
                    {Math.max(0, (adjustModalCustomer.loyaltyPoints || 0) + adjustPointsDelta)} điểm
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chỉnh *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Bù điểm sự kiện sinh nhật khách hàng / Đền bù lỗi dịch vụ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalCustomer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  Xác nhận Điều chỉnh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Full View / Print Receipt Modal */}
      {viewInvoice && (
        <InvoicePrintModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
      )}
    </div>
  );
};

