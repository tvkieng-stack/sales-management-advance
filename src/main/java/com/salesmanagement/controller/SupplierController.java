package com.salesmanagement.controller;

import com.salesmanagement.model.Supplier;
import com.salesmanagement.service.SupplierService;
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

public class SupplierController implements Initializable {

    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextField addressField;
    @FXML private Label messageLabel;
    @FXML private Label pageInfoLabel;

    @FXML private TableView<Supplier> supplierTable;
    @FXML private TableColumn<Supplier, Integer> idColumn;
    @FXML private TableColumn<Supplier, String> nameColumn;
    @FXML private TableColumn<Supplier, String> phoneColumn;
    @FXML private TableColumn<Supplier, String> emailColumn;
    @FXML private TableColumn<Supplier, String> addressColumn;
    @FXML private TableColumn<Supplier, String> statusColumn;

    private final SupplierService supplierService = new SupplierService();
    private final ObservableList<Supplier> supplierList = FXCollections.observableArrayList();
    private int currentPage = 0;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        idColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        phoneColumn.setCellValueFactory(new PropertyValueFactory<>("phone"));
        emailColumn.setCellValueFactory(new PropertyValueFactory<>("email"));
        addressColumn.setCellValueFactory(new PropertyValueFactory<>("address"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));

        supplierTable.setItems(supplierList);

        supplierTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) fillForm(newVal);
        });

        loadData();
    }

    private void loadData() {
        supplierTable.setDisable(true);
        messageLabel.setText("Đang tải...");

        AsyncUtil.run(
                () -> {
                    try {
                        return supplierService.getPage(currentPage);
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    supplierList.setAll(result.items());
                    pageInfoLabel.setText("Trang " + (result.pageIndex() + 1) + "/" + result.totalPages());
                    messageLabel.setText("");
                    supplierTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải dữ liệu: " + error.getMessage());
                    supplierTable.setDisable(false);
                }
        );
    }

    @FXML
    private void handlePreviousPage() {
        if (currentPage > 0) {
            currentPage--;
            loadData();
        }
    }

    @FXML
    private void handleNextPage() {
        currentPage++;
        loadData();
    }

    private void fillForm(Supplier s) {
        nameField.setText(s.getName());
        phoneField.setText(s.getPhone());
        emailField.setText(s.getEmail());
        addressField.setText(s.getAddress());
    }

    @FXML
    private void handleAdd() {
        try {
            supplierService.create(nameField.getText(), phoneField.getText(), emailField.getText(), addressField.getText());
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        Supplier selected = supplierTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 nhà cung cấp để cập nhật.");
            return;
        }
        try {
            selected.setName(nameField.getText());
            selected.setPhone(phoneField.getText());
            selected.setEmail(emailField.getText());
            selected.setAddress(addressField.getText());
            supplierService.update(selected);
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleDeactivate() {
        Supplier selected = supplierTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 nhà cung cấp để vô hiệu hóa.");
            return;
        }
        try {
            supplierService.deactivate(selected);
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
        phoneField.clear();
        emailField.clear();
        addressField.clear();
        supplierTable.getSelectionModel().clearSelection();
    }
}