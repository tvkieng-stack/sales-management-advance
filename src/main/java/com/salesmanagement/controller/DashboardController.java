package com.salesmanagement.controller;

import com.salesmanagement.model.User;
import com.salesmanagement.service.Session;
import com.salesmanagement.util.SceneManager;
import com.salesmanagement.util.UIAnimations;

import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.layout.VBox;


import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;

public class DashboardController implements Initializable {

    @FXML private ListView<String> menuList;
    @FXML private Label welcomeLabel;
    @FXML private Label contentLabel;
    @FXML private VBox contentArea;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        User user = Session.getCurrentUser();
        welcomeLabel.setText("Xin chào, " + user.getUsername() + " (" + user.getRoleName() + ")");
        contentLabel.setText("Chọn một chức năng ở menu bên trái.");

        menuList.setItems(FXCollections.observableArrayList(buildMenuForRole(user.getRoleName())));

        menuList.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                loadContent(newVal);
            }
        });
        menuList.getSelectionModel().select("Dashboard");
        
    }

    private void loadContent(String menuItem) {
        if (menuItem.equals("Dashboard")) {
            try {
                FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/salesmanagement/view/dashboard_home.fxml"));
                Node view = loader.load();
                contentArea.getChildren().setAll(view);
                com.salesmanagement.util.UIAnimations.applyButtonHoverEffect((javafx.scene.Parent) view);
                com.salesmanagement.util.UIAnimations.fadeIn(view);
            } catch (IOException e) {
                e.printStackTrace();
                contentLabel.setText("Lỗi tải Dashboard: " + e.getMessage());
                contentArea.getChildren().setAll(contentLabel);
            }
            return;
        }

        String fxmlPath = switch (menuItem) {
            case "Danh mục" -> "/com/salesmanagement/view/category.fxml";
            case "Sản phẩm" -> "/com/salesmanagement/view/product.fxml";
            case "Bán hàng (POS)" -> "/com/salesmanagement/view/pos_tabs.fxml";
            case "Nhà cung cấp" -> "/com/salesmanagement/view/supplier.fxml";
            case "Kho / Nhập hàng" -> "/com/salesmanagement/view/inventory.fxml";
            case "Báo cáo" -> "/com/salesmanagement/view/report.fxml";
            case "Backup/Restore" -> "/com/salesmanagement/view/backup.fxml";
            case "Khách hàng" -> "/com/salesmanagement/view/customer.fxml";
            case "Nhân viên / Tài khoản" -> "/com/salesmanagement/view/employee.fxml";
            case "Khuyến mãi" -> "/com/salesmanagement/view/promotion.fxml";
            default -> null;
        };

        if (fxmlPath == null) {
            contentLabel.setText(menuItem + " - chưa xây dựng ở bước hiện tại.");
            contentArea.getChildren().setAll(contentLabel);
            return;
        }

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource(fxmlPath));
            Node view = loader.load();
            contentArea.getChildren().setAll(view);
            com.salesmanagement.util.UIAnimations.applyButtonHoverEffect((javafx.scene.Parent) view);
            com.salesmanagement.util.UIAnimations.fadeIn(view);
        } catch (IOException e) {
            e.printStackTrace();
            contentLabel.setText("Lỗi tải giao diện: " + e.getMessage());
            contentArea.getChildren().setAll(contentLabel);
        }
    }

    private List<String> buildMenuForRole(String role) {
        List<String> menu = new ArrayList<>();
        menu.add("Dashboard");
        menu.add("Bán hàng (POS)");
        menu.add("Danh mục");
        menu.add("Sản phẩm");
        menu.add("Khách hàng");
        

        if (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("MANAGER")) {
            menu.add("Kho / Nhập hàng");
            menu.add("Nhà cung cấp");
            menu.add("Khuyến mãi");
            menu.add("Báo cáo");
            menu.add("Backup/Restore");
        }

        if (role.equalsIgnoreCase("ADMIN")) {
            menu.add("Nhân viên / Tài khoản");
        }

        return menu;
    }

    @FXML
    private void handleLogout() {
        Session.logout();
        SceneManager.switchTo("/com/salesmanagement/view/login.fxml",
                "Sales Management System - Login", 500, 400);
    }
}