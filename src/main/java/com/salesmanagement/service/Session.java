package com.salesmanagement.service;

import com.salesmanagement.model.User;

public class Session {

    private static User currentUser;

    private Session() {}

    public static void login(User user) {
        currentUser = user;
    }

    public static void logout() {
        currentUser = null;
    }

    public static User getCurrentUser() {
        return currentUser;
    }

    public static boolean isLoggedIn() {
        return currentUser != null;
    }

    public static boolean hasRole(String roleName) {
        return isLoggedIn() && currentUser.getRoleName().equalsIgnoreCase(roleName);
    }

    public static boolean isAdminOrManager() {
        return hasRole("ADMIN") || hasRole("MANAGER");
    }
}