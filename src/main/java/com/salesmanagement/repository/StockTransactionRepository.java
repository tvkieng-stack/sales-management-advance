package com.salesmanagement.repository;

import com.salesmanagement.model.StockTransaction;

import java.sql.*;

public class StockTransactionRepository {

    public void save(Connection conn, StockTransaction tx) throws SQLException {
        String sql = "INSERT INTO stock_transactions (product_id, employee_id, type, quantity, reference_type, reference_id, note) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, tx.getProductId());
            if (tx.getEmployeeId() != null) {
                ps.setInt(2, tx.getEmployeeId());
            } else {
                ps.setNull(2, Types.INTEGER);
            }
            ps.setString(3, tx.getType().name());
            ps.setInt(4, tx.getQuantity());
            ps.setString(5, tx.getReferenceType());
            if (tx.getReferenceId() != null) {
                ps.setInt(6, tx.getReferenceId());
            } else {
                ps.setNull(6, Types.INTEGER);
            }
            ps.setString(7, tx.getNote());
            ps.executeUpdate();
        }
    }
}