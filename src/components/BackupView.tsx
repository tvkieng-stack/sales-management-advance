import React, { useState } from 'react';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldCheck,
} from 'lucide-react';

export const BackupView: React.FC = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportBackup = () => {
    try {
      const state = db.getState();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(state, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `sales_management_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'admin',
        userRole: currentUser?.roleName || 'ADMIN',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản trị viên',
        action: 'BACKUP_EXPORT',
        actionTitle: 'Sao lưu cơ sở dữ liệu (JSON)',
        targetType: 'SYSTEM',
        targetId: `BACKUP-${dateStr}`,
        targetName: `sales_management_backup_${dateStr}.json`,
        details: `Tải xuống bản sao lưu toàn bộ cơ sở dữ liệu hệ thống (${state.products.length} sản phẩm, ${state.invoices.length} đơn hàng, ${state.customers.length} khách hàng).`,
        metadata: {
          productsCount: state.products.length,
          invoicesCount: state.invoices.length,
          customersCount: state.customers.length,
        },
        severity: 'INFO',
      });

      setMessage({ type: 'success', text: 'Xuất file sao lưu dữ liệu (.json) thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xuất sao lưu.' });
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          db.restoreFromBackup(parsed);

          db.logActivity({
            userId: currentUser?.id,
            username: currentUser?.username || 'admin',
            userRole: currentUser?.roleName || 'ADMIN',
            employeeName: currentUser?.employeeName || currentUser?.username || 'Quản trị viên',
            action: 'BACKUP_RESTORE',
            actionTitle: 'Khôi phục dữ liệu từ bản sao lưu',
            targetType: 'SYSTEM',
            targetId: 'RESTORE-FILE',
            targetName: fileName,
            details: `Phục hồi thành công toàn bộ cơ sở dữ liệu từ tệp tin "${fileName}".`,
            metadata: { fileName },
            severity: 'CRITICAL',
          });

          setMessage({
            type: 'success',
            text: 'Khôi phục toàn bộ cơ sở dữ liệu từ file backup thành công! Đang làm mới...',
          });
          setTimeout(() => window.location.reload(), 1200);
        } catch (err: any) {
          setMessage({ type: 'error', text: 'File sao lưu không hợp lệ hoặc bị lỗi cú pháp JSON.' });
        }
      };
    }
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'CẢNH BÁO: Thao tác này sẽ xóa toàn bộ dữ liệu hiện tại và nạp lại dữ liệu mẫu ban đầu. Bạn có chắc chắn muốn tiếp tục?'
      )
    ) {
      db.resetToDefault();
      db.logActivity({
        userId: currentUser?.id,
        username: currentUser?.username || 'admin',
        userRole: currentUser?.roleName || 'ADMIN',
        employeeName: currentUser?.employeeName || currentUser?.username || 'Quản trị viên',
        action: 'SYSTEM_RESET',
        actionTitle: 'Khôi phục cài đặt gốc',
        targetType: 'SYSTEM',
        targetId: 'RESET-FACTORY',
        targetName: 'Hệ thống Bán hàng',
        details: 'Khởi tạo lại toàn bộ cơ sở dữ liệu mẫu mặc định ban đầu.',
        severity: 'CRITICAL',
      });

      setMessage({
        type: 'success',
        text: 'Đã thiết lập lại dữ liệu mẫu thành công! Đang tải lại...',
      });
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span>Sao lưu, Khôi phục & Quản trị Dữ liệu</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tạo bản sao lưu toàn bộ hệ thống (Sản phẩm, Đơn hàng, Kho, Khách hàng) và phục hồi an toàn bất kỳ lúc nào.
        </p>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4.5 h-4.5 text-red-600 flex-shrink-0" />
          )}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Backup Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Xuất Bản Sao Lưu (Backup JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải về máy tính một tệp JSON chứa toàn bộ dữ liệu danh mục, sản phẩm, hóa đơn bán hàng, phiếu nhập kho và thông tin khách hàng.
            </p>
          </div>

          <button
            id="btn-export-backup"
            onClick={handleExportBackup}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Download className="w-4 h-4" />
            <span>Tải Xuống File Backup (.json)</span>
          </button>
        </div>

        {/* Import Restore Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Khôi Phục Dữ Liệu Từ File (Restore)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nạp dữ liệu từ tệp sao lưu JSON đã tải trước đó. Dữ liệu sẽ được khôi phục nguyên trạng ngay lập tức.
            </p>
          </div>

          <label
            id="label-import-backup"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Upload className="w-4 h-4" />
            <span>Chọn Tệp JSON Để Phục Hồi</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Reset to Sample Data */}
      <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
          <RotateCcw className="w-4.5 h-4.5 text-amber-600" />
          <span>Khôi phục Dữ liệu Mẫu Ban Đầu (Demo Data Reset)</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Nạp lại đầy đủ danh sách hàng mẫu chuẩn (nước giải khát, thực phẩm, bánh kẹo), các nhà cung cấp, khách hàng thân thiết và lịch sử bán hàng mẫu để kiểm thử tính năng.
        </p>
        <div className="pt-2">
          <button
            id="btn-reset-demo"
            onClick={handleResetToDefault}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>Thiết lập lại Dữ liệu Mẫu (Reset Demo)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
