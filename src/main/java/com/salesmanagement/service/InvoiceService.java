package com.salesmanagement.service;

import com.salesmanagement.model.Invoice;
import com.salesmanagement.model.InvoiceLineView;
import com.salesmanagement.repository.InvoiceRepository;

import java.sql.SQLException;
import java.util.List;

public class InvoiceService {

    private final InvoiceRepository invoiceRepository = new InvoiceRepository();

    public Invoice getInvoice(int id) throws SQLException {
        return invoiceRepository.findById(id);
    }

    public List<InvoiceLineView> getInvoiceLines(int id) throws SQLException {
        return invoiceRepository.findDetailsByInvoiceId(id);
    }
}