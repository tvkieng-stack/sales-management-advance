package com.salesmanagement.controller;

import com.salesmanagement.model.Category;
import com.salesmanagement.model.Product;
import com.salesmanagement.service.ProductService;
import com.salesmanagement.util.AsyncUtil;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.StackPane;

import java.net.URL;
import java.sql.SQLException;
import java.util.ResourceBundle;

public class ProductController implements Initializable {

    @FXML private TextField barcodeField;
    @FXML private TextField nameField;
    @FXML private ComboBox<Category> categoryCombo;
    @FXML private TextField unitField;
    @FXML private TextField costPriceField;
    @FXML private TextField sellingPriceField;
    @FXML private TextField stockField;
    @FXML private TextField minStockField;
    @FXML private Label messageLabel;
    @FXML private Label pageInfoLabel;
    @FXML private StackPane loadingOverlay;

    @FXML private TableView<Product> productTable;
    @FXML private TableColumn<Product, Integer> idColumn;
    @FXML private TableColumn<Product, String> barcodeColumn;
    @FXML private TableColumn<Product, String> nameColumn;
    @FXML private TableColumn<Product, String> categoryColumn;
    @FXML private TableColumn<Product, Double> costPriceColumn;
    @FXML private TableColumn<Product, Double> sellingPriceColumn;
    @FXML private TableColumn<Product, Integer> stockColumn;
    @FXML private TableColumn<Product, String> statusColumn;

    private final ProductService productService = new ProductService();
    private final ObservableList<Product> productList = FXCollections.observableArrayList();
    private int currentPage = 0;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        idColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        barcodeColumn.setCellValueFactory(new PropertyValueFactory<>("barcode"));
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        categoryColumn.setCellValueFactory(new PropertyValueFactory<>("categoryName"));
        costPriceColumn.setCellValueFactory(new PropertyValueFactory<>("costPrice"));
        sellingPriceColumn.setCellValueFactory(new PropertyValueFactory<>("sellingPrice"));
        stockColumn.setCellValueFactory(new PropertyValueFactory<>("stockQuantity"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));

        productTable.setItems(productList);

        productTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                fillForm(newVal);
            }
        });

        loadCategories();
        loadData();
    }

    private void loadCategories() {
        try {
            ObservableList<Category> categories = FXCollections.observableArrayList(productService.getAllCategories());
            categoryCombo.setItems(categories);
        } catch (SQLException e) {
            messageLabel.setText("Lỗi tải danh mục: " + e.getMessage());
        }
    }

    private void loadData() {
        loadingOverlay.setVisible(true);

        AsyncUtil.run(
                () -> {
                    try {
                        return productService.getPage(currentPage);
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    productList.setAll(result.items());
                    pageInfoLabel.setText("Trang " + (result.pageIndex() + 1) + "/" + result.totalPages());
                    messageLabel.setText("");
                    loadingOverlay.setVisible(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải dữ liệu: " + error.getMessage());
                    loadingOverlay.setVisible(false);
                }
        );
    }

    private void fillForm(Product p) {
        barcodeField.setText(p.getBarcode());
        nameField.setText(p.getName());
        unitField.setText(p.getUnit());
        costPriceField.setText(String.valueOf(p.getCostPrice()));
        sellingPriceField.setText(String.valueOf(p.getSellingPrice()));
        stockField.setText(String.valueOf(p.getStockQuantity()));
        minStockField.setText(String.valueOf(p.getMinimumStock()));

        for (Category c : categoryCombo.getItems()) {
            if (c.getId().equals(p.getCategoryId())) {
                categoryCombo.setValue(c);
                break;
            }
        }
    }

    @FXML
    private void handleAdd() {
        try {
            double cost = parseDouble(costPriceField.getText(), "Giá vốn");
            double sell = parseDouble(sellingPriceField.getText(), "Giá bán");
            int stock = parseInt(stockField.getText(), "Tồn kho");
            int minStock = parseInt(minStockField.getText(), "Tồn tối thiểu");
            Integer categoryId = categoryCombo.getValue() != null ? categoryCombo.getValue().getId() : null;

            productService.create(barcodeField.getText(), nameField.getText(), categoryId,
                    unitField.getText(), cost, sell, stock, minStock);
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        Product selected = productTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 sản phẩm trong bảng để cập nhật.");
            return;
        }
        try {
            selected.setBarcode(barcodeField.getText());
            selected.setName(nameField.getText());
            selected.setUnit(unitField.getText());
            selected.setCostPrice(parseDouble(costPriceField.getText(), "Giá vốn"));
            selected.setSellingPrice(parseDouble(sellingPriceField.getText(), "Giá bán"));
            selected.setStockQuantity(parseInt(stockField.getText(), "Tồn kho"));
            selected.setMinimumStock(parseInt(minStockField.getText(), "Tồn tối thiểu"));
            selected.setCategoryId(categoryCombo.getValue() != null ? categoryCombo.getValue().getId() : null);

            productService.update(selected);
            clearForm();
            loadData();
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleDeactivate() {
        Product selected = productTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 sản phẩm để vô hiệu hóa.");
            return;
        }
        try {
            productService.deactivate(selected);
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

    private void clearForm() {
        barcodeField.clear();
        nameField.clear();
        unitField.clear();
        costPriceField.clear();
        sellingPriceField.clear();
        stockField.clear();
        minStockField.clear();
        categoryCombo.setValue(null);
        productTable.getSelectionModel().clearSelection();
    }

    private double parseDouble(String text, String fieldName) {
        try {
            return text == null || text.isBlank() ? 0 : Double.parseDouble(text.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " phải là số hợp lệ.");
        }
    }

    private int parseInt(String text, String fieldName) {
        try {
            return text == null || text.isBlank() ? 0 : Integer.parseInt(text.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " phải là số nguyên hợp lệ.");
        }
    }
}