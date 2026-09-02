package com.salesmanagement.repository;

import com.salesmanagement.model.Invoice;
import com.salesmanagement.model.InvoiceDetail;
import com.salesmanagement.model.InvoiceLineView;
import com.salesmanagement.model.enums.InvoiceStatus;
import com.salesmanagement.model.enums.PaymentMethod;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class InvoiceRepository {

    public Invoice saveInvoice(Connection conn, Invoice invoice) throws SQLException {
        String sql = "INSERT INTO invoices (invoice_code, employee_id, customer_id, subtotal, discount, total, payment_method, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, invoice.getInvoiceCode());
            ps.setInt(2, invoice.getEmployeeId());
            if (invoice.getCustomerId() != null) {
                ps.setInt(3, invoice.getCustomerId());
            } else {
                ps.setNull(3, Types.INTEGER);
            }
            ps.setDouble(4, invoice.getSubtotal());
            ps.setDouble(5, invoice.getDiscount());
            ps.setDouble(6, invoice.getTotal());
            ps.setString(7, invoice.getPaymentMethod().name());
            ps.setString(8, invoice.getStatus().name());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    invoice.setId(keys.getInt(1));
                }
            }
        }
        return invoice;
    }

    public void saveInvoiceDetail(Connection conn, InvoiceDetail detail) throws SQLException {
        String sql = "INSERT INTO invoice_details (invoice_id, product_id, quantity, unit_price, discount, subtotal) " +
                "VALUES (?, ?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, detail.getInvoiceId());
            ps.setInt(2, detail.getProductId());
            ps.setInt(3, detail.getQuantity());
            ps.setDouble(4, detail.getUnitPrice());
            ps.setDouble(5, detail.getDiscount());
            ps.setDouble(6, detail.getSubtotal());
            ps.executeUpdate();
        }
    }

    public Invoice findById(int id) throws SQLException {
        String sql = "SELECT i.*, c.name AS customer_name, e.name AS employee_name FROM invoices i " +
                "LEFT JOIN customers c ON i.customer_id = c.id " +
                "LEFT JOIN employees e ON i.employee_id = e.id WHERE i.id = ?";
        try (Connection conn = com.salesmanagement.database.DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Invoice inv = new Invoice();
                    inv.setId(rs.getInt("id"));
                    inv.setInvoiceCode(rs.getString("invoice_code"));
                    inv.setEmployeeId(rs.getInt("employee_id"));
                    int custId = rs.getInt("customer_id");
                    inv.setCustomerId(rs.wasNull() ? null : custId);
                    inv.setSubtotal(rs.getDouble("subtotal"));
                    inv.setDiscount(rs.getDouble("discount"));
                    inv.setTotal(rs.getDouble("total"));
                    inv.setPaymentMethod(PaymentMethod.valueOf(rs.getString("payment_method")));
                    inv.setStatus(InvoiceStatus.valueOf(rs.getString("status")));
                    String createdAtStr = rs.getString("created_at");
                    if (createdAtStr != null) {
                        inv.setCreatedAt(LocalDateTime.parse(createdAtStr.replace(" ", "T")));
                    }
                    inv.setCustomerName(rs.getString("customer_name"));
                    inv.setEmployeeName(rs.getString("employee_name"));
                    return inv;
                }
            }
        }
        return null;
    }

    public List<InvoiceLineView> findDetailsByInvoiceId(int invoiceId) throws SQLException {
        String sql = "SELECT p.name AS product_name, d.quantity, d.unit_price, d.discount, d.subtotal " +
                "FROM invoice_details d JOIN products p ON d.product_id = p.id WHERE d.invoice_id = ? ORDER BY d.id";
        List<InvoiceLineView> result = new ArrayList<>();
        try (Connection conn = com.salesmanagement.database.DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, invoiceId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    result.add(new InvoiceLineView(
                            rs.getString("product_name"),
                            rs.getInt("quantity"),
                            rs.getDouble("unit_price"),
                            rs.getDouble("discount"),
                            rs.getDouble("subtotal")
                    ));
                }
            }
        }
        return result;
    }

    public String generateInvoiceCode() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        return "HD" + ts;
    }
}