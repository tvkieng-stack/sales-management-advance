import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { Category, Product, Status } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  Barcode,
  RotateCcw,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<Status | 'ALL'>('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    categoryId: 0,
    unit: 'Cái',
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minimumStock: 10,
    status: 'ACTIVE' as Status,
  });

  const loadData = () => {
    setProducts(db.getProducts());
    setCategories(db.getCategories().filter((c) => c.status === 'ACTIVE'));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut listener for focusing search (/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !isModalOpen
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: `893${Date.now().toString().slice(-9)}`,
      categoryId: categories[0]?.id || 0,
      unit: 'Cái',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      minimumStock: 10,
      status: 'ACTIVE',
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      barcode: p.barcode || '',
      categoryId: p.categoryId || 0,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stockQuantity: p.stockQuantity,
      minimumStock: p.minimumStock,
      status: p.status,
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm.' });
      return;
    }
    if (formData.sellingPrice < 0 || formData.costPrice < 0) {
      setMessage({ type: 'error', text: 'Giá sản phẩm không được âm.' });
      return;
    }

    try {
      if (editingProduct) {
        const updated = db.updateProduct({
          ...editingProduct,
          name: formData.name,
          barcode: formData.barcode,
          categoryId: formData.categoryId || null,
          unit: formData.unit,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          stockQuantity: Number(formData.stockQuantity),
          minimumStock: Number(formData.minimumStock),
          status: formData.status,
        });

        db.logActivity({
          userId: currentUser?.id,
          username: currentUser?.username || 'manager',
          userRole: currentUser?.roleName || 'MANAGER',
          employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
          action: 'PRODUCT_UPDATE',
          actionTitle: 'Cập nhật thông tin sản phẩm',
          targetType: 'PRODUCT',
          targetId: editingProduct.id,
          targetName: formData.name,
          details: `Cập nhật giá bán: ${formData.sellingPrice.toLocaleString('vi-VN')} đ, giá vốn: ${formData.costPrice.toLocaleString('vi-VN')} đ, trạng thái: ${formData.status}.`,
          metadata: { productId: editingProduct.id, name: formData.name, status: formData.status },
          severity: 'INFO',
        });

        setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công!' });
      } else {
        const created = db.createProduct({
          name: formData.name,
          barcode: formData.barcode,
          categoryId: formData.categoryId || null,
          unit: formData.unit,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          stockQuantity: Number(formData.stockQuantity),
          minimumStock: Number(formData.minimumStock),
          status: formData.status,
        });

        db.logActivity({
          userId: currentUser?.id,
          username: currentUser?.username || 'manager',
          userRole: currentUser?.roleName || 'MANAGER',
          employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
          action: 'PRODUCT_CREATE',
          actionTitle: 'Thêm sản phẩm mới',
          targetType: 'PRODUCT',
          targetId: created.id,
          targetName: created.name,
          details: `Tạo mới sản phẩm "${created.name}" (Mã vạch: ${created.barcode || 'N/A'}, Giá bán: ${created.sellingPrice.toLocaleString('vi-VN')} đ, Tồn ban đầu: ${created.stockQuantity}).`,
          metadata: { productId: created.id, name: created.name, barcode: created.barcode },
          severity: 'INFO',
        });

        setMessage({ type: 'success', text: 'Thêm sản phẩm mới thành công!' });
      }
      loadData();
      setTimeout(() => setIsModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi thao tác.' });
    }
  };

  const handleDeactivate = (id: number) => {
    const targetProd = products.find((p) => p.id === id);
    if (!targetProd) return;
    const willBeInactive = targetProd.status === 'ACTIVE';

    if (
      window.confirm(
        willBeInactive
          ? `Bạn có chắc chắn muốn VÔ HIỆU HÓA (Xóa tạm) sản phẩm "${targetProd.name}"?`
          : `Bạn có muốn kích hoạt lại sản phẩm "${targetProd.name}"?`
      )
    ) {
      db.deactivateProduct(id);

      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'manager',
        userRole: currentUser?.roleName || 'MANAGER',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
        action: 'PRODUCT_DELETE',
        actionTitle: willBeInactive ? 'Vô hiệu hóa sản phẩm' : 'Kích hoạt lại sản phẩm',
        targetType: 'PRODUCT',
        targetId: id,
        targetName: targetProd.name,
        details: willBeInactive
          ? `Chuyển trạng thái sản phẩm "${targetProd.name}" (Mã #${id}) sang INACTIVE (Ngừng kinh doanh).`
          : `Khôi phục hoạt động cho sản phẩm "${targetProd.name}" (Mã #${id}).`,
        metadata: { productId: id, productName: targetProd.name, newStatus: willBeInactive ? 'INACTIVE' : 'ACTIVE' },
        severity: willBeInactive ? 'CRITICAL' : 'INFO',
      });

      loadData();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
    searchInputRef.current?.focus();
  };

  const filteredProducts = products.filter((p) => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const matchQuery =
      !trimmedQuery ||
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.barcode?.toLowerCase().includes(trimmedQuery) ||
      `#${p.id}`.includes(trimmedQuery) ||
      p.categoryName?.toLowerCase().includes(trimmedQuery);
    const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchQuery && matchCategory && matchStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Danh mục Sản phẩm & Hàng hóa</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mã vạch (SKU/Barcode), giá vốn, giá bán lẻ và định mức tồn kho an toàn.
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sản phẩm mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              id="input-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU / Barcode..."
              className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    searchInputRef.current?.focus();
                  }}
                  title="Xóa tìm kiếm"
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 border border-slate-300/80 rounded">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Category & Status Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <select
                id="select-product-category"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="ALL">Tất cả danh mục ({products.length})</option>
                {categories.map((c) => {
                  const count = products.filter((p) => p.categoryId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <select
                id="select-product-status"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang kinh doanh</option>
                <option value="INACTIVE">Ngừng kinh doanh</option>
              </select>
            </div>

            {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                title="Đặt lại toàn bộ bộ lọc"
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter status summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>
              Tìm thấy <b className="text-blue-600 font-bold">{filteredProducts.length}</b> sản phẩm
              {products.length !== filteredProducts.length && (
                <span className="text-slate-400"> (trong tổng số {products.length})</span>
              )}
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200/60">
                Từ khóa: &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Sản phẩm & Mã SKU</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Đơn vị</th>
                <th className="px-4 py-3 text-right">Giá vốn</th>
                <th className="px-4 py-3 text-right">Giá bán</th>
                <th className="px-4 py-3 text-center">Tồn kho</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Search className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-slate-600">
                        Không tìm thấy sản phẩm nào khớp với tìm kiếm
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Hãy kiểm tra lại tên sản phẩm, mã SKU / Barcode hoặc xóa bộ lọc để xem lại toàn bộ danh sách.
                      </p>
                      {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Xóa bộ lọc tìm kiếm</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isLowStock = p.stockQuantity <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono">#{p.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>SKU: {p.barcode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {p.categoryName}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{p.unit}</td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            isLowStock
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.stockQuantity}
                          {isLowStock && (
                            <AlertTriangle className="w-3 h-3 ml-1 text-amber-600" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? 'Đang bán' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-prod-${p.id}`}
                            onClick={() => openEditModal(p)}
                            title="Chỉnh sửa"
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-toggle-prod-${p.id}`}
                            onClick={() => handleDeactivate(p.id)}
                            title={p.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị <b>{paginatedProducts.length}</b> / <b>{filteredProducts.length}</b> sản phẩm
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
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
                <label className="block font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nước ngọt Coca Cola 330ml"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã vạch (Barcode)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="893..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Chai, Lon, Hộp, Cái..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as Status })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">Đang kinh doanh</option>
                    <option value="INACTIVE">Tạm dừng kinh doanh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá vốn (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán lẻ (VNĐ) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng tồn kho</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cảnh báo tối thiểu</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  Lưu Sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
