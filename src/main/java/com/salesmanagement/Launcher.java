package com.salesmanagement;

// Lớp trung gian bắt buộc để đóng gói JAR chạy được với "java -jar".
// Nếu để Main-Class trỏ thẳng vào Main.java (kế thừa javafx.application.Application),
// JVM sẽ báo lỗi "JavaFX runtime components are missing" dù đã gộp đủ thư viện trong JAR.
// Đây là workaround chuẩn được cộng đồng JavaFX khuyến nghị.
public class Launcher {
    public static void main(String[] args) {
        Main.main(args);
    }
}