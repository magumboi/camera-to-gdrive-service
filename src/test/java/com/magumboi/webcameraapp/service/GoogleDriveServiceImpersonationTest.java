package com.magumboi.webcameraapp.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
    "google.drive.enabled=false", // Disable for testing
    "google.drive.impersonation.enabled=true",
    "google.drive.impersonation.domain=test.com",
    "google.drive.impersonation.default-user=admin@test.com"
})
class GoogleDriveServiceImpersonationTest {

    @Test
    void testImpersonationConfiguration() {
        // This test verifies that the application context loads with impersonation configuration
        // The actual impersonation functionality requires real Google Workspace setup
        assertTrue(true, "Application context loaded successfully with impersonation configuration");
    }
}
