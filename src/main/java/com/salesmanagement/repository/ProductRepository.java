package com.salesmanagement.repository;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.Product;
import com.salesmanagement.model.enums.Status;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ProductRepository {

    public Product save(Product p) throws SQLException {
        String sql = "INSERT INTO products (barcode, name, category_id, unit, cost_price, " +
                "selling_price, stock_quantity, minimum_stock, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, p.getBarcode());
            ps.setString(2, p.getName());
            if (p.getCategoryId() != null) {
                ps.setInt(3, p.getCategoryId());
            } else {
                ps.setNull(3, Types.INTEGER);
            }
            ps.setString(4, p.getUnit());
            ps.setDouble(5, p.getCostPrice());
            ps.setDouble(6, p.getSellingPrice());
            ps.setInt(7, p.getStockQuantity());
            ps.setInt(8, p.getMinimumStock());
            ps.setString(9, p.getStatus().name());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    p.setId(keys.getInt(1));
                }
            }
        }
        return p;
    }

    public void update(Product p) throws SQLException {
        String sql = "UPDATE products SET barcode=?, name=?, category_id=?, unit=?, cost_price=?, " +
                "selling_price=?, stock_quantity=?, minimum_stock=?, status=?, updated_at=datetime('now') " +
                "WHERE id=?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, p.getBarcode());
            ps.setString(2, p.getName());
            if (p.getCategoryId() != null) {
                ps.setInt(3, p.getCategoryId());
            } else {
                ps.setNull(3, Types.INTEGER);
            }
            ps.setString(4, p.getUnit());
            ps.setDouble(5, p.getCostPrice());
            ps.setDouble(6, p.getSellingPrice());
            ps.setInt(7, p.getStockQuantity());
            ps.setInt(8, p.getMinimumStock());
            ps.setString(9, p.getStatus().name());
            ps.setInt(10, p.getId());
            ps.executeUpdate();
        }
    }

    // Không xóa cứng - chỉ đổi status (theo ràng buộc mục 9 của đặc tả)
    public void deactivate(int productId) throws SQLException {
        String sql = "UPDATE products SET status = 'INACTIVE' WHERE id = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, productId);
            ps.executeUpdate();
        }
    }

    public List<Product> findAll() throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name";
        return query(sql);
    }

    // Phân trang (mục II.3 báo cáo): chỉ tải 1 trang dữ liệu mỗi lần, không load toàn bộ bảng vào RAM
    public List<Product> findPage(int pageIndex, int pageSize) throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name LIMIT ? OFFSET ?";
        List<Product> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, pageSize);
            ps.setInt(2, pageIndex * pageSize);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        }
        return result;
    }

    // Đếm tổng số bản ghi - dùng để tính tổng số trang, hiển thị "Trang X/Y"
    public int countAll() throws SQLException {
        String sql = "SELECT COUNT(*) FROM products";
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    public List<Product> findActivePage(int pageIndex, int pageSize) throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id " +
                "WHERE p.status = 'ACTIVE' ORDER BY p.name LIMIT ? OFFSET ?";
        List<Product> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, pageSize);
            ps.setInt(2, pageIndex * pageSize);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapRow(rs));
            }
        }
        return result;
    }

    public int countActive() throws SQLException {
        String sql = "SELECT COUNT(*) FROM products WHERE status = 'ACTIVE'";
        try (Connection conn = DatabaseConnection.getConnection();
            PreparedStatement ps = conn.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getInt(1);
        }
    }

    public List<Product> findActive() throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id " +
                "WHERE p.status = 'ACTIVE' ORDER BY p.name";
        return query(sql);
    }

    // Dùng cho POS: tìm theo tên hoặc barcode
    public List<Product> search(String keyword) throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id " +
                "WHERE p.status = 'ACTIVE' AND (p.name LIKE ? OR p.barcode LIKE ?) ORDER BY p.name";
        List<Product> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            String like = "%" + keyword + "%";
            ps.setString(1, like);
            ps.setString(2, like);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    result.add(mapRow(rs));
                }
            }
        }
        return result;
    }

    public Product findByBarcode(String barcode) throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?";
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, barcode);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    public List<Product> findLowStock() throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id " +
                "WHERE p.stock_quantity <= p.minimum_stock AND p.status = 'ACTIVE'";
        return query(sql);
    }

    private List<Product> query(String sql) throws SQLException {
        List<Product> result = new ArrayList<>();
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                result.add(mapRow(rs));
            }
        }
        return result;
    }

    // Dùng trong transaction checkout - đọc tồn kho mới nhất ngay tại thời điểm chốt đơn
    public Product findByIdInTransaction(Connection conn, int id) throws SQLException {
        String sql = "SELECT p.*, c.name AS category_name FROM products p " +
                "LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    // Dùng trong transaction checkout - cập nhật tồn kho cùng connection với invoice/stock_transaction
    public void updateStockQuantityInTransaction(Connection conn, int productId, int newQuantity) throws SQLException {
        String sql = "UPDATE products SET stock_quantity = ?, updated_at = datetime('now') WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, newQuantity);
            ps.setInt(2, productId);
            ps.executeUpdate();
        }
    }
    
    // Dùng trong transaction nhập hàng - tăng tồn kho (IMPORT)
    public void increaseStockInTransaction(Connection conn, int productId, int addQuantity) throws SQLException {
        String sql = "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, addQuantity);
            ps.setInt(2, productId);
            ps.executeUpdate();
        }
    }

    private Product mapRow(ResultSet rs) throws SQLException {
        Product p = new Product();
        p.setId(rs.getInt("id"));
        p.setBarcode(rs.getString("barcode"));
        p.setName(rs.getString("name"));
        int catId = rs.getInt("category_id");
        p.setCategoryId(rs.wasNull() ? null : catId);
        p.setCategoryName(rs.getString("category_name"));
        p.setUnit(rs.getString("unit"));
        p.setCostPrice(rs.getDouble("cost_price"));
        p.setSellingPrice(rs.getDouble("selling_price"));
        p.setStockQuantity(rs.getInt("stock_quantity"));
        p.setMinimumStock(rs.getInt("minimum_stock"));
        p.setStatus(Status.valueOf(rs.getString("status")));
        return p;
    }
}