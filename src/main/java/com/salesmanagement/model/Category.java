package com.salesmanagement.model;

import com.salesmanagement.model.enums.Status;

public class Category {
    private Integer id;
    private String name;
    private String description;
    private Status status;

    public Category() {}

    public Category(String name, String description) {
        this.name = name;
        this.description = description;
        this.status = Status.ACTIVE;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    @Override
    public String toString() { return name; }
}