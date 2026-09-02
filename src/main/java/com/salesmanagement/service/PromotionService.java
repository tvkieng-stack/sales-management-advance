package com.salesmanagement.service;

import com.salesmanagement.model.Promotion;
import com.salesmanagement.model.enums.DiscountType;
import com.salesmanagement.model.enums.Status;
import com.salesmanagement.repository.PromotionRepository;

import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;

public class PromotionService {

    private final PromotionRepository promotionRepository = new PromotionRepository();

    public List<Promotion> getAll() throws SQLException {
        return promotionRepository.findAll();
    }

    public List<Promotion> getCurrentlyValid() throws SQLException {
        return promotionRepository.findCurrentlyValid();
    }

    public void create(String name, String description, DiscountType type, double value,
                        LocalDate startDate, LocalDate endDate) throws SQLException {
        validate(name, type, value, startDate, endDate);
        Promotion p = new Promotion();
        p.setName(name.trim());
        p.setDescription(description);
        p.setDiscountType(type);
        p.setDiscountValue(value);
        p.setStartDate(startDate);
        p.setEndDate(endDate);
        p.setStatus(Status.ACTIVE);
        promotionRepository.save(p);
    }

    public void update(Promotion promotion) throws SQLException {
        validate(promotion.getName(), promotion.getDiscountType(), promotion.getDiscountValue(),
                promotion.getStartDate(), promotion.getEndDate());
        promotionRepository.update(promotion);
    }

    public void deactivate(Promotion promotion) throws SQLException {
        promotionRepository.deactivate(promotion.getId());
    }

    private void validate(String name, DiscountType type, double value, LocalDate start, LocalDate end) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Tên chương trình khuyến mãi không được để trống.");
        }
        if (type == null) {
            throw new IllegalArgumentException("Vui lòng chọn loại giảm giá.");
        }
        if (value < 0) {
            throw new IllegalArgumentException("Giá trị giảm giá không được âm.");
        }
        if (type == DiscountType.PERCENTAGE && value > 100) {
            throw new IllegalArgumentException("Giảm giá theo % không được vượt quá 100.");
        }
        if (start == null || end == null) {
            throw new IllegalArgumentException("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("Ngày bắt đầu phải trước ngày kết thúc.");
        }
    }
}