package com.salesmanagement.model;

import com.salesmanagement.model.enums.DiscountType;
import com.salesmanagement.model.enums.Status;
import java.time.LocalDate;

public class Promotion {
    private Integer id;
    private String name;
    private String description;
    private DiscountType discountType;
    private double discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Status status;

    public Promotion() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }

    public double getDiscountValue() { return discountValue; }
    public void setDiscountValue(double discountValue) { this.discountValue = discountValue; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    // Kiểm tra khuyến mãi có đang hiệu lực tại thời điểm hiện tại không (còn ACTIVE + trong khoảng ngày)
    public boolean isCurrentlyValid() {
        LocalDate today = LocalDate.now();
        return status == Status.ACTIVE
                && !today.isBefore(startDate)
                && !today.isAfter(endDate);
    }

    // Tính số tiền giảm dựa trên subtotal của hóa đơn
    public double calculateDiscount(double subtotal) {
        if (discountType == DiscountType.PERCENTAGE) {
            return subtotal * (discountValue / 100.0);
        }
        return Math.min(discountValue, subtotal); // AMOUNT - không giảm quá subtotal
    }

    @Override
    public String toString() {
        String valueDisplay = discountType == DiscountType.PERCENTAGE
                ? discountValue + "%" : String.format("%,.0f đ", discountValue);
        return name + " (-" + valueDisplay + ")";
    }
}