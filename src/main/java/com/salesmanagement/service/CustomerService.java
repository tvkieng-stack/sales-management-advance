package com.salesmanagement.service;

import com.salesmanagement.model.Customer;
import com.salesmanagement.repository.CustomerRepository;

import java.sql.SQLException;
import java.util.List;

public class CustomerService {

    private final CustomerRepository customerRepository = new CustomerRepository();

    public static final int PAGE_SIZE = 20;

    public PageResult<Customer> getPage(int pageIndex) throws SQLException {
        List<Customer> items = customerRepository.findPage(pageIndex, PAGE_SIZE);
        int totalRecords = customerRepository.countAll();
        int totalPages = (int) Math.ceil((double) totalRecords / PAGE_SIZE);
        return new PageResult<>(items, pageIndex, Math.max(totalPages, 1));
    }

    public record PageResult<T>(List<T> items, int pageIndex, int totalPages) {
    }

    public List<Customer> getAll() throws SQLException {
        return customerRepository.findAll();
    }

    public List<Customer> search(String keyword) throws SQLException {
        return customerRepository.search(keyword);
    }

    public void create(String name, String phone, String email, String address) throws SQLException {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên khách hàng không được để trống.");
        }
        customerRepository.save(new Customer(name.trim(), phone, email, address));
    }

    public void update(Customer customer) throws SQLException {
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new IllegalArgumentException("Tên khách hàng không được để trống.");
        }
        customerRepository.update(customer);
    }
}