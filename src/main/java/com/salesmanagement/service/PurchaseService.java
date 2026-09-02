package com.salesmanagement.service;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.*;
import com.salesmanagement.model.enums.PurchaseStatus;
import com.salesmanagement.model.enums.StockTransactionType;
import com.salesmanagement.repository.ProductRepository;
import com.salesmanagement.repository.PurchaseRepository;
import com.salesmanagement.repository.StockTransactionRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PurchaseService {

    private final List<PurchaseCartItem> cart = new ArrayList<>();

    private final ProductRepository productRepository = new ProductRepository();
    private final PurchaseRepository purchaseRepository = new PurchaseRepository();
    private final StockTransactionRepository stockTransactionRepository = new StockTransactionRepository();

    public List<PurchaseCartItem> getCart() {
        return cart;
    }

    public void addToCart(Product product, int quantity, double unitCost) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0.");
        }
        if (unitCost < 0) {
            throw new IllegalArgumentException("Giá nhập không được âm.");
        }
        for (PurchaseCartItem item : cart) {
            if (item.getProduct().getId().equals(product.getId())) {
                item.setQuantity(item.getQuantity() + quantity);
                item.setUnitCost(unitCost); // cập nhật giá nhập mới nhất
                return;
            }
        }
        cart.add(new PurchaseCartItem(product, quantity, unitCost));
    }

    public void removeFromCart(PurchaseCartItem item) {
        cart.remove(item);
    }

    public void clearCart() {
        cart.clear();
    }

    public double getTotal() {
        return cart.stream().mapToDouble(PurchaseCartItem::getSubtotal).sum();
    }

    /**
     * UC12 (mục 6 đặc tả): chọn NCC -> tạo phiếu nhập -> thêm sản phẩm/SL/giá vốn -> tính tổng
     * -> lưu purchase + purchase_details -> tăng tồn kho -> ghi stock transaction -> commit.
     * Toàn bộ trong 1 transaction, giống nguyên tắc ở checkout (Bước 10).
     */
    public Purchase confirmPurchase(Integer supplierId) throws SQLException {
        if (cart.isEmpty()) {
            throw new IllegalStateException("Phiếu nhập chưa có sản phẩm nào.");
        }
        if (supplierId == null) {
            throw new IllegalStateException("Vui lòng chọn nhà cung cấp.");
        }

        Integer employeeId = Session.getCurrentUser().getEmployeeId();
        double total = getTotal();

        Connection conn = DatabaseConnection.getConnection();
        boolean originalAutoCommit = conn.getAutoCommit();

        try {
            conn.setAutoCommit(false); // BEGIN

            Purchase purchase = new Purchase();
            purchase.setPurchaseCode(purchaseRepository.generatePurchaseCode());
            purchase.setSupplierId(supplierId);
            purchase.setEmployeeId(employeeId);
            purchase.setTotalCost(total);
            purchase.setStatus(PurchaseStatus.COMPLETED);

            purchaseRepository.savePurchase(conn, purchase);

            for (PurchaseCartItem item : cart) {
                Product product = item.getProduct();

                PurchaseDetail detail = new PurchaseDetail();
                detail.setPurchaseId(purchase.getId());
                detail.setProductId(product.getId());
                detail.setQuantity(item.getQuantity());
                detail.setUnitCost(item.getUnitCost());
                detail.setSubtotal(item.getSubtotal());
                purchaseRepository.savePurchaseDetail(conn, detail);

                productRepository.increaseStockInTransaction(conn, product.getId(), item.getQuantity());

                StockTransaction tx = new StockTransaction();
                tx.setProductId(product.getId());
                tx.setEmployeeId(employeeId);
                tx.setType(StockTransactionType.IMPORT);
                tx.setQuantity(item.getQuantity()); // dương = tăng kho
                tx.setReferenceType("PURCHASE");
                tx.setReferenceId(purchase.getId());
                tx.setNote("Nhập hàng - phiếu " + purchase.getPurchaseCode());
                stockTransactionRepository.save(conn, tx);
            }

            conn.commit(); // COMMIT
            cart.clear();
            return purchase;

        } catch (SQLException e) {
            conn.rollback(); // ROLLBACK
            throw e;
        } finally {
            try {
                conn.setAutoCommit(originalAutoCommit);
                conn.close();
            } catch (SQLException ignored) {
            }
        }
    }
}