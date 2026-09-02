import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Store, Bell, Sparkles, Search, Keyboard } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenSearch, onOpenShortcuts }) => {
  const { currentUser, logout } = useAuth();

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'MANAGER':
        return 'Quản lý cửa hàng';
      default:
        return 'Nhân viên thu ngân';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          {currentTab}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search & Command Palette Trigger */}
        {onOpenSearch && (
          <button
            id="btn-header-search"
            onClick={onOpenSearch}
            title="Tìm kiếm sản phẩm hoặc chuyển phân hệ nhanh (Ctrl+K)"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Tìm kiếm nhanh</span>
            <kbd className="text-[10px] bg-white border border-slate-300 px-1.5 py-0.2 rounded font-mono text-slate-500 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Shortcuts Cheatsheet Trigger */}
        {onOpenShortcuts && (
          <button
            id="btn-header-shortcuts"
            onClick={onOpenShortcuts}
            title="Bảng tra cứu phím tắt toàn hệ thống (?)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Phím tắt</span>
            <kbd className="text-[10px] bg-blue-200/80 px-1 py-0.2 rounded font-mono">?</kbd>
          </button>
        )}

        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold flex items-center justify-center text-sm shadow-2xs">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">
                  {currentUser.employeeName || currentUser.username}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.2 rounded-full border ${getRoleBadgeColor(
                      currentUser.roleName
                    )}`}
                  >
                    {getRoleLabel(currentUser.roleName)}
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer ml-2"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
