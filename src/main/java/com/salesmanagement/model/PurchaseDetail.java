package com.salesmanagement.model;

public class PurchaseDetail {
    private Integer id;
    private Integer purchaseId;
    private Integer productId;
    private int quantity;
    private double unitCost;
    private double subtotal;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getPurchaseId() { return purchaseId; }
    public void setPurchaseId(Integer purchaseId) { this.purchaseId = purchaseId; }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getUnitCost() { return unitCost; }
    public void setUnitCost(double unitCost) { this.unitCost = unitCost; }

    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }
}