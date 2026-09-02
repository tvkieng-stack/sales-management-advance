package com.salesmanagement.service;

import com.salesmanagement.repository.ReportRepository;

import java.sql.SQLException;
import java.util.List;

public class ReportService {

    private final ReportRepository reportRepository = new ReportRepository();

    public ReportSummary getSummary(String fromDate, String toDate) throws SQLException {
        double revenue = reportRepository.getTotalRevenue(fromDate, toDate);
        double profit = reportRepository.getTotalProfit(fromDate, toDate);
        int orders = reportRepository.getOrderCount(fromDate, toDate);
        return new ReportSummary(revenue, profit, orders);
    }

    public List<Object[]> getBestSellingProducts(String fromDate, String toDate) throws SQLException {
        return reportRepository.getBestSellingProducts(fromDate, toDate, 10);
    }

    public List<Object[]> getRevenueByDay(String fromDate, String toDate) throws SQLException {
        return reportRepository.getRevenueByDay(fromDate, toDate);
    }

    public record ReportSummary(double revenue, double profit, int orderCount) {
    }
}