import React, { useState, useEffect } from 'react';
import {
  Keyboard,
  X,
  Search,
  ShoppingCart,
  Zap,
  Printer,
  Package,
  Layers,
  Sparkles,
  Command,
} from 'lucide-react';

interface GlobalShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'NAVIGATION' | 'POS' | 'SEARCH' | 'PRINT';
  badge?: string;
}

export const GlobalShortcutsModal: React.FC<GlobalShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    // POS & Checkout
    {
      keys: ['F9'],
      description: 'Thanh toán đơn hàng & Xuất hóa đơn (Finalize Sale)',
      category: 'POS',
      badge: 'Quan trọng',
    },
    {
      keys: ['Ctrl', 'Enter'],
      description: 'Phím tắt phụ thanh toán & xuất hóa đơn POS',
      category: 'POS',
    },
    {
      keys: ['F1'],
      description: 'Đặt con trỏ vào ô tìm kiếm sản phẩm / Quét mã vạch',
      category: 'POS',
    },
    {
      keys: ['/'],
      description: 'Lối tắt nhanh tập trung vào ô tìm kiếm sản phẩm',
      category: 'POS',
    },
    {
      keys: ['F2'],
      description: 'Bật / Tắt máy quét mã vạch Camera',
      category: 'POS',
    },
    {
      keys: ['F4'],
      description: 'Mở màn hình Bán hàng (POS) hoặc chọn Khách hàng',
      category: 'POS',
    },
    {
      keys: ['F6'],
      description: 'Tập trung chọn Chương trình Khuyến mãi',
      category: 'POS',
    },
    {
      keys: ['F7'],
      description: 'Tập trung nhập Giảm giá thêm',
      category: 'POS',
    },
    {
      keys: ['F8'],
      description: 'Chuyển đổi phương thức thanh toán (Tiền mặt / QR / Thẻ)',
      category: 'POS',
    },
    {
      keys: ['Alt', '1 / 2 / 3'],
      description: 'Chọn nhanh Tiền mặt (1), Chuyển khoản (2), Thẻ (3)',
      category: 'POS',
    },
    {
      keys: ['Ctrl', 'T'],
      description: 'Mở thêm hóa đơn bán hàng mới (Đa đơn cùng lúc)',
      category: 'POS',
    },
    {
      keys: ['Ctrl', 'W'],
      description: 'Đóng tab hóa đơn hiện tại',
      category: 'POS',
    },

    // Global Search & Command
    {
      keys: ['Ctrl', 'K'],
      description: 'Mở bảng tìm kiếm nhanh & Command Palette toàn hệ thống',
      category: 'SEARCH',
      badge: 'Toàn cục',
    },
    {
      keys: ['F3'],
      description: 'Mở nhanh hộp tìm kiếm sản phẩm & tác vụ',
      category: 'SEARCH',
    },

    // Navigation
    {
      keys: ['Alt', 'P'],
      description: 'Mở màn hình Bán hàng (POS)',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', 'D'],
      description: 'Chuyển sang Tổng quan (Dashboard)',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '1'],
      description: 'Chuyển sang Tổng quan (Dashboard)',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '3'],
      description: 'Chuyển sang Quản lý Sản phẩm',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '4'],
      description: 'Chuyển sang Quản lý Khách hàng',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '5'],
      description: 'Chuyển sang Kho & Nhập hàng (Inventory)',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '6'],
      description: 'Chuyển sang Báo cáo Doanh thu (Reports)',
      category: 'NAVIGATION',
    },
    {
      keys: ['Alt', '0'],
      description: 'Chuyển sang Nhật ký Hoạt động & Kiểm toán (Activity Log)',
      category: 'NAVIGATION',
      badge: 'Kiểm toán',
    },

    // Print & General
    {
      keys: ['Enter'],
      description: 'In hóa đơn (khi đang mở bảng xem hóa đơn)',
      category: 'PRINT',
    },
    {
      keys: ['Ctrl', 'P'],
      description: 'In hóa đơn bán hàng',
      category: 'PRINT',
    },
    {
      keys: ['?'],
      description: 'Mở bảng tra cứu phím tắt này (Shift + ?)',
      category: 'PRINT',
    },
    {
      keys: ['Esc'],
      description: 'Đóng bảng thông báo / Hủy thao tác hiện tại',
      category: 'PRINT',
    },
  ];

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = [
    { id: 'POS', title: 'Thu ngân & Bán hàng (POS)', icon: ShoppingCart },
    { id: 'SEARCH', title: 'Tìm kiếm & Thao tác nhanh', icon: Search },
    { id: 'NAVIGATION', title: 'Điều hướng & Phân hệ', icon: Layers },
    { id: 'PRINT', title: 'In ấn & Thao tác chung', icon: Printer },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Phím tắt Hệ thống (Keyboard Shortcuts)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/20">
                  Tăng tốc 3x
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Sử dụng các phím tắt để thao tác bán hàng, tìm kiếm và xuất hóa đơn siêu tốc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search inside cheatsheet */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch}
              onInput={(e: any) => setSearch(e.target.value)}
              placeholder="Tìm kiếm phím tắt (ví dụ: F9, tìm kiếm, POS, in)..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Shortcuts List by Group */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {categories.map((cat) => {
            const catItems = filteredShortcuts.filter((s) => s.category === cat.id);
            if (catItems.length === 0) return null;
            const Icon = cat.icon;

            return (
              <div key={cat.id} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{cat.title}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {catItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 transition flex items-center justify-between gap-3"
                    >
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{item.description}</span>
                          {item.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 font-bold">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 bg-white border border-slate-300 text-slate-800 text-[11px] font-bold font-mono rounded-lg shadow-2xs min-w-[24px] text-center"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredShortcuts.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy phím tắt nào phù hợp với &ldquo;{search}&rdquo;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">Mẹo:</span> Nhấn{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">
              ?
            </kbd>{' '}
            bất kỳ lúc nào để mở lại bảng này.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            Đã hiểu (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
