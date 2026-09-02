package com.salesmanagement.repository;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.User;
import com.salesmanagement.model.enums.Status;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UserRepository {

    public User save(User u) throws SQLException {
        String sql = "INSERT INTO users (username, password_hash, role_id, employee_id, status) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, u.getUsername());
            ps.setString(2, u.getPasswordHash());
            ps.setInt(3, u.getRoleId());
            if (u.getEmployeeId() != null) {
                ps.setInt(4, u.getEmployeeId());
            } else {
                ps.setNull(4, Types.INTEGER);
            }
            ps.setString(5, u.getStatus().name());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    u.setId(keys.getInt(1));
                }
            }
        }
        return u;
    }

    // Quan trọng nhất cho UC01 - Login: tìm user theo username, kèm tên role
    public User findByUsername(String username) throws SQLException {
        String sql = "SELECT u.*, r.name AS role_name FROM users u " +
                "JOIN roles r ON u.role_id = r.id WHERE u.username = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public boolean existsByUsername(String username) throws SQLException {
        return findByUsername(username) != null;
    }

    public List<User> findAll() throws SQLException {
        String sql = "SELECT u.*, r.name AS role_name, e.name AS employee_name FROM users u " +
                "JOIN roles r ON u.role_id = r.id " +
                "LEFT JOIN employees e ON u.employee_id = e.id ORDER BY u.username";
        List<User> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                User u = mapRow(rs);
                u.setEmployeeName(rs.getString("employee_name"));
                result.add(u);
            }
        }
        return result;
    }

    public void updateStatus(int userId, Status status) throws SQLException {
        String sql = "UPDATE users SET status = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status.name());
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    public void updatePassword(int userId, String newPasswordHash) throws SQLException {
        String sql = "UPDATE users SET password_hash = ? WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, newPasswordHash);
            ps.setInt(2, userId);
            ps.executeUpdate();
        }
    }

    private User mapRow(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getInt("id"));
        u.setUsername(rs.getString("username"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRoleId(rs.getInt("role_id"));
        u.setRoleName(rs.getString("role_name"));
        int empId = rs.getInt("employee_id");
        u.setEmployeeId(rs.wasNull() ? null : empId);
        u.setStatus(Status.valueOf(rs.getString("status")));
        return u;
    }
}