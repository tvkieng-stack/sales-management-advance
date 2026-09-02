package com.salesmanagement.repository;

import com.salesmanagement.model.Purchase;
import com.salesmanagement.model.PurchaseDetail;
import com.salesmanagement.model.enums.PurchaseStatus;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class PurchaseRepository {

    public Purchase savePurchase(Connection conn, Purchase purchase) throws SQLException {
        String sql = "INSERT INTO purchases (purchase_code, supplier_id, employee_id, total_cost, status) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, purchase.getPurchaseCode());
            ps.setInt(2, purchase.getSupplierId());
            ps.setInt(3, purchase.getEmployeeId());
            ps.setDouble(4, purchase.getTotalCost());
            ps.setString(5, purchase.getStatus().name());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) purchase.setId(keys.getInt(1));
            }
        }
        return purchase;
    }

    public void savePurchaseDetail(Connection conn, PurchaseDetail detail) throws SQLException {
        String sql = "INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_cost, subtotal) " +
                "VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, detail.getPurchaseId());
            ps.setInt(2, detail.getProductId());
            ps.setInt(3, detail.getQuantity());
            ps.setDouble(4, detail.getUnitCost());
            ps.setDouble(5, detail.getSubtotal());
            ps.executeUpdate();
        }
    }

    public String generatePurchaseCode() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        return "PN" + ts;
    }

    // Dùng cho lịch sử nhập hàng (danh sách phiếu nhập)
    public java.util.List<Purchase> findAll() throws SQLException {
        String sql = "SELECT p.*, s.name AS supplier_name FROM purchases p " +
                "JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.created_at DESC";
        java.util.List<Purchase> result = new java.util.ArrayList<>();
        try (Connection conn = com.salesmanagement.database.DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Purchase p = new Purchase();
                p.setId(rs.getInt("id"));
                p.setPurchaseCode(rs.getString("purchase_code"));
                p.setSupplierId(rs.getInt("supplier_id"));
                p.setSupplierName(rs.getString("supplier_name"));
                p.setEmployeeId(rs.getInt("employee_id"));
                p.setTotalCost(rs.getDouble("total_cost"));
                p.setStatus(PurchaseStatus.valueOf(rs.getString("status")));
                result.add(p);
            }
        }
        return result;
    }
}