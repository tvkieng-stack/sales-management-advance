import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Product, Purchase, StockTransaction, Supplier } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Warehouse,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'PURCHASE' | 'TRANSACTIONS' | 'PURCHASE_HISTORY'>('PURCHASE');

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Purchase Order Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [purchaseCart, setPurchaseCart] = useState<
    { product: Product; quantity: number; unitCost: number; subtotal: number }[]
  >([]);
  const [searchProdQuery, setSearchProdQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Adjust Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const loadData = () => {
    const prods = db.getProducts();
    const sups = db.getSuppliers().filter((s) => s.status === 'ACTIVE');
    const txs = db.getStockTransactions();
    const purs = db.getPurchases();

    setProducts(prods);
    setSuppliers(sups);
    setTransactions(txs);
    setPurchases(purs);
    if (sups.length > 0 && selectedSupplierId === 0) {
      setSelectedSupplierId(sups[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Purchase cart actions
  const addProductToPurchase = (prod: Product) => {
    const existing = purchaseCart.find((it) => it.product.id === prod.id);
    if (existing) {
      setPurchaseCart((prev) =>
        prev.map((it) =>
          it.product.id === prod.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                subtotal: (it.quantity + 1) * it.unitCost,
              }
            : it
        )
      );
    } else {
      setPurchaseCart((prev) => [
        ...prev,
        {
          product: prod,
          quantity: 10,
          unitCost: prod.costPrice || 0,
          subtotal: 10 * (prod.costPrice || 0),
        },
      ]);
    }
  };

  const updatePurchaseItem = (productId: number, quantity: number, unitCost: number) => {
    setPurchaseCart((prev) =>
      prev.map((it) =>
        it.product.id === productId
          ? {
              ...it,
              quantity: Math.max(1, quantity),
              unitCost: Math.max(0, unitCost),
              subtotal: Math.max(1, quantity) * Math.max(0, unitCost),
            }
          : it
      )
    );
  };

  const removePurchaseItem = (productId: number) => {
    setPurchaseCart((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleConfirmPurchase = () => {
    if (!selectedSupplierId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn nhà cung cấp.' });
      return;
    }
    if (purchaseCart.length === 0) {
      setMessage({ type: 'error', text: 'Danh sách sản phẩm nhập đang trống.' });
      return;
    }

    try {
      const created = db.confirmPurchase({
        supplierId: selectedSupplierId,
        employeeId: currentUser?.employeeId || 1,
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý kho',
        items: purchaseCart,
      });

      // Log purchase confirmation activity
      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'manager',
        userRole: currentUser?.roleName || 'MANAGER',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý kho',
        action: 'PURCHASE_CONFIRM',
        actionTitle: 'Xác nhận nhập kho hàng',
        targetType: 'INVENTORY',
        targetId: created.purchaseCode,
        targetName: created.supplierName,
        details: `Nhập kho ${created.items?.length || purchaseCart.length} mặt hàng từ NCC "${created.supplierName}". Tổng chi phí: ${formatCurrency(created.totalCost)}.`,
        metadata: {
          purchaseId: created.id,
          purchaseCode: created.purchaseCode,
          supplierId: selectedSupplierId,
          totalCost: created.totalCost,
          itemCount: purchaseCart.length,
        },
        severity: 'INFO',
      });

      setMessage({
        type: 'success',
        text: `Tạo phiếu nhập thành công! Mã phiếu: ${created.purchaseCode}`,
      });
      setPurchaseCart([]);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi nhập hàng.' });
    }
  };

  // Manual Adjust
  const handleOpenAdjust = (prod: Product) => {
    setAdjustProduct(prod);
    setAdjustQuantity(prod.stockQuantity);
    setAdjustReason('Kiểm kê định kỳ kho');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    try {
      const oldQty = adjustProduct.stockQuantity;
      const newQty = Number(adjustQuantity);
      const diff = newQty - oldQty;

      db.adjustProductStock(
        adjustProduct.id,
        newQty,
        currentUser?.employeeId || null,
        currentUser?.employeeName || currentUser?.username || 'Thủ kho',
        adjustReason
      );

      // Log stock adjustment activity for manager auditing
      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'manager',
        userRole: currentUser?.roleName || 'MANAGER',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Thủ kho',
        action: 'STOCK_ADJUSTMENT',
        actionTitle: 'Điều chỉnh số lượng tồn kho',
        targetType: 'PRODUCT',
        targetId: adjustProduct.id,
        targetName: adjustProduct.name,
        details: `Điều chỉnh tồn kho từ ${oldQty} thành ${newQty} ${adjustProduct.unit} (Biến động: ${diff > 0 ? '+' + diff : diff}). Lý do: ${adjustReason || 'Kiểm kê định kỳ'}.`,
        metadata: {
          productId: adjustProduct.id,
          oldStock: oldQty,
          newStock: newQty,
          diff,
          reason: adjustReason,
        },
        severity: Math.abs(diff) >= 20 || newQty === 0 ? 'CRITICAL' : 'WARNING',
      });

      setMessage({ type: 'success', text: `Điều chỉnh tồn kho "${adjustProduct.name}" thành công!` });
      setIsAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi điều chỉnh.' });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const totalPurchaseCost = purchaseCart.reduce((s, it) => s + it.subtotal, 0);

  const filteredCatalogForPurchase = products.filter(
    (p) =>
      p.status === 'ACTIVE' &&
      (!searchProdQuery ||
        p.name.toLowerCase().includes(searchProdQuery.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(searchProdQuery.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-blue-600" />
            <span>Quản lý Kho hàng & Nhập kho NCC</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu nhập hàng từ nhà cung cấp, kiểm kê tồn kho và theo dõi lịch sử biến động.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('PURCHASE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'PURCHASE'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lập Phiếu Nhập
          </button>
          <button
            onClick={() => setActiveTab('PURCHASE_HISTORY')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'PURCHASE_HISTORY'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử Nhập hàng ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sổ Quản lý Biến động Kho ({transactions.length})
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: CREATE PURCHASE ORDER */}
      {activeTab === 'PURCHASE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Product Picker for Purchase (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Chọn Hàng Hóa Cần Nhập</h3>
              <span className="text-xs text-slate-400">Click để thêm vào phiếu</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchProdQuery}
                onChange={(e) => setSearchProdQuery(e.target.value)}
                placeholder="Tìm theo tên hoặc barcode..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {filteredCatalogForPurchase.map((p) => (
                <div
                  key={p.id}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Tồn hiện tại: <b>{p.stockQuantity}</b> {p.unit} • Giá vốn cũ:{' '}
                      {formatCurrency(p.costPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAdjust(p)}
                      title="Điều chỉnh tồn nhanh"
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium cursor-pointer"
                    >
                      Kiểm kê
                    </button>
                    <button
                      onClick={() => addProductToPurchase(p)}
                      className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Purchase Order Summary Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Thông Tin Phiếu Nhập Hàng</h3>
              <span className="text-xs text-slate-400">Tự động tăng tồn kho khi xác nhận</span>
            </div>

            {/* Supplier Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nhà cung cấp *
              </label>
              <select
                id="select-purchase-supplier"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Sản phẩm</th>
                    <th className="px-3 py-2.5 w-24 text-center">Số lượng nhập</th>
                    <th className="px-3 py-2.5 w-28 text-right">Đơn giá nhập (VNĐ)</th>
                    <th className="px-3 py-2.5 w-28 text-right">Thành tiền</th>
                    <th className="px-2 py-2.5 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseCart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Chưa chọn sản phẩm nào để nhập.
                      </td>
                    </tr>
                  ) : (
                    purchaseCart.map((item) => (
                      <tr key={item.product.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-semibold text-slate-800">
                          {item.product.name}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.product.id,
                                Number(e.target.value),
                                item.unitCost
                              )
                            }
                            className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.product.id,
                                item.quantity,
                                Number(e.target.value)
                              )
                            }
                            className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button
                            onClick={() => removePurchaseItem(item.product.id)}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Cost Breakdown & Confirm */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Tổng tiền nhập hàng:</span>
                <div className="text-xl font-extrabold text-blue-600">
                  {formatCurrency(totalPurchaseCost)}
                </div>
              </div>
              <button
                id="btn-confirm-purchase"
                onClick={handleConfirmPurchase}
                disabled={purchaseCart.length === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Xác nhận Nhập kho & Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE HISTORY */}
      {activeTab === 'PURCHASE_HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã phiếu</th>
                  <th className="px-4 py-3">Nhà cung cấp</th>
                  <th className="px-4 py-3">Người nhập</th>
                  <th className="px-4 py-3">Ngày nhập</th>
                  <th className="px-4 py-3 text-right">Tổng chi phí</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600">{pur.purchaseCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{pur.supplierName}</td>
                    <td className="px-4 py-3 text-slate-600">{pur.employeeName}</td>
                    <td className="px-4 py-3 text-slate-500">{pur.createdAt}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(pur.totalCost)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        {pur.status === 'COMPLETED' ? 'Đã nhập kho' : pur.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK TRANSACTIONS AUDIT LOG */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-center">Loại biến động</th>
                  <th className="px-4 py-3 text-center">Số lượng</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{tx.createdAt}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{tx.productName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.type === 'PURCHASE'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.type === 'SALE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type === 'PURCHASE'
                          ? 'Nhập hàng'
                          : tx.type === 'SALE'
                          ? 'Bán hàng (POS)'
                          : 'Điều chỉnh kiểm kê'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold font-mono">
                      <span className={tx.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tx.employeeName || 'Hệ thống'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{tx.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Điều Chỉnh Kiểm Kê Tồn Kho</h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-500">Sản phẩm</label>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{adjustProduct.name}</div>
                <div className="text-[11px] text-slate-400">
                  Tồn hiện tại trên hệ thống: <b>{adjustProduct.stockQuantity}</b> {adjustProduct.unit}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số lượng tồn thực tế sau kiểm kê *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do điều chỉnh</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Kiểm kê cuối tháng, hàng bị hỏng, sai lệch số..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Cập nhật Tồn kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
