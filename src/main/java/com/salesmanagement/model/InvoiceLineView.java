package com.salesmanagement.model;

public record InvoiceLineView(String productName, int quantity, double unitPrice, double discount, double subtotal) {
}