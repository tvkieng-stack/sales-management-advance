package com.salesmanagement.model;

import java.time.LocalDateTime;

public class Customer {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private int loyaltyPoints;
    private LocalDateTime createdAt;

    public Customer() {}

    public Customer(String name, String phone, String email, String address) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.loyaltyPoints = 0;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public int getLoyaltyPoints() { return loyaltyPoints; }
    public void setLoyaltyPoints(int loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        // Hiển thị đẹp trong ComboBox ở POS: "Tên - SĐT"
        return phone != null && !phone.isBlank() ? name + " - " + phone : name;
    }
}