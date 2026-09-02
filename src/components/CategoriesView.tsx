import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Category, Status } from '../types';
import { useAuth } from '../context/AuthContext';
import { Layers, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, X, Search } from 'lucide-react';

export const CategoriesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsCountMap, setProductsCountMap] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'ACTIVE' as Status });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const cats = db.getCategories();
    const prods = db.getProducts();
    const counts: Record<number, number> = {};
    for (const p of prods) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    }
    setCategories(cats);
    setProductsCountMap(counts);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', status: 'ACTIVE' });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description, status: cat.status });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên danh mục.' });
      return;
    }

    try {
      if (editingCategory) {
        db.updateCategory({
          ...editingCategory,
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });

        db.logActivity({
          userId: currentUser?.id,
          username: currentUser?.username || 'manager',
          userRole: currentUser?.roleName || 'MANAGER',
          employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
          action: 'CATEGORY_UPDATE',
          actionTitle: 'Cập nhật danh mục',
          targetType: 'CATEGORY',
          targetId: editingCategory.id,
          targetName: formData.name,
          details: `Cập nhật thông tin danh mục "${formData.name}". Trạng thái: ${formData.status}.`,
          metadata: { categoryId: editingCategory.id, name: formData.name },
          severity: 'INFO',
        });

        setMessage({ type: 'success', text: 'Cập nhật danh mục thành công!' });
      } else {
        const created = db.createCategory({
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });

        db.logActivity({
          userId: currentUser?.id,
          username: currentUser?.username || 'manager',
          userRole: currentUser?.roleName || 'MANAGER',
          employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
          action: 'CATEGORY_CREATE',
          actionTitle: 'Thêm danh mục mới',
          targetType: 'CATEGORY',
          targetId: created.id,
          targetName: created.name,
          details: `Tạo mới danh mục nhóm hàng "${created.name}".`,
          metadata: { categoryId: created.id, name: created.name },
          severity: 'INFO',
        });

        setMessage({ type: 'success', text: 'Thêm danh mục mới thành công!' });
      }
      loadData();
      setTimeout(() => setIsModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xử lý.' });
    }
  };

  const handleDeactivate = (id: number) => {
    const targetCat = categories.find((c) => c.id === id);
    if (!targetCat) return;
    const willBeInactive = targetCat.status === 'ACTIVE';

    if (
      window.confirm(
        willBeInactive
          ? `Bạn có chắc chắn muốn VÔ HIỆU HÓA danh mục "${targetCat.name}"?`
          : `Bạn có muốn kích hoạt lại danh mục "${targetCat.name}"?`
      )
    ) {
      db.deactivateCategory(id);

      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'manager',
        userRole: currentUser?.roleName || 'MANAGER',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản lý',
        action: 'CATEGORY_DELETE',
        actionTitle: willBeInactive ? 'Vô hiệu hóa danh mục' : 'Kích hoạt lại danh mục',
        targetType: 'CATEGORY',
        targetId: id,
        targetName: targetCat.name,
        details: willBeInactive
          ? `Vô hiệu hóa danh mục "${targetCat.name}" (ID #${id}).`
          : `Khôi phục hoạt động cho danh mục "${targetCat.name}" (ID #${id}).`,
        metadata: { categoryId: id, categoryName: targetCat.name, newStatus: willBeInactive ? 'INACTIVE' : 'ACTIVE' },
        severity: willBeInactive ? 'WARNING' : 'INFO',
      });

      loadData();
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Quản lý Nhóm & Danh mục Sản phẩm</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân loại hàng hóa giúp tìm kiếm nhanh và lập báo cáo doanh thu theo nhóm.
          </p>
        </div>

        <button
          id="btn-add-category"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Danh mục Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên hoặc mô tả..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Categories Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 w-16">ID</th>
              <th className="px-4 py-3">Tên danh mục</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3 text-center">Số lượng SP</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Không có danh mục nào.
                </td>
              </tr>
            ) : (
              filteredCategories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 text-slate-400 font-mono">#{c.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{c.description || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                      {productsCountMap[c.id] || 0} sản phẩm
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(c.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
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
                <label className="block font-semibold text-slate-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Đồ uống & Giải khát"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả nhóm hàng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
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
                  Lưu Danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
