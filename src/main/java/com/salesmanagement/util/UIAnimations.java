package com.salesmanagement.util;

import javafx.animation.FadeTransition;
import javafx.animation.ScaleTransition;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.control.Button;
import javafx.util.Duration;

public class UIAnimations {

    // Hiệu ứng phóng to nhẹ khi hover chuột vào nút - áp dụng đệ quy cho toàn bộ Button trong 1 cây node
    public static void applyButtonHoverEffect(Parent root) {
        for (Node node : root.getChildrenUnmodifiable()) {
            if (node instanceof Button button) {
                attachHoverScale(button);
            }
            if (node instanceof Parent childParent) {
                applyButtonHoverEffect(childParent);
            }
        }
    }

    private static void attachHoverScale(Button button) {
        ScaleTransition growIn = new ScaleTransition(Duration.millis(120), button);
        growIn.setToX(1.05);
        growIn.setToY(1.05);

        ScaleTransition shrinkBack = new ScaleTransition(Duration.millis(120), button);
        shrinkBack.setToX(1.0);
        shrinkBack.setToY(1.0);

        button.setOnMouseEntered(e -> {
            shrinkBack.stop();
            growIn.playFromStart();
        });
        button.setOnMouseExited(e -> {
            growIn.stop();
            shrinkBack.playFromStart();
        });
    }

    // Hiệu ứng mờ dần khi 1 màn hình/nội dung mới xuất hiện - dùng khi chuyển trang
    public static void fadeIn(Node node) {
        node.setOpacity(0);
        FadeTransition fade = new FadeTransition(Duration.millis(220), node);
        fade.setFromValue(0);
        fade.setToValue(1);
        fade.play();
    }
}