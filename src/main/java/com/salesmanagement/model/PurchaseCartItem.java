package com.salesmanagement.model;

public class PurchaseCartItem {
    private final Product product;
    private int quantity;
    private double unitCost;

    public PurchaseCartItem(Product product, int quantity, double unitCost) {
        this.product = product;
        this.quantity = quantity;
        this.unitCost = unitCost;
    }

    public Product getProduct() { return product; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getUnitCost() { return unitCost; }
    public void setUnitCost(double unitCost) { this.unitCost = unitCost; }

    public double getSubtotal() {
        return quantity * unitCost;
    }
}