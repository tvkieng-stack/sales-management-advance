package com.salesmanagement.service;

import com.salesmanagement.TestDatabaseSetup;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthServiceTest {

    private AuthService authService;

    @BeforeEach
    void setUp() {
        TestDatabaseSetup.initFreshDatabase(); // đã tự seed admin/admin123 (xem DatabaseInitializer)
        authService = new AuthService();
    }

    // TC01 - Login đúng
    @Test
    void login_withCorrectCredentials_shouldSucceed() {
        AuthService.LoginResult result = authService.login("admin", "admin123");

        assertTrue(result.isSuccess());
        assertNotNull(result.getUser());
        assertEquals("admin", result.getUser().getUsername());
    }

    // TC02 - Login sai
    @Test
    void login_withWrongPassword_shouldFail() {
        AuthService.LoginResult result = authService.login("admin", "wrong_password");

        assertFalse(result.isSuccess());
        assertNull(result.getUser());
    }

    @Test
    void login_withNonExistentUsername_shouldFail() {
        AuthService.LoginResult result = authService.login("khong_ton_tai", "123456");

        assertFalse(result.isSuccess());
        assertEquals("Sai tên đăng nhập hoặc mật khẩu.", result.getMessage());
    }

    @Test
    void login_withBlankFields_shouldFail() {
        AuthService.LoginResult result = authService.login("", "");

        assertFalse(result.isSuccess());
    }
}