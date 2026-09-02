package com.salesmanagement.controller;

import com.salesmanagement.model.Product;
import com.salesmanagement.service.ProductService;
import com.salesmanagement.service.ReportService;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;

import java.net.URL;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ResourceBundle;

public class DashboardHomeController implements Initializable {

    @FXML private Label todayRevenueLabel;
    @FXML private Label todayOrdersLabel;
    @FXML private Label todayProfitLabel;
    @FXML private ListView<String> bestSellingList;
    @FXML private ListView<String> lowStockList;

    private final ReportService reportService = new ReportService();
    private final ProductService productService = new ProductService();

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        loadTodaySummary();
        loadBestSelling();
        loadLowStock();
    }

    private void loadTodaySummary() {
        try {
            String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            ReportService.ReportSummary summary = reportService.getSummary(today, today);
            todayRevenueLabel.setText(String.format("%,.0f", summary.revenue()));
            todayOrdersLabel.setText(String.valueOf(summary.orderCount()));
            todayProfitLabel.setText(String.format("%,.0f", summary.profit()));
        } catch (SQLException e) {
            todayRevenueLabel.setText("Lỗi");
        }
    }

    private void loadBestSelling() {
        try {
            String from = LocalDate.now().minusDays(30).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String to = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            List<Object[]> rows = reportService.getBestSellingProducts(from, to);

            List<String> display = rows.stream()
                    .map(r -> r[0] + " — SL: " + r[1] + " — DT: " + String.format("%,.0f", (Double) r[2]))
                    .toList();
            bestSellingList.setItems(FXCollections.observableArrayList(display));
            if (display.isEmpty()) {
                bestSellingList.setItems(FXCollections.observableArrayList("Chưa có dữ liệu bán hàng."));
            }
        } catch (SQLException e) {
            bestSellingList.setItems(FXCollections.observableArrayList("Lỗi tải dữ liệu."));
        }
    }

    private void loadLowStock() {
        try {
            List<Product> lowStock = productService.findLowStock();
            List<String> display = lowStock.stream()
                    .map(p -> p.getName() + " — Tồn: " + p.getStockQuantity() + " (tối thiểu: " + p.getMinimumStock() + ")")
                    .toList();
            lowStockList.setItems(FXCollections.observableArrayList(display));
            if (display.isEmpty()) {
                lowStockList.setItems(FXCollections.observableArrayList("Không có sản phẩm sắp hết hàng."));
            }
        } catch (SQLException e) {
            lowStockList.setItems(FXCollections.observableArrayList("Lỗi tải dữ liệu."));
        }
    }
}