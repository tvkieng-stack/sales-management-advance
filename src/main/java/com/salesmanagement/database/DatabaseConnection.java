package com.salesmanagement.database;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Từ khi app xử lý bất đồng bộ (AsyncUtil), nhiều luồng nền có thể gọi getConnection() CÙNG LÚC.
 * Dùng chung 1 Connection tĩnh (thiết kế cũ) gây lỗi "database has been closed" / "stmt pointer is closed"
 * khi luồng này đóng connection ngay lúc luồng khác đang dùng dở.
 *
 * Giải pháp: mỗi lần gọi trả về 1 Connection MỚI, độc lập - an toàn tuyệt đối giữa các luồng
 * vì không còn state dùng chung. SQLite JDBC tạo connection rất nhẹ, không ảnh hưởng hiệu năng.
 */
public class DatabaseConnection {

    private static String dbUrl = "jdbc:sqlite:sales_management.db";

    private DatabaseConnection() {
    }

    // Chỉ dùng cho unit test - trỏ sang database khác (file tạm) trước khi gọi getConnection()
    public static void setDbUrl(String url) {
        dbUrl = url;
    }

    public static Connection getConnection() throws SQLException {
        Connection conn = DriverManager.getConnection(dbUrl);
        try (Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA foreign_keys = ON;");
        }
        return conn;
    }

    // Không còn connection dùng chung để đóng - giữ method rỗng để BackupService gọi không lỗi.
    public static void closeConnection() {
        // no-op: mỗi Connection giờ được tạo và đóng riêng lẻ trong từng try-with-resources
    }
}