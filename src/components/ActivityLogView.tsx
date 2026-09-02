import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../lib/db';
import { ActivityLog, ActivityActionType, ActivitySeverity, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  UserCheck,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  Activity,
  Layers,
  Warehouse,
  CheckCircle2,
  Lock,
  Database,
  Eye,
  RefreshCw,
  X,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { currentUser, hasRole } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [viewMode, setViewMode] = useState<'TABLE' | 'TIMELINE'>('TABLE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionGroup, setSelectedActionGroup] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<ActivitySeverity | 'ALL'>('ALL');
  const [selectedRole, setSelectedRole] = useState<Role | 'ALL'>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | '7DAYS' | '30DAYS' | 'ALL'>('ALL');

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const loadLogs = () => {
    const data = db.getActivityLogs();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter Logic
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const d7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return logs.filter((log) => {
      // Date Filter
      const logDate = log.createdAt.slice(0, 10);
      if (selectedPeriod === 'TODAY' && logDate !== todayStr) return false;
      if (selectedPeriod === '7DAYS' && logDate < d7Ago) return false;
      if (selectedPeriod === '30DAYS' && logDate < d30Ago) return false;

      // Severity Filter
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) return false;

      // Role Filter
      if (selectedRole !== 'ALL' && log.userRole !== selectedRole) return false;

      // Action Group Filter
      if (selectedActionGroup !== 'ALL') {
        if (selectedActionGroup === 'STOCK' && log.action !== 'STOCK_ADJUSTMENT') return false;
        if (
          selectedActionGroup === 'DELETIONS' &&
          !['PRODUCT_DELETE', 'CATEGORY_DELETE', 'SUPPLIER_DELETE', 'PROMOTION_DELETE', 'EMPLOYEE_DEACTIVATE'].includes(log.action)
        )
          return false;
        if (selectedActionGroup === 'REPORTS' && log.action !== 'REPORT_EXPORT') return false;
        if (selectedActionGroup === 'PURCHASE' && log.action !== 'PURCHASE_CONFIRM') return false;
        if (
          selectedActionGroup === 'AUTH_SECURITY' &&
          !['USER_LOGIN', 'USER_CREATE', 'USER_STATUS_CHANGE', 'USER_PASSWORD_CHANGE'].includes(log.action)
        )
          return false;
        if (
          selectedActionGroup === 'SYSTEM_DATA' &&
          !['BACKUP_EXPORT', 'BACKUP_RESTORE', 'SYSTEM_RESET', 'LOGS_CLEARED'].includes(log.action)
        )
          return false;
      }

      // Keyword Search (User, Action Title, Target, Details, Reference ID)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchUser =
          log.username.toLowerCase().includes(query) ||
          log.employeeName?.toLowerCase().includes(query);
        const matchTitle = log.actionTitle.toLowerCase().includes(query);
        const matchTarget =
          log.targetName?.toLowerCase().includes(query) ||
          String(log.targetId || '').toLowerCase().includes(query);
        const matchDetails = log.details.toLowerCase().includes(query);

        if (!matchUser && !matchTitle && !matchTarget && !matchDetails) {
          return false;
        }
      }

      return true;
    });
  }, [logs, searchQuery, selectedActionGroup, selectedSeverity, selectedRole, selectedPeriod]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Statistics for Managers
  const stats = useMemo(() => {
    let criticalCount = 0;
    let stockAdjustmentCount = 0;
    let reportExportCount = 0;
    let deletionCount = 0;

    for (const l of logs) {
      if (l.severity === 'CRITICAL') criticalCount++;
      if (l.action === 'STOCK_ADJUSTMENT') stockAdjustmentCount++;
      if (l.action === 'REPORT_EXPORT') reportExportCount++;
      if (
        ['PRODUCT_DELETE', 'CATEGORY_DELETE', 'SUPPLIER_DELETE', 'PROMOTION_DELETE', 'EMPLOYEE_DEACTIVATE'].includes(
          l.action
        )
      ) {
        deletionCount++;
      }
    }

    return {
      total: logs.length,
      criticalCount,
      stockAdjustmentCount,
      reportExportCount,
      deletionCount,
    };
  }, [logs]);

  // Export logs to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      showToast('Không có dữ liệu nhật ký để xuất.');
      return;
    }

    const headers = [
      'ID',
      'Thời gian',
      'Người thực hiện',
      'Vai trò',
      'Tên nhân viên',
      'Mức độ',
      'Hành động',
      'Đối tượng',
      'Tên đối tượng / Mã',
      'Chi tiết thao tác',
      'Địa chỉ IP',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.createdAt}"`,
      `"${l.username}"`,
      `"${l.userRole}"`,
      `"${l.employeeName || ''}"`,
      `"${l.severity}"`,
      `"${l.actionTitle}"`,
      `"${l.targetType}"`,
      `"${l.targetName || l.targetId || ''}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_audit_logs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Đã xuất ${filteredLogs.length} bản ghi nhật ký hoạt động ra file CSV!`);
  };

  // Clear / Purge Logs (Admin only)
  const handleClearLogs = () => {
    if (!hasRole(['ADMIN'])) {
      alert('Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền dọn dẹp nhật ký.');
      return;
    }

    if (
      window.confirm(
        'XÁC NHẬN DỌN DẸP: Bạn có chắc muốn xóa lịch sử nhật ký hoạt động cũ? Thao tác dọn dẹp sẽ được lưu lại một bản ghi audit mới.'
      )
    ) {
      db.clearActivityLogs({
        username: currentUser?.username || 'admin',
        roleName: currentUser?.roleName || 'ADMIN',
        employeeName: currentUser?.employeeName || 'Quản trị viên',
      });
      loadLogs();
      showToast('Đã dọn dẹp nhật ký hoạt động thành công.');
    }
  };

  const getSeverityBadge = (sev: ActivitySeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
            NGHIÊM TRỌNG
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            CẢNH BÁO
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            THÔNG TIN
          </span>
        );
    }
  };

  const getActionIcon = (action: ActivityActionType) => {
    if (action === 'STOCK_ADJUSTMENT') return <Warehouse className="w-4 h-4 text-amber-600" />;
    if (action.includes('DELETE') || action.includes('DEACTIVATE'))
      return <Trash2 className="w-4 h-4 text-rose-600" />;
    if (action === 'REPORT_EXPORT') return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    if (action === 'PURCHASE_CONFIRM') return <Warehouse className="w-4 h-4 text-blue-600" />;
    if (action.includes('USER') || action.includes('LOGIN'))
      return <Lock className="w-4 h-4 text-indigo-600" />;
    if (action.includes('BACKUP') || action.includes('SYSTEM'))
      return <Database className="w-4 h-4 text-purple-600" />;
    return <Activity className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="font-bold text-emerald-400">Thông báo hệ thống</div>
            <div className="text-slate-300 mt-0.5">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Nhật ký Hoạt động & Kiểm toán Hệ thống
              </h2>
              <p className="text-xs text-slate-500">
                Theo dõi và giám sát các thao tác trọng yếu (xóa dữ liệu, điều chỉnh tồn kho, xuất báo cáo tài chính, bảo mật).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button
            onClick={loadLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </button>

          {hasRole(['ADMIN']) && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Dọn dẹp nhật ký cũ (Chỉ Quản trị viên)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dọn dẹp nhật ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards for Manager Auditing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Tổng số hoạt động</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.total}</div>
          <div className="text-2xs text-slate-400 mt-1">Được ghi nhận tự động</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Thao tác xóa / Vô hiệu hóa</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">{stats.deletionCount}</div>
          <div className="text-2xs text-slate-400 mt-1">Sản phẩm, danh mục, nhân viên</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Điều chỉnh tồn kho</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">{stats.stockAdjustmentCount}</div>
          <div className="text-2xs text-slate-400 mt-1">Kiểm kê & lệch số lượng</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Xuất báo cáo tài chính</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">{stats.reportExportCount}</div>
          <div className="text-2xs text-slate-400 mt-1">Doanh thu & lợi nhuận CSV</div>
        </div>
      </div>

      {/* Filter and Control Center */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo người dùng, hành động, tên sản phẩm, mã đơn..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start lg:self-auto">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng kiểm toán
            </button>
            <button
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'TIMELINE' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dòng thời gian
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
          {/* Action Type Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Loại hành động</label>
            <select
              value={selectedActionGroup}
              onChange={(e) => {
                setSelectedActionGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="STOCK">📦 Điều chỉnh tồn kho</option>
              <option value="DELETIONS">🗑️ Xóa / Vô hiệu hóa</option>
              <option value="REPORTS">📊 Xuất báo cáo tài chính</option>
              <option value="PURCHASE">🚚 Nhập kho NCC</option>
              <option value="AUTH_SECURITY">🔒 Đăng nhập & Bảo mật</option>
              <option value="SYSTEM_DATA">💾 Sao lưu & Hệ thống</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Mức độ rủi ro</label>
            <select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="CRITICAL">🔴 Nghiêm trọng (Critical)</option>
              <option value="WARNING">🟡 Cảnh báo (Warning)</option>
              <option value="INFO">🔵 Thông tin (Info)</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Vai trò người thực hiện</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="MANAGER">Quản lý (MANAGER)</option>
              <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
            </select>
          </div>

          {/* Date Period Filter */}
          <div>
            <label className="block text-2xs font-semibold text-slate-500 mb-1">Kỳ thời gian</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Toàn bộ thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7DAYS">7 ngày gần nhất</option>
              <option value="30DAYS">30 ngày gần nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Table vs Timeline */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-14 text-center">ID</th>
                  <th className="px-4 py-3 w-40">Thời gian</th>
                  <th className="px-4 py-3 w-48">Người thực hiện</th>
                  <th className="px-4 py-3 w-48">Hành động</th>
                  <th className="px-4 py-3 w-32">Mức độ</th>
                  <th className="px-4 py-3">Chi tiết & Mục tiêu</th>
                  <th className="px-4 py-3 w-16 text-center">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Không tìm thấy bản ghi nhật ký hoạt động nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono text-slate-400 text-center">#{log.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-2xs">
                        <div className="font-semibold text-slate-700">{log.createdAt.slice(0, 10)}</div>
                        <div className="text-slate-400">{log.createdAt.slice(11)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{log.username}</div>
                        <div className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-medium ${
                              log.userRole === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : log.userRole === 'MANAGER'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {log.userRole}
                          </span>
                          {log.employeeName && <span>• {log.employeeName}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                            {getActionIcon(log.action)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{log.actionTitle}</div>
                            <div className="text-2xs text-slate-400 uppercase">{log.targetType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getSeverityBadge(log.severity)}</td>
                      <td className="px-4 py-3">
                        <div className="line-clamp-2 text-slate-600">{log.details}</div>
                        {log.targetName && (
                          <div className="text-2xs font-semibold text-blue-600 mt-0.5">
                            Mục tiêu: {log.targetName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Hiển thị <span className="font-semibold text-slate-800">{paginatedLogs.length}</span> trên tổng số{' '}
                <span className="font-semibold text-slate-800">{filteredLogs.length}</span> bản ghi
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div className="relative pl-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Không có sự kiện nhật ký nào.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="relative mb-6 last:mb-0 group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      log.severity === 'CRITICAL'
                        ? 'bg-rose-500 text-white'
                        : log.severity === 'WARNING'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>

                  <div
                    onClick={() => setSelectedLog(log)}
                    className="bg-slate-50 hover:bg-blue-50/40 p-4 rounded-xl border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{log.actionTitle}</span>
                        {getSeverityBadge(log.severity)}
                      </div>
                      <span className="text-2xs font-mono text-slate-400">{log.createdAt}</span>
                    </div>

                    <p className="text-xs text-slate-600 mb-2">{log.details}</p>

                    <div className="flex items-center justify-between text-2xs text-slate-500 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{log.username}</span>
                        <span>({log.userRole})</span>
                        {log.targetName && (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                            {log.targetName}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono">#{log.id}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  {getActionIcon(selectedLog.action)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedLog.actionTitle}</span>
                    {getSeverityBadge(selectedLog.severity)}
                  </h3>
                  <div className="text-2xs text-slate-400 font-mono">Mã bản ghi: #{selectedLog.id}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Detailed Description Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nội dung chi tiết thao tác
                </div>
                <div className="text-slate-800 text-xs font-medium leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-2xs text-slate-400 font-medium">Thời gian thực hiện</div>
                  <div className="font-mono text-slate-800 font-bold mt-0.5">{selectedLog.createdAt}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-2xs text-slate-400 font-medium">Người thực hiện (User)</div>
                  <div className="text-slate-800 font-bold mt-0.5 flex items-center gap-1.5">
                    <span>{selectedLog.username}</span>
                    <span className="text-2xs px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-semibold">
                      {selectedLog.userRole}
                    </span>
                  </div>
                  {selectedLog.employeeName && (
                    <div className="text-2xs text-slate-500 mt-0.5">{selectedLog.employeeName}</div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-2xs text-slate-400 font-medium">Phân loại & Mục tiêu</div>
                  <div className="text-slate-800 font-semibold mt-0.5">
                    <span className="uppercase text-blue-600 font-bold">{selectedLog.targetType}</span>
                    {selectedLog.targetId && (
                      <span className="text-slate-500 font-normal"> (ID: {selectedLog.targetId})</span>
                    )}
                  </div>
                  {selectedLog.targetName && (
                    <div className="text-2xs text-slate-600 font-medium mt-0.5">{selectedLog.targetName}</div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="text-2xs text-slate-400 font-medium">Địa chỉ IP / Thiết bị</div>
                  <div className="font-mono text-slate-800 font-semibold mt-0.5">
                    {selectedLog.ipAddress || '192.168.1.1 (Nội bộ)'}
                  </div>
                  <div className="text-2xs text-emerald-600 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác thực phiên
                  </div>
                </div>
              </div>

              {/* JSON Metadata Payload if present */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Dữ liệu tham số chi tiết (Metadata Payload)
                  </div>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-2xs font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
