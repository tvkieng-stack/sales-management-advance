package com.salesmanagement.repository;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.Employee;
import com.salesmanagement.model.enums.Status;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class EmployeeRepository {

    public Employee save(Employee e) throws SQLException {
        String sql = "INSERT INTO employees (name, phone, email, address, position, salary, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, e.getName());
            ps.setString(2, e.getPhone());
            ps.setString(3, e.getEmail());
            ps.setString(4, e.getAddress());
            ps.setString(5, e.getPosition());
            ps.setDouble(6, e.getSalary());
            ps.setString(7, e.getStatus().name());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    e.setId(keys.getInt(1));
                }
            }
        }
        return e;
    }

    public void update(Employee e) throws SQLException {
        String sql = "UPDATE employees SET name=?, phone=?, email=?, address=?, position=?, salary=?, status=? " +
                "WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, e.getName());
            ps.setString(2, e.getPhone());
            ps.setString(3, e.getEmail());
            ps.setString(4, e.getAddress());
            ps.setString(5, e.getPosition());
            ps.setDouble(6, e.getSalary());
            ps.setString(7, e.getStatus().name());
            ps.setInt(8, e.getId());
            ps.executeUpdate();
        }
    }

    public Employee findById(int id) throws SQLException {
        String sql = "SELECT * FROM employees WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public List<Employee> findAll() throws SQLException {
        String sql = "SELECT * FROM employees ORDER BY name";
        List<Employee> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                result.add(mapRow(rs));
            }
        }
        return result;
    }

    private Employee mapRow(ResultSet rs) throws SQLException {
        Employee e = new Employee();
        e.setId(rs.getInt("id"));
        e.setName(rs.getString("name"));
        e.setPhone(rs.getString("phone"));
        e.setEmail(rs.getString("email"));
        e.setAddress(rs.getString("address"));
        e.setPosition(rs.getString("position"));
        e.setSalary(rs.getDouble("salary"));
        e.setStatus(Status.valueOf(rs.getString("status")));
        String createdAtStr = rs.getString("created_at");
        if (createdAtStr != null) {
            e.setCreatedAt(LocalDateTime.parse(createdAtStr.replace(" ", "T")));
        }
        return e;
    }
}