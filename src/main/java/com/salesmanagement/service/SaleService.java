package com.salesmanagement.service;

import com.salesmanagement.database.DatabaseConnection;
import com.salesmanagement.model.*;
import com.salesmanagement.model.enums.InvoiceStatus;
import com.salesmanagement.model.enums.PaymentMethod;
import com.salesmanagement.model.enums.StockTransactionType;
import com.salesmanagement.repository.InvoiceRepository;
import com.salesmanagement.repository.ProductRepository;
import com.salesmanagement.repository.StockTransactionRepository;
import com.salesmanagement.repository.CustomerRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class SaleService {

    private final List<CartItem> cart = new ArrayList<>();

    private final ProductRepository productRepository = new ProductRepository();
    private final InvoiceRepository invoiceRepository = new InvoiceRepository();
    private final StockTransactionRepository stockTransactionRepository = new StockTransactionRepository();
    private final CustomerRepository customerRepository = new CustomerRepository();
    public List<CartItem> getCart() {
        return cart;
    }

    public void addToCart(Product product, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0.");
        }
        for (CartItem item : cart) {
            if (item.getProduct().getId().equals(product.getId())) {
                int newQty = item.getQuantity() + quantity;
                checkStock(product, newQty);
                item.setQuantity(newQty);
                return;
            }
        }
        checkStock(product, quantity);
        cart.add(new CartItem(product, quantity));
    }

    public void removeFromCart(CartItem item) {
        cart.remove(item);
    }

    public void clearCart() {
        cart.clear();
    }

    private void checkStock(Product product, int requestedQty) {
        if (requestedQty > product.getStockQuantity()) {
            throw new IllegalArgumentException(
                    "Không đủ tồn kho cho \"" + product.getName() + "\". Tồn hiện tại: " + product.getStockQuantity());
        }
    }

    public double getSubtotal() {
        return cart.stream().mapToDouble(CartItem::getSubtotal).sum();
    }

    /**
     * UC07 + UC08 (mục 6 đặc tả): toàn bộ thao tác tạo hóa đơn + cập nhật kho nằm trong 1 transaction.
     * BEGIN -> insert invoice -> insert invoice_details -> update stock -> insert stock_transactions -> COMMIT.
     * Lỗi ở bất kỳ bước nào (kể cả hết hàng ngay lúc chốt đơn) -> ROLLBACK toàn bộ, không có dữ liệu dở dang.
     */
    public Invoice checkout(PaymentMethod paymentMethod, double invoiceDiscount, Integer customerId) throws SQLException {
        if (cart.isEmpty()) {
            throw new IllegalStateException("Giỏ hàng đang trống.");
        }
        if (paymentMethod == null) {
            throw new IllegalStateException("Vui lòng chọn phương thức thanh toán.");
        }

        Integer employeeId = Session.getCurrentUser().getEmployeeId();
        double subtotal = getSubtotal();
        double total = Math.max(0, subtotal - invoiceDiscount);

        Connection conn = DatabaseConnection.getConnection();
        boolean originalAutoCommit = conn.getAutoCommit();

        try {
            conn.setAutoCommit(false); // BEGIN

            Invoice invoice = new Invoice();
            invoice.setInvoiceCode(invoiceRepository.generateInvoiceCode());
            invoice.setEmployeeId(employeeId);
            invoice.setCustomerId(customerId);
            invoice.setSubtotal(subtotal);
            invoice.setDiscount(invoiceDiscount);
            invoice.setTotal(total);
            invoice.setPaymentMethod(paymentMethod);
            invoice.setStatus(InvoiceStatus.PAID);

            invoiceRepository.saveInvoice(conn, invoice);

            for (CartItem item : cart) {
                Product product = item.getProduct();

                // Kiểm tra lại tồn kho NGAY TRONG transaction (chống race condition nếu có 2 người bán cùng lúc)
                Product freshProduct = productRepository.findByIdInTransaction(conn, product.getId());
                if (freshProduct == null || freshProduct.getStockQuantity() < item.getQuantity()) {
                    throw new IllegalStateException(
                            "Không đủ tồn kho cho \"" + product.getName() + "\" tại thời điểm thanh toán.");
                }

                InvoiceDetail detail = new InvoiceDetail();
                detail.setInvoiceId(invoice.getId());
                detail.setProductId(product.getId());
                detail.setQuantity(item.getQuantity());
                detail.setUnitPrice(item.getUnitPrice());
                detail.setDiscount(item.getDiscount());
                detail.setSubtotal(item.getSubtotal());
                invoiceRepository.saveInvoiceDetail(conn, detail);

                int newStock = freshProduct.getStockQuantity() - item.getQuantity();
                productRepository.updateStockQuantityInTransaction(conn, product.getId(), newStock);

                StockTransaction tx = new StockTransaction();
                tx.setProductId(product.getId());
                tx.setEmployeeId(employeeId);
                tx.setType(StockTransactionType.SALE);
                tx.setQuantity(-item.getQuantity()); // âm = trừ kho
                tx.setReferenceType("INVOICE");
                tx.setReferenceId(invoice.getId());
                tx.setNote("Bán hàng - hóa đơn " + invoice.getInvoiceCode());
                stockTransactionRepository.save(conn, tx);
            }

            // UC07 (mục 18 đặc tả): cộng điểm tích lũy cho khách hàng SAU KHI invoice PAID - nằm trong cùng transaction
            if (customerId != null) {
                int pointsEarned = (int) (total / 10000); // quy tắc: mỗi 10,000đ = 1 điểm (có thể điều chỉnh)
                if (pointsEarned > 0) {
                    customerRepository.addLoyaltyPoints(conn, customerId, pointsEarned);
                }
            }

            conn.commit(); // COMMIT
            cart.clear();
            return invoice;

        } catch (SQLException | IllegalStateException e) {
            conn.rollback(); // ROLLBACK - đúng yêu cầu TC05 trong bảng test case mục 17
            if (e instanceof SQLException se) throw se;
            throw new SQLException(e.getMessage(), e);
        } finally {
            try {
                conn.setAutoCommit(originalAutoCommit);
                conn.close();
            } catch (SQLException ignored) {
            }
        }
    }
}