package com.salesmanagement.controller;

import com.salesmanagement.service.BackupService;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;
import javafx.stage.DirectoryChooser;
import javafx.stage.FileChooser;
import javafx.stage.Window;

import java.io.File;
import java.util.Optional;

public class BackupController {

    @FXML private TextField backupFolderField;
    @FXML private TextField restoreFileField;
    @FXML private Label messageLabel;

    private final BackupService backupService = new BackupService();
    private File selectedBackupFolder;
    private File selectedRestoreFile;

    @FXML
    private void handleChooseBackupFolder() {
        DirectoryChooser chooser = new DirectoryChooser();
        chooser.setTitle("Chọn thư mục lưu backup");
        File folder = chooser.showDialog(getWindow());
        if (folder != null) {
            selectedBackupFolder = folder;
            backupFolderField.setText(folder.getAbsolutePath());
        }
    }

    @FXML
    private void handleBackup() {
        if (selectedBackupFolder == null) {
            showMessage("Vui lòng chọn thư mục lưu backup trước.", true);
            return;
        }
        try {
            String path = backupService.backup(selectedBackupFolder.getAbsolutePath());
            showMessage("Sao lưu thành công! File: " + path, false);
        } catch (Exception e) {
            showMessage("Lỗi backup: " + e.getMessage(), true);
        }
    }

    @FXML
    private void handleChooseRestoreFile() {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Chọn file backup (.db)");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("SQLite Database", "*.db"));
        File file = chooser.showOpenDialog(getWindow());
        if (file != null) {
            selectedRestoreFile = file;
            restoreFileField.setText(file.getAbsolutePath());
        }
    }

    @FXML
    private void handleRestore() {
        if (selectedRestoreFile == null) {
            showMessage("Vui lòng chọn file backup để khôi phục.", true);
            return;
        }

        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION,
                "Khôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Bạn chắc chắn muốn tiếp tục?",
                ButtonType.YES, ButtonType.NO);
        confirm.setTitle("Xác nhận khôi phục");
        Optional<ButtonType> result = confirm.showAndWait();

        if (result.isPresent() && result.get() == ButtonType.YES) {
            try {
                backupService.restore(selectedRestoreFile.getAbsolutePath());
                showMessage("Khôi phục thành công! Vui lòng đăng xuất và đăng nhập lại để tải dữ liệu mới.", false);
            } catch (Exception e) {
                showMessage("Lỗi khôi phục: " + e.getMessage(), true);
            }
        }
    }

    private void showMessage(String text, boolean isError) {
        messageLabel.setStyle(isError ? "-fx-text-fill: red;" : "-fx-text-fill: green;");
        messageLabel.setText(text);
    }

    private Window getWindow() {
        return backupFolderField.getScene().getWindow();
    }
}