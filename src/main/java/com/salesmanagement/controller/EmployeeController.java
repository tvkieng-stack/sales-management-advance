package com.salesmanagement.controller;

import com.salesmanagement.model.Employee;
import com.salesmanagement.model.User;
import com.salesmanagement.model.enums.Role;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.service.EmployeeService;
import com.salesmanagement.service.UserService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.salesmanagement.service.AuthService;
import com.salesmanagement.util.AsyncUtil;

import java.net.URL;
import java.sql.SQLException;
import java.util.ResourceBundle;

public class EmployeeController implements Initializable {

    @FXML private TextField empNameField;
    @FXML private TextField empPhoneField;
    @FXML private TextField empEmailField;
    @FXML private TextField empPositionField;
    @FXML private TextField empSalaryField;
    @FXML private TextField empAddressField;
    @FXML private Label messageLabel;

    @FXML private TableView<Employee> employeeTable;
    @FXML private TableColumn<Employee, Integer> empIdColumn;
    @FXML private TableColumn<Employee, String> empNameColumn;
    @FXML private TableColumn<Employee, String> empPhoneColumn;
    @FXML private TableColumn<Employee, String> empPositionColumn;
    @FXML private TableColumn<Employee, String> empStatusColumn;

    @FXML private ComboBox<Employee> employeeCombo;
    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private ComboBox<Role> roleCombo;

    @FXML private TableView<User> userTable;
    @FXML private TableColumn<User, Integer> userIdColumn;
    @FXML private TableColumn<User, String> userUsernameColumn;
    @FXML private TableColumn<User, String> userRoleColumn;
    @FXML private TableColumn<User, String> userEmployeeColumn;
    @FXML private TableColumn<User, String> userStatusColumn;
    @FXML private TableColumn<User, Void> userActionColumn;

    @FXML private PasswordField oldPasswordField;
    @FXML private PasswordField newPasswordField;
    @FXML private PasswordField confirmPasswordField;

    private final EmployeeService employeeService = new EmployeeService();
    private final UserService userService = new UserService();
    private final AuthService authService = new AuthService();

    private final ObservableList<Employee> employeeList = FXCollections.observableArrayList();
    private final ObservableList<User> userList = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        empIdColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        empNameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        empPhoneColumn.setCellValueFactory(new PropertyValueFactory<>("phone"));
        empPositionColumn.setCellValueFactory(new PropertyValueFactory<>("position"));
        empStatusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));
        employeeTable.setItems(employeeList);

        employeeTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) fillEmployeeForm(newVal);
        });

        userIdColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        userUsernameColumn.setCellValueFactory(new PropertyValueFactory<>("username"));
        userRoleColumn.setCellValueFactory(new PropertyValueFactory<>("roleName"));
        userEmployeeColumn.setCellValueFactory(new PropertyValueFactory<>("employeeName"));
        userStatusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));
        setupActionColumn();
        userTable.setItems(userList);

        roleCombo.setItems(FXCollections.observableArrayList(Role.values()));

        loadEmployees();
        loadUsers();
    }

    private void setupActionColumn() {
        userActionColumn.setCellFactory(col -> new TableCell<>() {
            private final Button toggleBtn = new Button();
            {
                toggleBtn.setOnAction(e -> {
                    User user = getTableView().getItems().get(getIndex());
                    try {
                        userService.toggleStatus(user);
                        loadUsers();
                    } catch (SQLException ex) {
                        messageLabel.setText("Lỗi: " + ex.getMessage());
                    }
                });
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setGraphic(null);
                } else {
                    User user = getTableView().getItems().get(getIndex());
                    toggleBtn.setText(user.getStatus() == Status.ACTIVE ? "Khóa" : "Mở khóa");
                    setGraphic(toggleBtn);
                }
            }
        });
    }

        private void loadEmployees() {
        employeeTable.setDisable(true);
        AsyncUtil.run(
                () -> {
                    try {
                        return employeeService.getAll();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    employeeList.setAll(result);
                    employeeCombo.setItems(FXCollections.observableArrayList(
                            employeeList.filtered(e -> e.getStatus() == Status.ACTIVE)));
                    employeeTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải nhân viên: " + error.getMessage());
                    employeeTable.setDisable(false);
                }
        );
    }

    private void loadUsers() {
        userTable.setDisable(true);
        AsyncUtil.run(
                () -> {
                    try {
                        return userService.getAll();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    userList.setAll(result);
                    userTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải tài khoản: " + error.getMessage());
                    userTable.setDisable(false);
                }
        );
    }

    private void fillEmployeeForm(Employee emp) {
        empNameField.setText(emp.getName());
        empPhoneField.setText(emp.getPhone());
        empEmailField.setText(emp.getEmail());
        empPositionField.setText(emp.getPosition());
        empSalaryField.setText(String.valueOf(emp.getSalary()));
        empAddressField.setText(emp.getAddress());
    }

    @FXML
    private void handleAddEmployee() {
        try {
            double salary = empSalaryField.getText().isBlank() ? 0 : Double.parseDouble(empSalaryField.getText().trim());
            employeeService.create(empNameField.getText(), empPhoneField.getText(), empEmailField.getText(),
                    empAddressField.getText(), empPositionField.getText(), salary);
            clearEmployeeForm();
            loadEmployees();
            messageLabel.setText("");
        } catch (NumberFormatException e) {
            messageLabel.setText("Lương phải là số hợp lệ.");
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdateEmployee() {
        Employee selected = employeeTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 nhân viên để cập nhật.");
            return;
        }
        try {
            selected.setName(empNameField.getText());
            selected.setPhone(empPhoneField.getText());
            selected.setEmail(empEmailField.getText());
            selected.setPosition(empPositionField.getText());
            selected.setSalary(Double.parseDouble(empSalaryField.getText().trim()));
            selected.setAddress(empAddressField.getText());
            employeeService.update(selected);
            clearEmployeeForm();
            loadEmployees();
        } catch (NumberFormatException e) {
            messageLabel.setText("Lương phải là số hợp lệ.");
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleDeactivateEmployee() {
        Employee selected = employeeTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 nhân viên để vô hiệu hóa.");
            return;
        }
        try {
            employeeService.deactivate(selected);
            clearEmployeeForm();
            loadEmployees();
        } catch (SQLException e) {
            messageLabel.setText("Lỗi: " + e.getMessage());
        }
    }

    @FXML
    private void handleCreateAccount() {
        try {
            Employee selectedEmployee = employeeCombo.getValue();
            Role role = roleCombo.getValue();
            if (role == null) {
                messageLabel.setText("Vui lòng chọn vai trò (Role).");
                return;
            }
            Integer employeeId = selectedEmployee != null ? selectedEmployee.getId() : null;

            userService.createAccount(usernameField.getText(), passwordField.getText(), role, employeeId);

            usernameField.clear();
            passwordField.clear();
            employeeCombo.setValue(null);
            roleCombo.setValue(null);
            loadUsers();
            messageLabel.setStyle("-fx-text-fill: green;");
            messageLabel.setText("Tạo tài khoản thành công.");
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleChangePassword() {
        AuthService.LoginResult result = authService.changePassword(
                oldPasswordField.getText(),
                newPasswordField.getText(),
                confirmPasswordField.getText()
        );

        if (result.isSuccess()) {
            messageLabel.setStyle("-fx-text-fill: green;");
            messageLabel.setText("Đổi mật khẩu thành công.");
            oldPasswordField.clear();
            newPasswordField.clear();
            confirmPasswordField.clear();
        } else {
            messageLabel.setStyle("-fx-text-fill: red;");
            messageLabel.setText(result.getMessage());
        }
    }

    private void clearEmployeeForm() {
        empNameField.clear();
        empPhoneField.clear();
        empEmailField.clear();
        empPositionField.clear();
        empSalaryField.clear();
        empAddressField.clear();
        employeeTable.getSelectionModel().clearSelection();
    }
}