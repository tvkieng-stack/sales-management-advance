package com.salesmanagement.service;

import com.salesmanagement.database.DatabaseConnection;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class BackupService {

    private static final String DB_FILE_PATH = "sales_management.db";

    // UC15: Backup - dùng lệnh VACUUM INTO của SQLite, đảm bảo file backup nhất quán
    // (khác với copy file thô, VACUUM INTO tự chờ và ghi ra bản sao sạch, không lo transaction dở dang)
    public String backup(String targetFolder) throws SQLException, IOException {
        if (targetFolder == null || targetFolder.isBlank()) {
            throw new IllegalArgumentException("Vui lòng chọn thư mục lưu backup.");
        }

        File folder = new File(targetFolder);
        if (!folder.exists() || !folder.isDirectory()) {
            throw new IllegalArgumentException("Thư mục không hợp lệ.");
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupFileName = "sales_management_backup_" + timestamp + ".db";
        File backupFile = new File(folder, backupFileName);

        // VACUUM INTO tạo file mới hoàn toàn sạch, không được trùng tên file đã tồn tại
        String backupPathEscaped = backupFile.getAbsolutePath().replace("'", "''");

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("VACUUM INTO '" + backupPathEscaped + "'");
        }

        return backupFile.getAbsolutePath();
    }

    // UC15: Restore - đóng connection hiện tại, thay thế file database bằng file backup, mở lại connection
    public void restore(String backupFilePath) throws SQLException, IOException {
        if (backupFilePath == null || backupFilePath.isBlank()) {
            throw new IllegalArgumentException("Vui lòng chọn file backup để khôi phục.");
        }

        File backupFile = new File(backupFilePath);
        if (!backupFile.exists() || !backupFile.isFile()) {
            throw new IllegalArgumentException("File backup không tồn tại.");
        }

        DatabaseConnection.closeConnection(); // no-op ở thiết kế mới, giữ lại cho rõ ý đồ code

        File currentDbFile = new File(DB_FILE_PATH);
        Files.copy(backupFile.toPath(), currentDbFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        // Không cần mở lại connection thủ công - lần gọi getConnection() tiếp theo (ở bất kỳ màn nào)
        // sẽ tự động kết nối vào file database mới.
    }
}