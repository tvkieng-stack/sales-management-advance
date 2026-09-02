package com.salesmanagement;

import com.salesmanagement.database.DatabaseInitializer;
import com.salesmanagement.util.SceneManager;
import javafx.application.Application;
import javafx.stage.Stage;

public class Main extends Application {

    @Override
    public void init() {
        DatabaseInitializer.initialize();
    }

    @Override
    public void start(Stage primaryStage) {
        SceneManager.setPrimaryStage(primaryStage);
        SceneManager.switchTo("/com/salesmanagement/view/login.fxml",
                "Sales Management System - Login", 500, 400);
        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}