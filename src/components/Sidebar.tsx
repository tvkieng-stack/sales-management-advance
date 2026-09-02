import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Package,
  Users,
  Truck,
  Warehouse,
  Tag,
  BarChart3,
  UserCog,
  Database,
  Store,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenShortcuts?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenShortcuts }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.roleName || 'EMPLOYEE';

  const menuItems = [
    {
      id: 'Dashboard',
      label: 'Tổng quan (Dashboard)',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      hotkey: 'Alt+1',
    },
    {
      id: 'POS',
      label: 'Bán hàng (POS)',
      icon: ShoppingCart,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      badge: 'Hot',
      hotkey: 'F4',
    },
    {
      id: 'Categories',
      label: 'Danh mục',
      icon: Layers,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      hotkey: 'Alt+2',
    },
    {
      id: 'Products',
      label: 'Sản phẩm',
      icon: Package,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      hotkey: 'Alt+3',
    },
    {
      id: 'Customers',
      label: 'Khách hàng',
      icon: Users,
      roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
      hotkey: 'Alt+4',
    },
    {
      id: 'Inventory',
      label: 'Kho / Nhập hàng',
      icon: Warehouse,
      roles: ['ADMIN', 'MANAGER'],
      hotkey: 'Alt+5',
    },
    {
      id: 'Suppliers',
      label: 'Nhà cung cấp',
      icon: Truck,
      roles: ['ADMIN', 'MANAGER'],
      hotkey: 'Alt+7',
    },
    {
      id: 'Promotions',
      label: 'Khuyến mãi',
      icon: Tag,
      roles: ['ADMIN', 'MANAGER'],
      hotkey: 'Alt+8',
    },
    {
      id: 'Reports',
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER'],
      hotkey: 'Alt+6',
    },
    {
      id: 'ActivityLog',
      label: 'Nhật ký Hoạt động',
      icon: ShieldAlert,
      roles: ['ADMIN', 'MANAGER'],
      badge: 'Audit',
      hotkey: 'Alt+0',
    },
    {
      id: 'Employees',
      label: 'Nhân viên & Tài khoản',
      icon: UserCog,
      roles: ['ADMIN'],
    },
    {
      id: 'Backup',
      label: 'Sao lưu & Khôi phục',
      icon: Database,
      roles: ['ADMIN', 'MANAGER'],
      hotkey: 'Alt+9',
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand logo & title */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm text-white tracking-wide">POS MANAGEMENT</div>
          <div className="text-[11px] text-slate-400">Quản lý Bán hàng Pro</div>
        </div>
      </div>

      {/* Navigation menu items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Menu chức năng</span>
          <span className="text-[10px] text-slate-500 font-mono">Phím tắt</span>
        </div>
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id.toLowerCase()}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.hotkey && (
                  <kbd
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                      isActive
                        ? 'bg-blue-700 text-blue-100 border border-blue-500'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.hotkey}
                  </kbd>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Footer info & Shortcuts help button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 space-y-2">
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition cursor-pointer"
          >
            <span>Phím tắt hệ thống</span>
            <kbd className="px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-blue-400">
              ?
            </kbd>
          </button>
        )}
        <div className="px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs text-slate-400 truncate">
            Hệ thống: <span className="text-slate-200 font-medium">Sẵn sàng (Online)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
