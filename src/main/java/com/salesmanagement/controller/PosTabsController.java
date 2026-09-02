package com.salesmanagement.controller;

import com.salesmanagement.util.UIAnimations;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Parent;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;

import java.io.IOException;
import java.net.URL;
import java.util.ResourceBundle;

/**
 * Quản lý nhiều Tab hóa đơn đồng thời (mục II.4 báo cáo phân tích).
 * Mỗi Tab load 1 bản pos.fxml RIÊNG - mỗi lần FXMLLoader.load() tạo ra 1 PosController mới,
 * và PosController giữ SaleService (giỏ hàng) là field instance -> mỗi Tab có giỏ hàng độc lập,
 * không bị ghi đè lẫn nhau khi chuyển qua lại giữa các đơn.
 */
public class PosTabsController implements Initializable {

    @FXML private TabPane orderTabPane;

    private int tabCounter = 0;

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        addNewTab(); // luôn mở sẵn 1 đơn hàng khi vào màn POS

        // Gắn hotkey TẬP TRUNG ở đây (không phải trong từng PosController) - tránh bug ghi đè giữa các Tab
        orderTabPane.sceneProperty().addListener((obs, oldScene, newScene) -> {
            if (newScene != null) {
                newScene.addEventFilter(KeyEvent.KEY_PRESSED, this::handleGlobalHotkey);
            }
        });
    }

    private void handleGlobalHotkey(KeyEvent event) {
        PosController activeController = getActiveController();
        if (activeController == null) return;

        switch (event.getCode()) {
            case F1 -> activeController.focusSearchField();
            case F9 -> activeController.triggerCheckout();
            case F4 -> activeController.openCustomerDropdown();
            case T -> {
                if (event.isControlDown()) {
                    addNewTab();
                    event.consume();
                }
            }
            default -> {}
        }
    }

    private PosController getActiveController() {
        Tab selected = orderTabPane.getSelectionModel().getSelectedItem();
        if (selected == null) return null;
        return (PosController) selected.getUserData();
    }

    @FXML
    private void handleAddTab() {
        addNewTab();
    }

    private void addNewTab() {
        try {
            tabCounter++;
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/com/salesmanagement/view/pos.fxml"));
            Parent content = loader.load();
            PosController controller = loader.getController();

            Tab tab = new Tab("Đơn " + tabCounter, content);
            tab.setUserData(controller); // lưu lại tham chiếu controller để hotkey điều khiển đúng Tab

            tab.setOnCloseRequest(event -> {
                if (orderTabPane.getTabs().size() <= 1) {
                    event.consume(); // luôn giữ lại ít nhất 1 đơn hàng đang mở
                }
            });

            orderTabPane.getTabs().add(tab);
            orderTabPane.getSelectionModel().select(tab);

            UIAnimations.applyButtonHoverEffect(content);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}