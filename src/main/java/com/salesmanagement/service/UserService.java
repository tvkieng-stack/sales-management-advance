package com.salesmanagement.service;

import com.salesmanagement.model.User;
import com.salesmanagement.model.enums.Role;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.UserRepository;
import com.salesmanagement.util.PasswordUtil;

import java.sql.SQLException;
import java.util.List;

public class UserService {

    private final UserRepository userRepository = new UserRepository();

    // Map tên Role sang role_id đã seed sẵn trong schema.sql (mục 3 đặc tả: 1=ADMIN, 2=MANAGER, 3=EMPLOYEE)
    private static final int ROLE_ID_ADMIN = 1;
    private static final int ROLE_ID_MANAGER = 2;
    private static final int ROLE_ID_EMPLOYEE = 3;

    public List<User> getAll() throws SQLException {
        return userRepository.findAll();
    }

    public void createAccount(String username, String password, Role role, Integer employeeId) throws SQLException {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Tên đăng nhập không được để trống.");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự.");
        }
        if (userRepository.existsByUsername(username.trim())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại.");
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setPasswordHash(PasswordUtil.hash(password));
        user.setRoleId(mapRoleToId(role));
        user.setEmployeeId(employeeId);
        user.setStatus(Status.ACTIVE);

        userRepository.save(user);
    }

    public void toggleStatus(User user) throws SQLException {
        Status newStatus = user.getStatus() == Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE;
        userRepository.updateStatus(user.getId(), newStatus);
    }

    private int mapRoleToId(Role role) {
        return switch (role) {
            case ADMIN -> ROLE_ID_ADMIN;
            case MANAGER -> ROLE_ID_MANAGER;
            case EMPLOYEE -> ROLE_ID_EMPLOYEE;
        };
    }
}