package com.salesmanagement.service;

import com.salesmanagement.model.Employee;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.EmployeeRepository;

import java.sql.SQLException;
import java.util.List;

public class EmployeeService {

    private final EmployeeRepository employeeRepository = new EmployeeRepository();

    public List<Employee> getAll() throws SQLException {
        return employeeRepository.findAll();
    }

    public void create(String name, String phone, String email, String address,
                        String position, double salary) throws SQLException {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên nhân viên không được để trống.");
        }
        if (salary < 0) {
            throw new IllegalArgumentException("Lương không được âm.");
        }
        employeeRepository.save(new Employee(name.trim(), phone, email, address, position, salary));
    }

    public void update(Employee employee) throws SQLException {
        if (employee.getName() == null || employee.getName().isBlank()) {
            throw new IllegalArgumentException("Tên nhân viên không được để trống.");
        }
        employeeRepository.update(employee);
    }

    public void deactivate(Employee employee) throws SQLException {
        employee.setStatus(Status.INACTIVE);
        employeeRepository.update(employee);
    }
}