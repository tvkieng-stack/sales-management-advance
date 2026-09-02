package com.salesmanagement.service;

import com.salesmanagement.model.Category;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.CategoryRepository;

import java.sql.SQLException;
import java.util.List;

public class CategoryService {

    private final CategoryRepository categoryRepository = new CategoryRepository();

    public List<Category> getAll() throws SQLException {
        return categoryRepository.findAll();
    }

    public void create(String name, String description) throws SQLException {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống.");
        }
        Category category = new Category(name.trim(), description);
        categoryRepository.save(category);
    }

    public void update(Category category) throws SQLException {
        if (category.getName() == null || category.getName().isBlank()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống.");
        }
        categoryRepository.update(category);
    }

    public void deactivate(Category category) throws SQLException {
        category.setStatus(Status.INACTIVE);
        categoryRepository.update(category);
    }
}