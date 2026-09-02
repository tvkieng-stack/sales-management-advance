package com.salesmanagement.controller;

import com.salesmanagement.model.Promotion;
import com.salesmanagement.model.enums.DiscountType;
import com.salesmanagement.service.PromotionService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import com.salesmanagement.util.AsyncUtil;

import java.net.URL;
import java.sql.SQLException;
import java.util.ResourceBundle;

public class PromotionController implements Initializable {

    @FXML private TextField nameField;
    @FXML private TextField descriptionField;
    @FXML private ComboBox<DiscountType> typeCombo;
    @FXML private TextField valueField;
    @FXML private DatePicker startDatePicker;
    @FXML private DatePicker endDatePicker;
    @FXML private Label messageLabel;

    @FXML private TableView<Promotion> promotionTable;
    @FXML private TableColumn<Promotion, Integer> idColumn;
    @FXML private TableColumn<Promotion, String> nameColumn;
    @FXML private TableColumn<Promotion, String> typeColumn;
    @FXML private TableColumn<Promotion, Double> valueColumn;
    @FXML private TableColumn<Promotion, String> startDateColumn;
    @FXML private TableColumn<Promotion, String> endDateColumn;
    @FXML private TableColumn<Promotion, String> statusColumn;

    private final PromotionService promotionService = new PromotionService();
    private final ObservableList<Promotion> promotionList = FXCollections.observableArrayList();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        idColumn.setCellValueFactory(new PropertyValueFactory<>("id"));
        nameColumn.setCellValueFactory(new PropertyValueFactory<>("name"));
        typeColumn.setCellValueFactory(new PropertyValueFactory<>("discountType"));
        valueColumn.setCellValueFactory(new PropertyValueFactory<>("discountValue"));
        startDateColumn.setCellValueFactory(new PropertyValueFactory<>("startDate"));
        endDateColumn.setCellValueFactory(new PropertyValueFactory<>("endDate"));
        statusColumn.setCellValueFactory(new PropertyValueFactory<>("status"));

        promotionTable.setItems(promotionList);
        typeCombo.setItems(FXCollections.observableArrayList(DiscountType.values()));

        promotionTable.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) fillForm(newVal);
        });

        loadData();
    }

    private void loadData() {
        promotionTable.setDisable(true);
        messageLabel.setText("Đang tải...");

        AsyncUtil.run(
                () -> {
                    try {
                        return promotionService.getAll();
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                result -> {
                    promotionList.setAll(result);
                    messageLabel.setText("");
                    promotionTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải dữ liệu: " + error.getMessage());
                    promotionTable.setDisable(false);
                }
        );
    }

    private void fillForm(Promotion p) {
        nameField.setText(p.getName());
        descriptionField.setText(p.getDescription());
        typeCombo.setValue(p.getDiscountType());
        valueField.setText(String.valueOf(p.getDiscountValue()));
        startDatePicker.setValue(p.getStartDate());
        endDatePicker.setValue(p.getEndDate());
    }

    @FXML
    private void handleAdd() {
        try {
            double value = Double.parseDouble(valueField.getText().trim());
            promotionService.create(nameField.getText(), descriptionField.getText(), typeCombo.getValue(),
                    value, startDatePicker.getValue(), endDatePicker.getValue());
            clearForm();
            loadData();
        } catch (NumberFormatException e) {
            messageLabel.setText("Giá trị giảm giá phải là số hợp lệ.");
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleUpdate() {
        Promotion selected = promotionTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 chương trình để cập nhật.");
            return;
        }
        try {
            selected.setName(nameField.getText());
            selected.setDescription(descriptionField.getText());
            selected.setDiscountType(typeCombo.getValue());
            selected.setDiscountValue(Double.parseDouble(valueField.getText().trim()));
            selected.setStartDate(startDatePicker.getValue());
            selected.setEndDate(endDatePicker.getValue());
            promotionService.update(selected);
            clearForm();
            loadData();
        } catch (NumberFormatException e) {
            messageLabel.setText("Giá trị giảm giá phải là số hợp lệ.");
        } catch (IllegalArgumentException | SQLException e) {
            messageLabel.setText(e.getMessage());
        }
    }

    @FXML
    private void handleDeactivate() {
        Promotion selected = promotionTable.getSelectionModel().getSelectedItem();
        if (selected == null) {
            messageLabel.setText("Vui lòng chọn 1 chương trình để vô hiệu hóa.");
            return;
        }
        try {
            promotionService.deactivate(selected);
            clearForm();
            loadData();
        } catch (SQLException e) {
            messageLabel.setText("Lỗi: " + e.getMessage());
        }
    }

    @FXML
    private void handleRefresh() {
        clearForm();
        loadData();
    }

    private void clearForm() {
        nameField.clear();
        descriptionField.clear();
        typeCombo.setValue(null);
        valueField.clear();
        startDatePicker.setValue(null);
        endDatePicker.setValue(null);
        promotionTable.getSelectionModel().clearSelection();
    }
}