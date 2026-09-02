import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/db';
import { Product } from '../types';
import {
  Search,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Warehouse,
  Truck,
  Tag,
  BarChart3,
  UserCog,
  Database,
  ArrowRight,
  Sparkles,
  Barcode,
  X,
  Keyboard,
  ShieldAlert,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onOpenShortcutsModal?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenShortcutsModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      setProducts(db.getProducts().filter((p) => p.status === 'ACTIVE'));
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navItems = [
    { id: 'POS', title: 'Màn hình Bán hàng (POS)', subtitle: 'Thực hiện bán hàng, quét mã vạch & thanh toán', icon: ShoppingCart, hotkey: 'F4 / Alt+P' },
    { id: 'Dashboard', title: 'Tổng quan (Dashboard)', subtitle: 'Cảnh báo hết hàng, doanh số hôm nay', icon: BarChart3, hotkey: 'Alt+1' },
    { id: 'Products', title: 'Quản lý Sản phẩm', subtitle: 'Xem danh sách sản phẩm, giá bán, tồn kho', icon: Package, hotkey: 'Alt+3' },
    { id: 'Customers', title: 'Khách hàng & Tích điểm', subtitle: 'Quản lý thông tin hội viên và hạng thẻ', icon: Users, hotkey: 'Alt+4' },
    { id: 'Inventory', title: 'Kho & Nhập hàng', subtitle: 'Lập phiếu nhập hàng, quản lý kho', icon: Warehouse, hotkey: 'Alt+5' },
    { id: 'Reports', title: 'Báo cáo Doanh thu & Lợi nhuận', subtitle: 'Xuất file CSV, phân tích tài chính', icon: BarChart3, hotkey: 'Alt+6' },
    { id: 'Categories', title: 'Danh mục Sản phẩm', subtitle: 'Quản lý nhóm phân loại hàng', icon: Layers, hotkey: 'Alt+2' },
    { id: 'Suppliers', title: 'Nhà cung cấp', subtitle: 'Danh sách đối tác nhập hàng', icon: Truck, hotkey: 'Alt+7' },
    { id: 'Promotions', title: 'Khuyến mãi & Chiết khấu', subtitle: 'Quản lý voucher và giảm giá', icon: Tag, hotkey: 'Alt+8' },
    { id: 'ActivityLog', title: 'Nhật ký Hoạt động & Kiểm toán', subtitle: 'Xem vết kiểm toán xóa dữ liệu, chỉnh kho, bảo mật', icon: ShieldAlert, hotkey: 'Alt+0' },
    { id: 'Backup', title: 'Sao lưu & Khôi phục', subtitle: 'Xuất và nhập dữ liệu JSON', icon: Database, hotkey: 'Alt+9' },
  ];

  // Filter items
  const trimmed = query.trim().toLowerCase();

  const matchingNavItems = navItems.filter(
    (n) => n.title.toLowerCase().includes(trimmed) || n.subtitle.toLowerCase().includes(trimmed)
  );

  const matchingProducts = trimmed
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            p.barcode?.toLowerCase().includes(trimmed) ||
            p.categoryName?.toLowerCase().includes(trimmed)
        )
        .slice(0, 8)
    : [];

  const totalResults = matchingNavItems.length + matchingProducts.length + 1; // +1 for Shortcuts action

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelection(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeSelection = (index: number) => {
    if (index < matchingNavItems.length) {
      const selectedNav = matchingNavItems[index];
      onNavigate(selectedNav.id);
      onClose();
    } else if (index < matchingNavItems.length + matchingProducts.length) {
      const prodIndex = index - matchingNavItems.length;
      const product = matchingProducts[prodIndex];
      // Switch to POS and let cashier add
      onNavigate('POS');
      onClose();
    } else {
      // Open shortcuts modal
      onClose();
      onOpenShortcutsModal?.();
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Box */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/70">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm nhanh sản phẩm, mã SKU hoặc gõ tên phân hệ để chuyển trang..."
            className="w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-4 flex-1">
          {/* Matched Products */}
          {matchingProducts.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Sản phẩm & Hàng hóa ({matchingProducts.length})</span>
                <span className="text-[10px] text-blue-600 font-semibold">Nhấn Enter để mở POS</span>
              </div>
              <div className="space-y-1">
                {matchingProducts.map((p, idx) => {
                  const globalIdx = matchingNavItems.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  return (
                    <div
                      key={p.id}
                      onClick={() => executeSelection(globalIdx)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Package className="w-4.5 h-4.5" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-xs truncate flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {p.barcode ? `(${p.barcode})` : `#${p.id}`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>ĐVT: {p.unit}</span>
                            <span>&bull;</span>
                            <span>
                              Tồn kho: <b className="text-slate-700">{p.stockQuantity}</b>
                            </span>
                            <span>&bull;</span>
                            <span>{p.categoryName || 'Mặc định'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-extrabold text-xs text-blue-600">
                          {formatCurrency(p.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Giá bán lẻ</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {matchingNavItems.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Chuyển trang & Phân hệ ({matchingNavItems.length})</span>
              </div>
              <div className="space-y-1">
                {matchingNavItems.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => executeSelection(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">{item.title}</div>
                          <div className="text-[11px] text-slate-500">{item.subtitle}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.hotkey && (
                          <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 rounded-md">
                            {item.hotkey}
                          </kbd>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cheatsheet shortcut trigger */}
          <div className="pt-2 border-t border-slate-100">
            <div
              onClick={() => executeSelection(totalResults - 1)}
              onMouseEnter={() => setSelectedIndex(totalResults - 1)}
              className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 border ${
                selectedIndex === totalResults - 1
                  ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                  : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Keyboard className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-bold text-xs">Mở bảng tra cứu phím tắt toàn hệ thống</div>
                  <div className="text-[11px] text-slate-500">Xem đầy đủ phím tắt POS, in ấn, điều hướng</div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 rounded-md">
                ?
              </kbd>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono">↓</kbd>{' '}
              để di chuyển
            </span>
            <span>
              <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono">Enter</kbd>{' '}
              chọn
            </span>
            <span>
              <kbd className="px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[10px] font-mono">Esc</kbd>{' '}
              đóng
            </span>
          </div>
          <span className="font-medium text-slate-500">Phím tắt nhanh: Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
