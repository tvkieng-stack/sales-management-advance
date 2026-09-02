package com.salesmanagement.repository;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.Promotion;
import com.salesmanagement.model.enums.DiscountType;
import com.salesmanagement.model.enums.Status;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PromotionRepository {

    public Promotion save(Promotion p) throws SQLException {
        String sql = "INSERT INTO promotions (name, description, discount_type, discount_value, start_date, end_date, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, p.getName());
            ps.setString(2, p.getDescription());
            ps.setString(3, p.getDiscountType().name());
            ps.setDouble(4, p.getDiscountValue());
            ps.setString(5, p.getStartDate().toString());
            ps.setString(6, p.getEndDate().toString());
            ps.setString(7, p.getStatus().name());
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) p.setId(keys.getInt(1));
            }
        }
        return p;
    }

    public void update(Promotion p) throws SQLException {
        String sql = "UPDATE promotions SET name=?, description=?, discount_type=?, discount_value=?, " +
                "start_date=?, end_date=?, status=? WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, p.getName());
            ps.setString(2, p.getDescription());
            ps.setString(3, p.getDiscountType().name());
            ps.setDouble(4, p.getDiscountValue());
            ps.setString(5, p.getStartDate().toString());
            ps.setString(6, p.getEndDate().toString());
            ps.setString(7, p.getStatus().name());
            ps.setInt(8, p.getId());
            ps.executeUpdate();
        }
    }

    public void deactivate(int id) throws SQLException {
        String sql = "UPDATE promotions SET status = 'INACTIVE' WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        }
    }

    public List<Promotion> findAll() throws SQLException {
        String sql = "SELECT * FROM promotions ORDER BY start_date DESC";
        List<Promotion> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        }
        return result;
    }

    // Dùng cho POS: chỉ lấy khuyến mãi đang trong hiệu lực (ACTIVE + trong khoảng ngày hôm nay)
    public List<Promotion> findCurrentlyValid() throws SQLException {
        String sql = "SELECT * FROM promotions WHERE status = 'ACTIVE' " +
                "AND date('now') BETWEEN date(start_date) AND date(end_date)";
        List<Promotion> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) result.add(mapRow(rs));
        }
        return result;
    }

    private Promotion mapRow(ResultSet rs) throws SQLException {
        Promotion p = new Promotion();
        p.setId(rs.getInt("id"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setDiscountType(DiscountType.valueOf(rs.getString("discount_type")));
        p.setDiscountValue(rs.getDouble("discount_value"));
        p.setStartDate(LocalDate.parse(rs.getString("start_date")));
        p.setEndDate(LocalDate.parse(rs.getString("end_date")));
        p.setStatus(Status.valueOf(rs.getString("status")));
        return p;
    }
}