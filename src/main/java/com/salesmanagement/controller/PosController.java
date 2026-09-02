package com.salesmanagement.controller;

import com.salesmanagement.model.CartItem;
import com.salesmanagement.model.Invoice;
import com.salesmanagement.model.Product;
import com.salesmanagement.model.enums.PaymentMethod;
import com.salesmanagement.service.ProductService;
import com.salesmanagement.service.SaleService;
import com.salesmanagement.util.AsyncUtil;

import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.salesmanagement.model.Customer;
import com.salesmanagement.service.CustomerService;
import com.salesmanagement.model.Promotion;
import com.salesmanagement.service.PromotionService;
import com.salesmanagement.controller.InvoicePrintController;


import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.geometry.Orientation;
import javafx.scene.Node;

import java.net.URL;
import java.sql.SQLException;
import java.util.List;
import java.util.ResourceBundle;

public class PosController implements Initializable {

    @FXML private TextField searchField;
    @FXML private ListView<Product> productListView;
    @FXML private TextField quantityField;
    @FXML private Label messageLabel;
    @FXML private Label totalLabel;
    @FXML private TextField invoiceDiscountField;
    @FXML private ComboBox<PaymentMethod> paymentMethodCombo;
    @FXML private ComboBox<Customer> customerCombo;
    @FXML private ComboBox<Promotion> promotionCombo;

    @FXML private TableView<CartItem> cartTable;
    @FXML private TableColumn<CartItem, String> cartNameColumn;
    @FXML private TableColumn<CartItem, Integer> cartQtyColumn;
    @FXML private TableColumn<CartItem, Double> cartPriceColumn;
    @FXML private TableColumn<CartItem, Double> cartSubtotalColumn;
    

    private final ProductService productService = new ProductService();
    private final SaleService saleService = new SaleService();
    private final ObservableList<CartItem> cartData = FXCollections.observableArrayList();
    private final CustomerService customerService = new CustomerService();
    private final PromotionService promotionService = new PromotionService();    

    private int productPage = 0;
    private boolean hasMoreProducts = true;
    private boolean isLoadingMoreProducts = false;
    private boolean scrollListenerAttached = false;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        cartNameColumn.setCellValueFactory(data ->
                new SimpleStringProperty(data.getValue().getProduct().getName()));
        cartQtyColumn.setCellValueFactory(new PropertyValueFactory<>("quantity"));
        cartPriceColumn.setCellValueFactory(data ->
                new SimpleDoubleProperty(data.getValue().getUnitPrice()).asObject());
        cartSubtotalColumn.setCellValueFactory(data ->
                new SimpleDoubleProperty(data.getValue().getSubtotal()).asObject());

        cartTable.setItems(cartData);

        paymentMethodCombo.setItems(FXCollections.observableArrayList(PaymentMethod.values()));
        paymentMethodCombo.setValue(PaymentMethod.CASH);

        promotionCombo.valueProperty().addListener((obs, oldVal, newVal) -> applyPromotionDiscount());

        invoiceDiscountField.textProperty().addListener((obs, oldVal, newVal) -> updateTotalDisplay());

        loadCustomers();
        loadPromotions();
        loadAllProducts();
        searchField.requestFocus();

        searchField.setOnAction(e -> handleSearch());
        
    }


    private void loadPromotions() {
        try {
            promotionCombo.setItems(FXCollections.observableArrayList(promotionService.getCurrentlyValid()));
        } catch (SQLException e) {
            messageLabel.setText("Lỗi tải khuyến mãi: " + e.getMessage());
        }
    }

    private void applyPromotionDiscount() {
        Promotion promotion = promotionCombo.getValue();
        if (promotion == null) {
            invoiceDiscountField.setText("0");
        } else {
            double discount = promotion.calculateDiscount(saleService.getSubtotal());
            invoiceDiscountField.setText(String.format("%.0f", discount));
        }
        updateTotalDisplay();
    }

    private void loadCustomers() {
        try {
            customerCombo.setItems(FXCollections.observableArrayList(customerService.getAll()));
        } catch (SQLException e) {
            messageLabel.setText("Lỗi tải khách hàng: " + e.getMessage());
        }
    }

    private void loadAllProducts() {
        loadProductsPage(true);
    }

    private void loadProductsPage(boolean reset) {
        if (reset) {
            productPage = 0;
            hasMoreProducts = true;
        }
        if (!hasMoreProducts || isLoadingMoreProducts) return;
        isLoadingMoreProducts = true;

        AsyncUtil.run(
                () -> {
                    try {
                        return productService.getActivePage(productPage);
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                page -> {
                    if (reset) {
                        productListView.setItems(FXCollections.observableArrayList(page.items()));
                    } else {
                        productListView.getItems().addAll(page.items());
                    }
                    productPage++;
                    hasMoreProducts = productPage < page.totalPages();
                    isLoadingMoreProducts = false;
                    attachScrollListenerIfNeeded();
                },
                error -> {
                    messageLabel.setText("Lỗi tải sản phẩm: " + error.getMessage());
                    isLoadingMoreProducts = false;
                }
        );
    }

    // Bắt sự kiện cuộn của ListView - khi cuộn gần đáy (>90%) và còn dữ liệu, tự động tải thêm trang tiếp theo
    private void attachScrollListenerIfNeeded() {
        if (scrollListenerAttached) return;
        for (Node node : productListView.lookupAll(".scroll-bar")) {
            if (node instanceof ScrollBar sb && sb.getOrientation() == Orientation.VERTICAL) {
                sb.valueProperty().addListener((obs, oldVal, newVal) -> {
                    if (newVal.doubleValue() > 0.9 && searchField.getText().isBlank()) {
                        loadProductsPage(false);
                    }
                });
                scrollListenerAttached = true;
                break;
            }
        }
    }

    private void showInvoicePrintDialog(int invoiceId) {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/salesmanagement/view/invoice_print.fxml"));
            Parent root = loader.load();
            InvoicePrintController controller = loader.getController();
            controller.loadInvoice(invoiceId);

            Stage stage = new Stage();
            stage.setTitle("Hóa đơn");
            Scene scene = new Scene(root, 420, 600);
            scene.getStylesheets().add(getClass().getResource("/com/salesmanagement/view/style.css").toExternalForm());
            stage.setScene(scene);
            stage.show();
        } catch (java.io.IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void handleSearch() {
        String keyword = searchField.getText();
        if (keyword == null || keyword.isBlank()) {
            loadAllProducts();
            return;
        }
        try {
            productListView.setItems(FXCollections.observableArrayList(productService.getAll().stream()
                    .filter(p -> p.getName().toLowerCase().contains(keyword.toLowerCase())
                            || (p.getBarcode() != null && p.getBarcode().contains(keyword)))
                    .toList()));
        } catch (SQLException e) {
            messageLabel.setText("Lỗi tìm kiếm: " + e.getMessage());
        }
    }

    @FXML
    private void handleAddToCart() {
        Product selected = productListView.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 sản phẩm trong danh sách.");
            return;
        }
        try {
            int qty = Integer.parseInt(quantityField.getText().trim());
            saleService.addToCart(selected, qty);
            refreshCart();
            messageLabel.setText("");
        } catch (NumberFormatException e) {
            messageLabel.setText("Số lượng phải là số nguyên hợp lệ.");
        } catch (IllegalArgumentException e) {
            messageLabel.setText(e.getMessage());
        }
        searchField.requestFocus();
        searchField.selectAll(); // để gõ/quét mã tiếp theo là ghi đè luôn, không cần xóa tay
    }

    @FXML
    private void handleRemoveFromCart() {
        CartItem selected = cartTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 dòng trong giỏ hàng để xóa.");
            return;
        }
        saleService.removeFromCart(selected);
        refreshCart();
    }

    @FXML
    private void handleClearCart() {
        saleService.clearCart();
        refreshCart();
    }

    @FXML
    private void handleCheckout() {
        if (saleService.getCart().isEmpty()) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText("Giỏ hàng đang trống.");
            return;
        }
        try {
            double discount = invoiceDiscountField.getText().isBlank()
                    ? 0 : Double.parseDouble(invoiceDiscountField.getText().trim());
            PaymentMethod method = paymentMethodCombo.getValue();

            Customer selectedCustomer = customerCombo.getValue();
            Integer customerId = selectedCustomer != null ? selectedCustomer.getId() : null;
            Invoice invoice = saleService.checkout(method, discount, customerId);

            messageLabel.setStyle("-fx-text-fill: green;");
            messageLabel.setText("Thanh toán thành công! Mã hóa đơn: " + invoice.getInvoiceCode());
            showInvoicePrintDialog(invoice.getId());

            invoiceDiscountField.setText("0");
            refreshCart();
            loadAllProducts(); // load lại để thấy tồn kho vừa bị trừ
            customerCombo.setValue(null);
            promotionCombo.setValue(null);


        } catch (NumberFormatException e) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText("Giảm giá phải là số hợp lệ.");
        } catch (Exception e) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText("Lỗi thanh toán: " + e.getMessage());
        }
    }

    private void refreshCart() {
        cartData.setAll(saleService.getCart());
        if (promotionCombo.getValue() != null) {
            applyPromotionDiscount(); // tính lại discount theo subtotal mới
        } else {
            updateTotalDisplay();
        }
    }

    private void updateTotalDisplay() {
        double discount = 0;
        try {
            discount = invoiceDiscountField.getText().isBlank()
                    ? 0 : Double.parseDouble(invoiceDiscountField.getText().trim());
        } catch (NumberFormatException ignored) {
        }
        double total = Math.max(0, saleService.getSubtotal() - discount);
        totalLabel.setText(String.format("TỔNG: %,.0f", total));
    }

    // Các method public này được PosTabsController gọi khi người dùng bấm phím tắt,
    // đảm bảo hotkey luôn tác động đúng vào Tab đang được chọn, không bị lẫn giữa các đơn hàng.
    public void focusSearchField() {
        searchField.requestFocus();
        searchField.selectAll();
    }

    public void triggerCheckout() {
        handleCheckout();
    }

    public void openCustomerDropdown() {
        customerCombo.show();
    }
}