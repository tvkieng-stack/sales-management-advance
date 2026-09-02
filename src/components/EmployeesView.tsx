import React, { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Employee, Role, Status, User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  UserCog,
  Plus,
  Edit2,
  Lock,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { currentUser, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'ACCOUNTS' | 'CHANGE_PASSWORD'>('EMPLOYEES');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Employee Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    position: 'Nhân viên bán hàng',
    salary: 8000000,
    status: 'ACTIVE' as Status,
  });

  // Account Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    roleName: 'EMPLOYEE' as Role,
    employeeId: 0,
  });

  // Change Password Form
  const [pwdForm, setPwdForm] = useState({ oldPass: '', newPass: '', confirmPass: '' });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setEmployees(db.getEmployees());
    setUsers(db.getUsers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Employee CRUD
  const openAddEmpModal = () => {
    setEditingEmp(null);
    setEmpForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      position: 'Nhân viên bán hàng',
      salary: 8000000,
      status: 'ACTIVE',
    });
    setMessage(null);
    setIsEmpModalOpen(true);
  };

  const openEditEmpModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpForm({
      name: emp.name,
      phone: emp.phone,
      email: emp.email,
      address: emp.address,
      position: emp.position,
      salary: emp.salary,
      status: emp.status,
    });
    setMessage(null);
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên nhân viên.' });
      return;
    }

    try {
      if (editingEmp) {
        db.updateEmployee({
          ...editingEmp,
          name: empForm.name,
          phone: empForm.phone,
          email: empForm.email,
          address: empForm.address,
          position: empForm.position,
          salary: Number(empForm.salary),
          status: empForm.status,
        });
        setMessage({ type: 'success', text: 'Cập nhật nhân viên thành công!' });
      } else {
        db.createEmployee({
          name: empForm.name,
          phone: empForm.phone,
          email: empForm.email,
          address: empForm.address,
          position: empForm.position,
          salary: Number(empForm.salary),
          status: empForm.status,
        });
        setMessage({ type: 'success', text: 'Thêm nhân viên mới thành công!' });
      }
      loadData();
      setTimeout(() => setIsEmpModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi xử lý.' });
    }
  };

  const handleDeactivateEmployee = (id: number) => {
    if (window.confirm('Bạn có chắc muốn vô hiệu hóa nhân viên này?')) {
      db.deactivateEmployee(id);
      loadData();
    }
  };

  // User Account CRUD
  const openAddUserModal = () => {
    setUserForm({
      username: '',
      password: '',
      roleName: 'EMPLOYEE',
      employeeId: employees[0]?.id || 0,
    });
    setMessage(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' });
      return;
    }

    try {
      const emp = employees.find((e) => e.id === Number(userForm.employeeId));
      let roleId = 3;
      if (userForm.roleName === 'ADMIN') roleId = 1;
      else if (userForm.roleName === 'MANAGER') roleId = 2;

      db.createUser({
        username: userForm.username,
        passwordHash: userForm.password,
        roleId,
        roleName: userForm.roleName,
        employeeId: emp ? emp.id : null,
        employeeName: emp ? emp.name : undefined,
        status: 'ACTIVE',
      });

      setMessage({ type: 'success', text: 'Tạo tài khoản người dùng thành công!' });
      loadData();
      setTimeout(() => setIsUserModalOpen(false), 500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi tạo tài khoản.' });
    }
  };

  const handleToggleUserStatus = (userId: number) => {
    if (userId === currentUser?.id) {
      alert('Không thể tự khóa tài khoản của chính bạn!');
      return;
    }
    db.toggleUserStatus(userId);
    loadData();
  };

  const handleResetPassword = (u: User) => {
    const newPass = prompt(`Nhập mật khẩu mới cho tài khoản "${u.username}":`, '123456');
    if (newPass && newPass.trim().length >= 4) {
      db.updateUserPassword(u.id, newPass.trim());
      alert(`Đã đặt lại mật khẩu cho "${u.username}" thành công.`);
      loadData();
    }
  };

  // Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changePassword(pwdForm.oldPass, pwdForm.newPass, pwdForm.confirmPass);
    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      setPwdForm({ oldPass: '', newPass: '', confirmPass: '' });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>Quản lý Nhân sự & Phân quyền Tài khoản</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hồ sơ nhân viên, cấp phát tài khoản đăng nhập và phân quyền hệ thống (RBAC).
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'EMPLOYEES'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hồ sơ Nhân viên ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'ACCOUNTS'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tài khoản Đăng nhập ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('CHANGE_PASSWORD')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'CHANGE_PASSWORD'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi mật khẩu cá nhân
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: EMPLOYEES LIST */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAddEmpModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Nhân viên Mới</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-16">ID</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  <th className="px-4 py-3">Chức vụ</th>
                  <th className="px-4 py-3">Điện thoại</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Lương cơ bản</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 font-mono">#{e.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{e.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                        {e.position}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{e.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{e.email || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(e.salary)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          e.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {e.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditEmpModal(e)}
                          className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivateEmployee(e.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS & RBAC */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openAddUserModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp Tài Khoản Mới</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-16">ID</th>
                  <th className="px-4 py-3">Tên đăng nhập</th>
                  <th className="px-4 py-3">Nhân viên liên kết</th>
                  <th className="px-4 py-3 text-center">Vai trò / Phân quyền</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Quản lý mật khẩu & Khóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-400 font-mono">#{u.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">{u.username}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{u.employeeName || 'Không liên kết'}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          u.roleName === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : u.roleName === 'MANAGER'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {u.roleName === 'ADMIN'
                          ? 'Quản trị viên (ADMIN)'
                          : u.roleName === 'MANAGER'
                          ? 'Quản lý (MANAGER)'
                          : 'Thu ngân (EMPLOYEE)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset mật khẩu</span>
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          <span>{u.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHANGE PASSWORD */}
      {activeTab === 'CHANGE_PASSWORD' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 max-w-md mx-auto space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Đổi Mật Khẩu Cá Nhân</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang đăng nhập với tài khoản: <b>{currentUser?.username}</b>
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại *</label>
              <input
                type="password"
                required
                value={pwdForm.oldPass}
                onChange={(e) => setPwdForm({ ...pwdForm, oldPass: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới *</label>
              <input
                type="password"
                required
                value={pwdForm.newPass}
                onChange={(e) => setPwdForm({ ...pwdForm, newPass: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                required
                value={pwdForm.confirmPass}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPass: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              Cập nhật Mật khẩu
            </button>
          </form>
        </div>
      )}

      {/* Employee Modal */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmp ? 'Sửa Nhân viên' : 'Thêm Nhân viên Mới'}
              </h3>
              <button
                onClick={() => setIsEmpModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  placeholder="Ví dụ: Lê Hoàng Thu Ngân"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức vụ</label>
                  <input
                    type="text"
                    value={empForm.position}
                    onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lương cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={empForm.salary}
                    onChange={(e) => setEmpForm({ ...empForm, salary: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={empForm.address}
                  onChange={(e) => setEmpForm({ ...empForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Lưu Nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Account Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cấp Tài Khoản Đăng Nhập Mới</h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Ví dụ: nhanvien1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  required
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Liên kết Nhân viên</label>
                <select
                  value={userForm.employeeId}
                  onChange={(e) =>
                    setUserForm({ ...userForm, employeeId: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Không liên kết</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vai trò / Quyền hạn (RBAC)
                </label>
                <select
                  value={userForm.roleName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, roleName: e.target.value as Role })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="EMPLOYEE">Nhân viên thu ngân (EMPLOYEE)</option>
                  <option value="MANAGER">Quản lý cửa hàng (MANAGER)</option>
                  <option value="ADMIN">Quản trị viên hệ thống (ADMIN)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
