package com.salesmanagement.controller;

import com.salesmanagement.model.Category;
import com.salesmanagement.service.CategoryService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.salesmanagement.util.AsyncUtil;

import java.net.URL;
import java.sql.SQLException;
import java.util.ResourceBundle;

public class CategoryController implements Initializable {

    @FXML private TextField nameField;
    @FXML private TextField descriptionField;
    @FXML private Label messageLabel;

    @FXML private TableView<Category> categoryTable;
    @FXML private TableColumn<Category, Integer> idColumn;
    @FXML private TableColumn<Category, String> nameColumn;
    @FXML private TableColumn<Category, String> descriptionColumn;
    @FXML private TableColumn<Category, String> statusColumn;

    private final CategoryService categoryService = new CategoryService();
    private final ObservableList<Category> categoryList = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        idColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        descriptionColumn.setCellValueFactory(new PropertyValueFactory<>("description"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));

        categoryTable.setItems(categoryList);

        // Khi chọn 1 dòng, đổ dữ liệu vào form để sửa
        categoryTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                nameField.setText(newVal.getName());
                descriptionField.setText(newVal.getDescription());
            }
        });

        loadData();
    }

    private void loadData() {
        categoryTable.setDisable(true);
        messageLabel.setText("Đang tải...");

        AsyncUtil.run(
                () -> {
                    try {
                        return categoryService.getAll();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    categoryList.setAll(result);
                    messageLabel.setText("");
                    categoryTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải dữ liệu: " + error.getMessage());
                    categoryTable.setDisable(false);
                }
        );
    }

    @FXML
    private void handleAdd() {
        try {
            categoryService.create(nameField.getText(), descriptionField.getText());
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        Category selected = categoryTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 danh mục trong bảng để cập nhật.");
            return;
        }
        try {
            selected.setName(nameField.getText());
            selected.setDescription(descriptionField.getText());
            categoryService.update(selected);
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleDeactivate() {
        Category selected = categoryTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 danh mục để vô hiệu hóa.");
            return;
        }
        try {
            categoryService.deactivate(selected);
            clearForm();
            loadData();
        } catch (SQLException e) {
            messageLabel.setText("Lỗi: " + e.getMessage());
        }
    }

    @FXML
    private void handleRefresh() {
        clearForm();
        loadData();
    }

    private void clearForm() {
        nameField.clear();
        descriptionField.clear();
        categoryTable.getSelectionModel().clearSelection();
    }
}