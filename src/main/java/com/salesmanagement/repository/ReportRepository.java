package com.salesmanagement.repository;

import com.salesmanagement.database.DatabaseConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ReportRepository {

    // Doanh thu = tổng total của các hóa đơn PAID/COMPLETED trong khoảng thời gian
    public double getTotalRevenue(String fromDate, String toDate) throws SQLException {
        String sql = "SELECT COALESCE(SUM(total), 0) FROM invoices " +
                "WHERE status IN ('PAID', 'COMPLETED') AND date(created_at) BETWEEN date(?) AND date(?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getDouble(1);
            }
        }
    }

    // Lợi nhuận = SUM(invoice_details.subtotal) - SUM(quantity * cost_price tại thời điểm bán)
    // Theo mục 18: doanh thu thực nhận (đã trừ discount dòng) - giá vốn hàng bán
    public double getTotalProfit(String fromDate, String toDate) throws SQLException {
        String sql = "SELECT COALESCE(SUM(id.subtotal - (id.quantity * p.cost_price)), 0) " +
                "FROM invoice_details id " +
                "JOIN invoices i ON id.invoice_id = i.id " +
                "JOIN products p ON id.product_id = p.id " +
                "WHERE i.status IN ('PAID', 'COMPLETED') AND date(i.created_at) BETWEEN date(?) AND date(?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getDouble(1);
            }
        }
    }

    public int getOrderCount(String fromDate, String toDate) throws SQLException {
        String sql = "SELECT COUNT(*) FROM invoices " +
                "WHERE status IN ('PAID', 'COMPLETED') AND date(created_at) BETWEEN date(?) AND date(?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getInt(1);
            }
        }
    }

    // Sản phẩm bán chạy - top theo số lượng bán trong khoảng thời gian
    public List<Object[]> getBestSellingProducts(String fromDate, String toDate, int limit) throws SQLException {
        String sql = "SELECT p.name, SUM(id.quantity) AS total_qty, SUM(id.subtotal) AS total_revenue " +
                "FROM invoice_details id " +
                "JOIN invoices i ON id.invoice_id = i.id " +
                "JOIN products p ON id.product_id = p.id " +
                "WHERE i.status IN ('PAID', 'COMPLETED') AND date(i.created_at) BETWEEN date(?) AND date(?) " +
                "GROUP BY p.id, p.name ORDER BY total_qty DESC LIMIT ?";
        List<Object[]> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            ps.setInt(3, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    result.add(new Object[]{
                            rs.getString("name"),
                            rs.getInt("total_qty"),
                            rs.getDouble("total_revenue")
                    });
                }
            }
        }
        return result;
    }

    // Doanh thu theo từng ngày trong khoảng - dùng vẽ biểu đồ
    public List<Object[]> getRevenueByDay(String fromDate, String toDate) throws SQLException {
        String sql = "SELECT date(created_at) AS day, SUM(total) AS revenue " +
                "FROM invoices WHERE status IN ('PAID', 'COMPLETED') " +
                "AND date(created_at) BETWEEN date(?) AND date(?) " +
                "GROUP BY date(created_at) ORDER BY day";
        List<Object[]> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, fromDate);
            ps.setString(2, toDate);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    result.add(new Object[]{rs.getString("day"), rs.getDouble("revenue")});
                }
            }
        }
        return result;
    }
}