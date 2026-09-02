package com.salesmanagement.controller;

import com.salesmanagement.model.Customer;
import com.salesmanagement.service.CustomerService;
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

public class CustomerController implements Initializable {

    @FXML private TextField nameField;
    @FXML private TextField phoneField;
    @FXML private TextField emailField;
    @FXML private TextField addressField;
    @FXML private Label messageLabel;
    @FXML private Label pageInfoLabel;

    @FXML private TableView<Customer> customerTable;
    @FXML private TableColumn<Customer, Integer> idColumn;
    @FXML private TableColumn<Customer, String> nameColumn;
    @FXML private TableColumn<Customer, String> phoneColumn;
    @FXML private TableColumn<Customer, String> emailColumn;
    @FXML private TableColumn<Customer, String> addressColumn;
    @FXML private TableColumn<Customer, Integer> pointsColumn;

    private final CustomerService customerService = new CustomerService();
    private final ObservableList<Customer> customerList = FXCollections.observableArrayList();
    private int currentPage = 0;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        idColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        phoneColumn.setCellValueFactory(new PropertyValueFactory<>("phone"));
        emailColumn.setCellValueFactory(new PropertyValueFactory<>("email"));
        addressColumn.setCellValueFactory(new PropertyValueFactory<>("address"));
        pointsColumn.setCellValueFactory(new PropertyValueFactory<>("loyaltyPoints"));

        customerTable.setItems(customerList);

        customerTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) fillForm(newVal);
        });

        loadData();
    }

    private void loadData() {
        customerTable.setDisable(true);
        messageLabel.setText("Đang tải...");

        AsyncUtil.run(
                () -> {
                    try {
                        return customerService.getPage(currentPage);
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    customerList.setAll(result.items());
                    pageInfoLabel.setText("Trang " + (result.pageIndex() + 1) + "/" + result.totalPages());
                    messageLabel.setText("");
                    customerTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải dữ liệu: " + error.getMessage());
                    customerTable.setDisable(false);
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

    private void fillForm(Customer c) {
        nameField.setText(c.getName());
        phoneField.setText(c.getPhone());
        emailField.setText(c.getEmail());
        addressField.setText(c.getAddress());
    }

    @FXML
    private void handleAdd() {
        try {
            customerService.create(nameField.getText(), phoneField.getText(), emailField.getText(), addressField.getText());
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        Customer selected = customerTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 khách hàng để cập nhật.");
            return;
        }
        try {
            selected.setName(nameField.getText());
            selected.setPhone(phoneField.getText());
            selected.setEmail(emailField.getText());
            selected.setAddress(addressField.getText());
            customerService.update(selected);
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
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
        customerTable.getSelectionModel().clearSelection();
    }
}