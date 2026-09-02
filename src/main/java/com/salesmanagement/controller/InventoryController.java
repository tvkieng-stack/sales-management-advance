package com.salesmanagement.controller;

import com.salesmanagement.model.Product;
import com.salesmanagement.model.Purchase;
import com.salesmanagement.model.PurchaseCartItem;
import com.salesmanagement.model.Supplier;
import com.salesmanagement.service.ProductService;
import com.salesmanagement.service.PurchaseService;
import com.salesmanagement.service.SupplierService;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleStringProperty;
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

public class InventoryController implements Initializable {

    @FXML private ComboBox<Supplier> supplierCombo;
    @FXML private ListView<Product> productListView;
    @FXML private TextField quantityField;
    @FXML private TextField unitCostField;
    @FXML private Label messageLabel;
    @FXML private Label totalLabel;

    @FXML private TableView<PurchaseCartItem> cartTable;
    @FXML private TableColumn<PurchaseCartItem, String> cartNameColumn;
    @FXML private TableColumn<PurchaseCartItem, Integer> cartQtyColumn;
    @FXML private TableColumn<PurchaseCartItem, Double> cartCostColumn;
    @FXML private TableColumn<PurchaseCartItem, Double> cartSubtotalColumn;

    private final ProductService productService = new ProductService();
    private final SupplierService supplierService = new SupplierService();
    private final PurchaseService purchaseService = new PurchaseService();
    private final ObservableList<PurchaseCartItem> cartData = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        cartNameColumn.setCellValueFactory(data ->
                new SimpleStringProperty(data.getValue().getProduct().getName()));
        cartQtyColumn.setCellValueFactory(new PropertyValueFactory<>("quantity"));
        cartCostColumn.setCellValueFactory(data ->
                new SimpleDoubleProperty(data.getValue().getUnitCost()).asObject());
        cartSubtotalColumn.setCellValueFactory(data ->
                new SimpleDoubleProperty(data.getValue().getSubtotal()).asObject());

        cartTable.setItems(cartData);

        loadSuppliers();
        loadProducts();
    }

    private void loadSuppliers() {
        AsyncUtil.run(
                () -> {
                    try {
                        return supplierService.getActive();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> supplierCombo.setItems(FXCollections.observableArrayList(result)),
                error -> messageLabel.setText("Lỗi tải nhà cung cấp: " + error.getMessage())
        );
    }

    private void loadProducts() {
        productListView.setDisable(true);
        AsyncUtil.run(
                () -> {
                    try {
                        return productService.getAll().stream()
                                .filter(p -> p.getStatus() == com.salesmanagement.model.enums.Status.ACTIVE)
                                .toList();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    productListView.setItems(FXCollections.observableArrayList(result));
                    productListView.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải sản phẩm: " + error.getMessage());
                    productListView.setDisable(false);
                }
        );
    }

    @FXML
    private void handleAddToCart() {
        Product selected = productListView.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 sản phẩm.");
            return;
        }
        try {
            int qty = Integer.parseInt(quantityField.getText().trim());
            double cost = unitCostField.getText().isBlank()
                    ? selected.getCostPrice() : Double.parseDouble(unitCostField.getText().trim());

            purchaseService.addToCart(selected, qty, cost);
            refreshCart();
            messageLabel.setText("");
        } catch (NumberFormatException e) {
            messageLabel.setText("Số lượng / giá nhập phải là số hợp lệ.");
        } catch (IllegalArgumentException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleRemoveFromCart() {
        PurchaseCartItem selected = cartTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 dòng để xóa.");
            return;
        }
        purchaseService.removeFromCart(selected);
        refreshCart();
    }

    @FXML
    private void handleConfirmPurchase() {
        Supplier supplier = supplierCombo.getValue();
        if (supplier == null) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText("Vui lòng chọn nhà cung cấp.");
            return;
        }
        try {
            Purchase purchase = purchaseService.confirmPurchase(supplier.getId());
            messageLabel.setStyle("-fx-text-fill: green;");
            messageLabel.setText("Nhập hàng thành công! Mã phiếu: " + purchase.getPurchaseCode());
            refreshCart();
            loadProducts(); // load lại để thấy tồn kho vừa tăng
        } catch (Exception e) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText("Lỗi: " + e.getMessage());
        }
    }

    private void refreshCart() {
        cartData.setAll(purchaseService.getCart());
        totalLabel.setText(String.format("TỔNG: %,.0f", purchaseService.getTotal()));
    }
}