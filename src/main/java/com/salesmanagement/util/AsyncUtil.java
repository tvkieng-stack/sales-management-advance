package com.salesmanagement.util;

import javafx.application.Platform;
import javafx.concurrent.Task;

import java.util.function.Consumer;
import java.util.function.Supplier;

/**
 * Helper chuẩn hóa việc chạy truy vấn Database trên luồng nền (Background Thread),
 * tránh block UI Thread - đúng giải pháp mục II.1 trong báo cáo phân tích.
 *
 * Nguyên tắc: mọi thứ trong "backgroundWork" chạy trên thread riêng (không được đụng vào UI).
 * "onSuccess" và "onError" luôn được gọi lại trên UI Thread (JavaFX Application Thread) - an toàn để cập nhật control.
 */
public class AsyncUtil {

    public static <T> void run(Supplier<T> backgroundWork, Consumer<T> onSuccess, Consumer<Throwable> onError) {
        Task<T> task = new Task<>() {
            @Override
            protected T call() {
                return backgroundWork.get();
            }
        };

        task.setOnSucceeded(e -> onSuccess.accept(task.getValue()));
        task.setOnFailed(e -> {
            Throwable ex = task.getException();
            if (ex != null) ex.printStackTrace();
            if (onError != null) {
                onError.accept(ex);
            }
        });

        Thread thread = new Thread(task);
        thread.setDaemon(true);
        thread.start();
    }

    // Overload không cần xử lý lỗi riêng - in ra console mặc định
    public static <T> void run(Supplier<T> backgroundWork, Consumer<T> onSuccess) {
        run(backgroundWork, onSuccess, null);
    }
}