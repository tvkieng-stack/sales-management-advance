package com.salesmanagement.service;

import com.salesmanagement.TestDatabaseSetup;
import com.salesmanagement.model.Product;
import com.salesmanagement.model.User;
import com.salesmanagement.model.enums.PaymentMethod;
import com.salesmanagement.model.enums.Role;
import com.salesmanagement.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;

class SaleServiceTest {

    private SaleService saleService;
    private ProductRepository productRepository;
    private Product testProduct;

    @BeforeEach
    void setUp() throws SQLException {
        TestDatabaseSetup.initFreshDatabase();

        // Giả lập user đã đăng nhập (checkout() cần Session.getCurrentUser())
        User fakeUser = new User();
        fakeUser.setId(1);
        fakeUser.setUsername("test_employee");
        fakeUser.setEmployeeId(1);
        fakeUser.setRoleName(Role.EMPLOYEE.name());
        Session.login(fakeUser);

        productRepository = new ProductRepository();
        testProduct = new Product("SP_TEST", "Sản phẩm test", null, "cái", 5000, 8000, 10, 2);
        productRepository.save(testProduct);

        saleService = new SaleService();
    }

    // TC03 - Bán đủ tồn: tạo invoice, trừ kho đúng
    @Test
    void checkout_withSufficientStock_shouldSucceedAndReduceStock() throws SQLException {
        saleService.addToCart(testProduct, 3);

        var invoice = saleService.checkout(PaymentMethod.CASH, 0, null);

        assertNotNull(invoice.getId());
        assertEquals(24000, invoice.getTotal()); // 8000 * 3

        Product afterCheckout = productRepository.findByIdInTransaction(
                com.salesmanagement.database.DatabaseConnection.getConnection(), testProduct.getId());
        assertEquals(7, afterCheckout.getStockQuantity()); // 10 - 3 = 7
    }

    // TC04 - Bán vượt tồn: từ chối ngay khi thêm vào giỏ, kho không đổi
    @Test
    void addToCart_withQuantityExceedingStock_shouldThrowException() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> saleService.addToCart(testProduct, 999));

        assertTrue(ex.getMessage().contains("Không đủ tồn kho"));
        assertTrue(saleService.getCart().isEmpty());
    }

    // Checkout với giỏ hàng trống phải bị chặn
    @Test
    void checkout_withEmptyCart_shouldThrowException() {
        assertThrows(IllegalStateException.class,
                () -> saleService.checkout(PaymentMethod.CASH, 0, null));
    }

    // Test tính discount hóa đơn đúng
    @Test
    void checkout_withInvoiceDiscount_shouldReduceTotal() throws SQLException {
        saleService.addToCart(testProduct, 2); // subtotal = 16000

        var invoice = saleService.checkout(PaymentMethod.TRANSFER, 1000, null);

        assertEquals(16000, invoice.getSubtotal());
        assertEquals(1000, invoice.getDiscount());
        assertEquals(15000, invoice.getTotal());
    }
}