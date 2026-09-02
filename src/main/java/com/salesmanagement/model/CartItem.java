package com.salesmanagement.model;

public class CartItem {
    private final Product product;
    private int quantity;
    private double discount; // giảm giá theo dòng, đơn vị: số tiền

    public CartItem(Product product, int quantity) {
        this.product = product;
        this.quantity = quantity;
        this.discount = 0;
    }

    public Product getProduct() { return product; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getDiscount() { return discount; }
    public void setDiscount(double discount) { this.discount = discount; }

    public double getUnitPrice() {
        return product.getSellingPrice();
    }

    public double getSubtotal() {
        return (unitPrice() * quantity) - discount;
    }

    private double unitPrice() {
        return product.getSellingPrice();
    }
}