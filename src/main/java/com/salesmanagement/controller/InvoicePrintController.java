package com.salesmanagement.controller;

import com.salesmanagement.model.Invoice;
import com.salesmanagement.model.InvoiceLineView;
import com.salesmanagement.service.InvoiceService;
import javafx.fxml.FXML;
import javafx.print.PrinterJob;
import javafx.scene.control.Label;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.sql.SQLException;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class InvoicePrintController {

    @FXML private VBox printableContent;
    @FXML private Label shopNameLabel;
    @FXML private Label invoiceCodeLabel;
    @FXML private Label dateLabel;
    @FXML private Label employeeLabel;
    @FXML private Label customerLabel;
    @FXML private VBox itemsBox;
    @FXML private Label subtotalLabel;
    @FXML private Label discountLabel;
    @FXML private Label totalLabel;
    @FXML private Label paymentMethodLabel;

    private final InvoiceService invoiceService = new InvoiceService();

    public void loadInvoice(int invoiceId) {
        try {
            Invoice invoice = invoiceService.getInvoice(invoiceId);
            List<InvoiceLineView> lines = invoiceService.getInvoiceLines(invoiceId);

            invoiceCodeLabel.setText("Hóa đơn: " + invoice.getInvoiceCode());
            dateLabel.setText("Ngày: " + invoice.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            employeeLabel.setText("Nhân viên: " + (invoice.getEmployeeName() != null ? invoice.getEmployeeName() : ""));
            customerLabel.setText("Khách hàng: " + (invoice.getCustomerName() != null ? invoice.getCustomerName() : "Khách vãng lai"));

            itemsBox.getChildren().clear();
            for (InvoiceLineView line : lines) {
                HBox row = new HBox(10);
                Label nameLbl = new Label(line.productName());
                nameLbl.setStyle("-fx-text-fill: black;");
                nameLbl.setPrefWidth(150);
                Label qtyLbl = new Label("x" + line.quantity());
                qtyLbl.setStyle("-fx-text-fill: black;");
                qtyLbl.setPrefWidth(40);
                Label subLbl = new Label(String.format("%,.0f", line.subtotal()));
                subLbl.setStyle("-fx-text-fill: black;");
                subLbl.setPrefWidth(80);
                row.getChildren().addAll(nameLbl, qtyLbl, subLbl);
                itemsBox.getChildren().add(row);
            }

            subtotalLabel.setText("Tạm tính: " + String.format("%,.0f", invoice.getSubtotal()));
            discountLabel.setText("Giảm giá: " + String.format("%,.0f", invoice.getDiscount()));
            totalLabel.setText("TỔNG CỘNG: " + String.format("%,.0f", invoice.getTotal()));
            paymentMethodLabel.setText("Thanh toán: " + invoice.getPaymentMethod());

        } catch (SQLException e) {
            invoiceCodeLabel.setText("Lỗi tải hóa đơn: " + e.getMessage());
        }
    }

    @FXML
    private void handlePrint() {
        PrinterJob job = PrinterJob.createPrinterJob();
        if (job != null) {
            boolean proceed = job.showPrintDialog(printableContent.getScene().getWindow());
            if (proceed) {
                boolean success = job.printPage(printableContent);
                if (success) {
                    job.endJob();
                }
            }
        }
    }

    @FXML
    private void handleClose() {
        Stage stage = (Stage) printableContent.getScene().getWindow();
        stage.close();
    }
}