package com.salesmanagement.service;

import com.salesmanagement.model.Category;
import com.salesmanagement.model.Product;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.CategoryRepository;
import com.salesmanagement.repository.ProductRepository;

import java.sql.SQLException;
import java.util.List;

public class ProductService {

    private final ProductRepository productRepository = new ProductRepository();
    private final CategoryRepository categoryRepository = new CategoryRepository();

    public static final int PAGE_SIZE = 20;

    public PageResult<Product> getPage(int pageIndex) throws SQLException {
        List<Product> items = productRepository.findPage(pageIndex, PAGE_SIZE);
        int totalRecords = productRepository.countAll();
        int totalPages = (int) Math.ceil((double) totalRecords / PAGE_SIZE);
        return new PageResult<>(items, pageIndex, Math.max(totalPages, 1));
    }

    public record PageResult<T>(List<T> items, int pageIndex, int totalPages) {
    }

    public PageResult<Product> getActivePage(int pageIndex) throws SQLException {
        List<Product> items = productRepository.findActivePage(pageIndex, PAGE_SIZE);
        int totalRecords = productRepository.countActive();
        int totalPages = (int) Math.ceil((double) totalRecords / PAGE_SIZE);
        return new PageResult<>(items, pageIndex, Math.max(totalPages, 1));
    }

    public List<Product> getAll() throws SQLException {
        return productRepository.findAll();
    }

    public List<Category> getAllCategories() throws SQLException {
        return categoryRepository.findAll();
    }

    public void create(String barcode, String name, Integer categoryId, String unit,
                        double costPrice, double sellingPrice, int stockQuantity, int minimumStock)
            throws SQLException {
        validate(name, costPrice, sellingPrice);

        if (barcode != null && !barcode.isBlank()) {
            Product existing = productRepository.findByBarcode(barcode.trim());
            if (existing != null) {
                throw new IllegalArgumentException("Barcode đã tồn tại cho sản phẩm: " + existing.getName());
            }
        }

        Product p = new Product(
                (barcode == null || barcode.isBlank()) ? null : barcode.trim(),
                name.trim(), categoryId, unit, costPrice, sellingPrice, stockQuantity, minimumStock
        );
        productRepository.save(p);
    }

    public void update(Product product) throws SQLException {
        validate(product.getName(), product.getCostPrice(), product.getSellingPrice());

        if (product.getBarcode() != null && !product.getBarcode().isBlank()) {
            Product existing = productRepository.findByBarcode(product.getBarcode().trim());
            if (existing != null && !existing.getId().equals(product.getId())) {
                throw new IllegalArgumentException("Barcode đã tồn tại cho sản phẩm: " + existing.getName());
            }
        }

        productRepository.update(product);
    }

    public void deactivate(Product product) throws SQLException {
        productRepository.deactivate(product.getId());
    }

    public List<Product> findLowStock() throws SQLException {
        return productRepository.findLowStock();
    }

    private void validate(String name, double costPrice, double sellingPrice) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên sản phẩm không được để trống.");
        }
        if (costPrice < 0 || sellingPrice < 0) {
            throw new IllegalArgumentException("Giá vốn và giá bán không được âm.");
        }
    }
}