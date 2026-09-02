package com.salesmanagement.database;

import com.salesmanagement.util.PasswordUtil;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseInitializer {

    private static final String SCHEMA_PATH = "/com/salesmanagement/database/schema.sql";

    public static void initialize() {
        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement()) {

            String schemaSql = readSchemaFile();
            String[] statements = schemaSql.split(";");
            for (String sql : statements) {
                String trimmed = sql.trim();
                if (!trimmed.isEmpty()) {
                    stmt.execute(trimmed);
                }
            }
            System.out.println("Database initialized successfully.");

            seedAdminAccount(conn);

        } catch (SQLException | IOException e) {
            throw new RuntimeException("Failed to initialize database", e);
        }
    }

    // Tạo tài khoản admin mặc định nếu chưa tồn tại user nào (chỉ chạy 1 lần duy nhất)
    private static void seedAdminAccount(Connection conn) throws SQLException {
        String checkSql = "SELECT COUNT(*) FROM users";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(checkSql)) {
            rs.next();
            if (rs.getInt(1) > 0) {
                return; // đã có user, không seed nữa
            }
        }

        // Tạo employee gốc cho admin
        String insertEmployee = "INSERT INTO employees (name, position, status) VALUES (?, ?, 'ACTIVE')";
        int employeeId;
        try (PreparedStatement ps = conn.prepareStatement(insertEmployee, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, "Administrator");
            ps.setString(2, "Quản trị viên");
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                keys.next();
                employeeId = keys.getInt(1);
            }
        }

        // Tạo user admin với password mặc định "admin123" (đã hash)
        String insertUser = "INSERT INTO users (username, password_hash, role_id, employee_id, status) " +
                "VALUES (?, ?, ?, ?, 'ACTIVE')";
        try (PreparedStatement ps = conn.prepareStatement(insertUser)) {
            ps.setString(1, "admin");
            ps.setString(2, PasswordUtil.hash("admin123"));
            ps.setInt(3, 1); // role_id = 1 = ADMIN (đã insert sẵn trong schema.sql)
            ps.setInt(4, employeeId);
            ps.executeUpdate();
        }

        System.out.println("Seeded default admin account -> username: admin / password: admin123");
    }

    private static String readSchemaFile() throws IOException {
        StringBuilder sb = new StringBuilder();
        InputStream is = DatabaseInitializer.class.getResourceAsStream(SCHEMA_PATH);
        if (is == null) {
            throw new IOException("Cannot find schema.sql at " + SCHEMA_PATH);
        }
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.trim().startsWith("--")) {
                    sb.append(line).append("\n");
                }
            }
        }
        return sb.toString();
    }
}