import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { CustomersView } from './components/CustomersView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { PromotionsView } from './components/PromotionsView';
import { ReportsView } from './components/ReportsView';
import { EmployeesView } from './components/EmployeesView';
import { BackupView } from './components/BackupView';
import { ActivityLogView } from './components/ActivityLogView';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { GlobalShortcutsModal } from './components/GlobalShortcutsModal';

const MainLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('Dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. Ctrl+K or Cmd+K: Open Command Palette from anywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 2. F3: Quick search palette
      if (e.key === 'F3') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        return;
      }

      // 3. '?' or Shift+'/' to open Shortcuts cheat sheet (when not in text input)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 4. Alt + [1-9] for quick tab switching (works everywhere or when not editing text)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentTab('Dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setCurrentTab('Categories');
        } else if (e.key === '3') {
          e.preventDefault();
          setCurrentTab('Products');
        } else if (e.key === '4') {
          e.preventDefault();
          setCurrentTab('Customers');
        } else if (e.key === '5') {
          e.preventDefault();
          setCurrentTab('Inventory');
        } else if (e.key === '6') {
          e.preventDefault();
          setCurrentTab('Reports');
        } else if (e.key === '7') {
          e.preventDefault();
          setCurrentTab('Suppliers');
        } else if (e.key === '8') {
          e.preventDefault();
          setCurrentTab('Promotions');
        } else if (e.key === '9') {
          e.preventDefault();
          setCurrentTab('Backup');
        } else if (e.key === '0') {
          e.preventDefault();
          setCurrentTab('ActivityLog');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return <LoginView />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'Dashboard':
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'POS':
        return <PosView />;
      case 'Products':
        return <ProductsView />;
      case 'Categories':
        return <CategoriesView />;
      case 'Customers':
        return <CustomersView />;
      case 'Inventory':
        return <InventoryView />;
      case 'Suppliers':
        return <SuppliersView />;
      case 'Promotions':
        return <PromotionsView />;
      case 'Reports':
        return <ReportsView />;
      case 'Employees':
        return <EmployeesView />;
      case 'Backup':
        return <BackupView />;
      case 'ActivityLog':
        return <ActivityLogView />;
      default:
        return <DashboardView onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'Dashboard':
        return 'Tổng quan hoạt động';
      case 'POS':
        return 'Màn hình Bán hàng (Point of Sale)';
      case 'Products':
        return 'Quản lý Sản phẩm';
      case 'Categories':
        return 'Danh mục Sản phẩm';
      case 'Customers':
        return 'Quản lý Khách hàng & Thành viên';
      case 'Inventory':
        return 'Kho & Quản lý Nhập hàng';
      case 'Suppliers':
        return 'Nhà cung cấp & Đối tác';
      case 'Promotions':
        return 'Chương trình Khuyến mãi';
      case 'Reports':
        return 'Báo cáo & Thống kê Doanh số';
      case 'Employees':
        return 'Nhân sự & Phân quyền Tài khoản';
      case 'Backup':
        return 'Sao lưu & Khôi phục Dữ liệu';
      case 'ActivityLog':
        return 'Nhật ký Hoạt động & Kiểm toán (Activity Log)';
      default:
        return tab;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          currentTab={getTabLabel(currentTab)}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Global Command Palette Modal (Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Global Keyboard Shortcuts Modal (?) */}
      <GlobalShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
