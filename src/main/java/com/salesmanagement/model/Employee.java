package com.salesmanagement.model;

import com.salesmanagement.model.enums.Status;
import java.time.LocalDateTime;

public class Employee {
    private Integer id;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String position;
    private double salary;
    private Status status;
    private LocalDateTime createdAt;

    public Employee() {
    }

    public Employee(String name, String phone, String email, String address,
                     String position, double salary) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.address = address;
        this.position = position;
        this.salary = salary;
        this.status = Status.ACTIVE;
    }

    // Getters & Setters
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

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public double getSalary() { return salary; }
    public void setSalary(double salary) { this.salary = salary; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return name; // để hiển thị đẹp trong ComboBox JavaFX
    }
}