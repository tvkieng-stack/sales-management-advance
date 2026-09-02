package com.salesmanagement.controller;

import com.salesmanagement.service.AuthService;
import com.salesmanagement.util.SceneManager;
import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.TextField;

public class LoginController {

    @FXML private TextField usernameField;
    @FXML private PasswordField passwordField;
    @FXML private Button loginButton;
    @FXML private Label errorLabel;

    private final AuthService authService = new AuthService();

    @FXML
    private void handleLogin() {
        errorLabel.setText("");
        String username = usernameField.getText();
        String password = passwordField.getText();

        AuthService.LoginResult result = authService.login(username, password);

        if (result.isSuccess()) {
            SceneManager.switchTo("/com/salesmanagement/view/dashboard.fxml",
                    "Sales Management System - Dashboard", 900, 600);
        } else {
            errorLabel.setText(result.getMessage());
        }
    }
}