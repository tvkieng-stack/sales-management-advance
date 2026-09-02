import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { db } from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  changePassword: (oldPass: string, newPass: string, confirmPass: string) => { success: boolean; message: string };
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'sales_management_active_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed: User = JSON.parse(saved);
        const freshUser = db.getUserByUsername(parsed.username);
        if (freshUser && freshUser.status === 'ACTIVE') {
          return freshUser;
        }
      }
    } catch (e) {
      console.warn('Error reading saved session', e);
    }
    // Default to admin for convenient immediate usage
    const admin = db.getUserByUsername('admin');
    return admin || null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser]);

  const login = (username: string, password: string): { success: boolean; message: string } => {
    if (!username.trim()) return { success: false, message: 'Vui lòng nhập tên đăng nhập.' };
    if (!password) return { success: false, message: 'Vui lòng nhập mật khẩu.' };

    const user = db.getUserByUsername(username);
    if (!user) {
      return { success: false, message: 'Tên đăng nhập không tồn tại.' };
    }

    if (user.status !== 'ACTIVE') {
      return { success: false, message: 'Tài khoản đã bị vô hiệu hóa / khóa.' };
    }

    if (user.passwordHash && user.passwordHash !== password) {
      return { success: false, message: 'Mật khẩu không chính xác.' };
    }

    setCurrentUser(user);

    db.logActivity({
      userId: user.id,
      username: user.username,
      userRole: user.roleName,
      employeeName: user.employeeName || user.username,
      action: 'USER_LOGIN',
      actionTitle: 'Đăng nhập hệ thống',
      targetType: 'USER',
      targetId: user.id,
      targetName: user.username,
      details: `Người dùng "${user.username}" (${user.roleName}) đã đăng nhập vào hệ thống.`,
      metadata: { role: user.roleName, employeeId: user.employeeId },
      severity: 'INFO',
    });

    return { success: true, message: 'Đăng nhập thành công.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const changePassword = (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập.' };
    if (!oldPass) return { success: false, message: 'Vui lòng nhập mật khẩu cũ.' };
    if (currentUser.passwordHash && currentUser.passwordHash !== oldPass) {
      return { success: false, message: 'Mật khẩu cũ không chính xác.' };
    }
    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' };
    }
    if (newPass !== confirmPass) {
      return { success: false, message: 'Mật khẩu xác nhận không khớp.' };
    }

    db.updateUserPassword(currentUser.id, newPass);
    const updated = db.getUserByUsername(currentUser.username);
    if (updated) setCurrentUser(updated);

    db.logActivity({
      userId: currentUser.id,
      username: currentUser.username,
      userRole: currentUser.roleName,
      employeeName: currentUser.employeeName || currentUser.username,
      action: 'USER_PASSWORD_CHANGE',
      actionTitle: 'Đổi mật khẩu tài khoản',
      targetType: 'USER',
      targetId: currentUser.id,
      targetName: currentUser.username,
      details: `Người dùng "${currentUser.username}" đã cập nhật mật khẩu tài khoản.`,
      severity: 'WARNING',
    });

    return { success: true, message: 'Đổi mật khẩu thành công.' };
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.roleName);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, changePassword, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
