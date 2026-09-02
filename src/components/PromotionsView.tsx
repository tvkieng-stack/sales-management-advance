import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DiscountType, Promotion, Status } from '../types';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, X, Calendar } from 'lucide-react';

export const PromotionsView: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as DiscountType,
    discountValue: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    status: 'ACTIVE' as Status,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setPromotions(db.getPromotions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPromo(null);
    setFormData({
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      status: 'ACTIVE',
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setFormData({
      name: p.name,
      description: p.description,
      discountType: p.discountType,
      discountValue: p.discountValue,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên chương trình khuyến mãi.' });
      return;
    }
    if (formData.discountValue <= 0) {
      setMessage({ type: 'error', text: 'Giá trị chiết khấu phải lớn hơn 0.' });
      return;
    }

    try {
      if (editingPromo) {
        db.updatePromotion({
          ...editingPromo,
          name: formData.name,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        });
        setMessage({ type: 'success', text: 'Cập nhật khuyến mãi thành công!' });
      } else {
        db.createPromotion({
          name: formData.name,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
        });
        setMessage({ type: 'success', text: 'Thêm khuyến mãi mới thành công!' });
      }
      loadData();
      setTimeout(() => setIsModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xử lý.' });
    }
  };

  const handleDeactivate = (id: number) => {
    if (window.confirm('Bạn có chắc muốn chuyển trạng thái khuyến mãi này?')) {
      db.deactivatePromotion(id);
      loadData();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>Chương trình Khuyến mãi & Chiết khấu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập chiết khấu theo tỷ lệ % hoặc số tiền cố định áp dụng tự động trên màn hình bán hàng.
          </p>
        </div>

        <button
          id="btn-add-promotion"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khuyến mãi Mới</span>
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Tên chương trình</th>
                <th className="px-4 py-3">Mô tả chi tiết</th>
                <th className="px-4 py-3 text-center">Mức chiết khấu</th>
                <th className="px-4 py-3">Thời gian hiệu lực</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có chương trình khuyến mãi nào.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const isExpired = p.endDate < todayStr;
                  const isUpcoming = p.startDate > todayStr;
                  const isRunning = p.status === 'ACTIVE' && !isExpired && !isUpcoming;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono">#{p.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{p.description || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-extrabold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                          {p.discountType === 'PERCENTAGE'
                            ? `-${p.discountValue}%`
                            : `-${p.discountValue.toLocaleString('vi-VN')}đ`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                        {p.startDate} → {p.endDate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {p.status !== 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 font-semibold">
                            Tạm dừng
                          </span>
                        ) : isRunning ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800 font-bold">
                            Đang chạy
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-semibold">
                            Hết hạn
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800 font-semibold">
                            Sắp diễn ra
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(p.id)}
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
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPromo ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi Mới'}
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
                <label className="block font-semibold text-slate-700 mb-1">Tên chương trình *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Tri ân khách hàng tháng 2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả điều kiện khuyến mãi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại giảm giá</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value as DiscountType })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá trị giảm ({formData.discountType === 'PERCENTAGE' ? '%' : 'VNĐ'}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  <option value="ACTIVE">Kích hoạt</option>
                  <option value="INACTIVE">Vô hiệu hóa</option>
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
                  Lưu Khuyến mãi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
