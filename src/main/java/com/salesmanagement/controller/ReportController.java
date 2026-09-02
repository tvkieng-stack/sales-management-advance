package com.salesmanagement.controller;

import com.salesmanagement.service.ReportService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.*;
import com.salesmanagement.util.AsyncUtil;

import java.net.URL;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ResourceBundle;

public class ReportController implements Initializable {

    @FXML private DatePicker fromDatePicker;
    @FXML private DatePicker toDatePicker;
    @FXML private Label revenueLabel;
    @FXML private Label profitLabel;
    @FXML private Label orderCountLabel;
    @FXML private Label messageLabel;
    @FXML private BarChart<String, Number> revenueChart;

    @FXML private TableView<Object[]> bestSellingTable;
    @FXML private TableColumn<Object[], String> productNameColumn;
    @FXML private TableColumn<Object[], Number> qtySoldColumn;
    @FXML private TableColumn<Object[], Number> revenueColumn;

    private final ReportService reportService = new ReportService();
    private static final DateTimeFormatter DB_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public void initialize(URL location, ResourceBundle resources) {
        // Mặc định: 30 ngày gần nhất
        toDatePicker.setValue(LocalDate.now());
        fromDatePicker.setValue(LocalDate.now().minusDays(30));

        productNameColumn.setCellValueFactory(data ->
                new javafx.beans.property.SimpleStringProperty((String) data.getValue()[0]));
        qtySoldColumn.setCellValueFactory(data ->
                new javafx.beans.property.SimpleIntegerProperty((Integer) data.getValue()[1]));
        revenueColumn.setCellValueFactory(data ->
                new javafx.beans.property.SimpleDoubleProperty((Double) data.getValue()[2]));

        generateReport();
    }

    @FXML
    private void handleGenerateReport() {
        generateReport();
    }

    private void generateReport() {
        LocalDate from = fromDatePicker.getValue();
        LocalDate to = toDatePicker.getValue();

        if (from == null || to == null) {
            messageLabel.setText("Vui lòng chọn đầy đủ khoảng thời gian.");
            return;
        }
        if (from.isAfter(to)) {
            messageLabel.setText("Ngày bắt đầu phải trước ngày kết thúc.");
            return;
        }

        String fromStr = from.format(DB_FORMAT);
        String toStr = to.format(DB_FORMAT);

        messageLabel.setText("Đang tải báo cáo...");
        bestSellingTable.setDisable(true);

        AsyncUtil.run(
                () -> {
                    try {
                        ReportService.ReportSummary summary = reportService.getSummary(fromStr, toStr);
                        List<Object[]> bestSelling = reportService.getBestSellingProducts(fromStr, toStr);
                        List<Object[]> revenueByDay = reportService.getRevenueByDay(fromStr, toStr);
                        return new ReportBundle(summary, bestSelling, revenueByDay);
                    } catch (SQLException e) {
                        throw new RuntimeException(e);
                    }
                },
                bundle -> {
                    revenueLabel.setText(String.format("Doanh thu: %,.0f", bundle.summary.revenue()));
                    profitLabel.setText(String.format("Lợi nhuận: %,.0f", bundle.summary.profit()));
                    orderCountLabel.setText("Số đơn: " + bundle.summary.orderCount());

                    bestSellingTable.setItems(FXCollections.observableArrayList(bundle.bestSelling));

                    XYChart.Series<String, Number> series = new XYChart.Series<>();
                    series.setName("Doanh thu");
                    for (Object[] row : bundle.revenueByDay) {
                        series.getData().add(new XYChart.Data<>((String) row[0], (Double) row[1]));
                    }
                    revenueChart.getData().setAll(series);

                    messageLabel.setText("");
                    bestSellingTable.setDisable(false);
                },
                error -> {
                    messageLabel.setText("Lỗi tải báo cáo: " + error.getMessage());
                    bestSellingTable.setDisable(false);
                }
        );
    }

    // Class nội bộ gom 3 kết quả truy vấn lại thành 1 gói duy nhất để chuyển từ luồng nền về UI Thread
    private record ReportBundle(ReportService.ReportSummary summary, List<Object[]> bestSelling, List<Object[]> revenueByDay) {
    }
}