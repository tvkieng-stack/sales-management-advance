package com.salesmanagement.service;

import com.salesmanagement.model.User;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.UserRepository;
import com.salesmanagement.util.PasswordUtil;

import java.sql.SQLException;

public class AuthService {

    private final UserRepository userRepository = new UserRepository();

    // Trả về kết quả để Controller hiển thị thông báo lỗi phù hợp (UC01: sai thông tin / tài khoản bị khóa)
    public LoginResult login(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return LoginResult.failure("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
        }

        try {
            User user = userRepository.findByUsername(username.trim());

            if (user == null) {
                return LoginResult.failure("Sai tên đăng nhập hoặc mật khẩu.");
            }

            if (user.getStatus() == Status.INACTIVE) {
                return LoginResult.failure("Tài khoản đã bị khóa.");
            }

            if (!PasswordUtil.verify(password, user.getPasswordHash())) {
                return LoginResult.failure("Sai tên đăng nhập hoặc mật khẩu.");
            }

            Session.login(user);
            return LoginResult.success(user);

        } catch (SQLException e) {
            e.printStackTrace();
            return LoginResult.failure("Lỗi hệ thống, vui lòng thử lại.");
        }
    }

    public void logout() {
        Session.logout();
    }

    // UC01 (F01 mục 4): đổi mật khẩu - phải nhập đúng mật khẩu cũ mới được đổi
    public LoginResult changePassword(String oldPassword, String newPassword, String confirmPassword) {
        User currentUser = Session.getCurrentUser();
        if (currentUser == null) {
            return LoginResult.failure("Phiên đăng nhập đã hết hạn.");
        }

        if (oldPassword == null || oldPassword.isBlank()) {
            return LoginResult.failure("Vui lòng nhập mật khẩu hiện tại.");
        }
        if (!PasswordUtil.verify(oldPassword, currentUser.getPasswordHash())) {
            return LoginResult.failure("Mật khẩu hiện tại không đúng.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            return LoginResult.failure("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }
        if (!newPassword.equals(confirmPassword)) {
            return LoginResult.failure("Xác nhận mật khẩu không khớp.");
        }
        if (newPassword.equals(oldPassword)) {
            return LoginResult.failure("Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        try {
            String newHash = PasswordUtil.hash(newPassword);
            userRepository.updatePassword(currentUser.getId(), newHash);
            currentUser.setPasswordHash(newHash); // cập nhật luôn trong Session để không phải login lại
            return LoginResult.success(currentUser);
        } catch (SQLException e) {
            e.printStackTrace();
            return LoginResult.failure("Lỗi hệ thống, vui lòng thử lại.");
        }
    }

    // Inner class kết quả login - tránh dùng exception cho luồng nghiệp vụ bình thường
    public static class LoginResult {
        private final boolean success;
        private final String message;
        private final User user;

        private LoginResult(boolean success, String message, User user) {
            this.success = success;
            this.message = message;
            this.user = user;
        }

        public static LoginResult success(User user) {
            return new LoginResult(true, "Đăng nhập thành công.", user);
        }

        public static LoginResult failure(String message) {
            return new LoginResult(false, message, null);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public User getUser() { return user; }
    }
}