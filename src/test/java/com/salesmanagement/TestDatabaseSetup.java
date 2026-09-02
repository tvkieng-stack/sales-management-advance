package com.salesmanagement;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.database.DatabaseInitializer;

import java.io.File;
import java.io.IOException;

public class TestDatabaseSetup {

    // Tạo 1 file database tạm, RIÊNG BIỆT cho mỗi lần gọi - không đụng file sales_management.db thật.
    // Dùng file thật (không phải :memory:) vì code Repository đóng/mở connection liên tục -
    // với :memory: mỗi lần đóng connection sẽ xóa sạch dữ liệu (mỗi kết nối mới = database mới).
    public static void initFreshDatabase() {
        try {
            File tempDb = File.createTempFile("sales_management_test_", ".db");
            tempDb.deleteOnExit(); // tự xóa khi JVM thoát, không để lại rác

            DatabaseConnection.setDbUrl("jdbc:sqlite:" + tempDb.getAbsolutePath());
            DatabaseInitializer.initialize();
        } catch (IOException e) {
            throw new RuntimeException("Failed to create temp test database", e);
        }
    }
}