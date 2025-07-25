package com.magumboi.webcameraapp.controller;

import com.magumboi.webcameraapp.service.GoogleDriveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PhotoUploadController {

    @Autowired
    private GoogleDriveService googleDriveService;

    @PostMapping("/upload-photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "userName", required = false) String userName,
            @RequestParam(value = "userEmail", required = false) String userEmail) {
        // Validate file
        if (file == null || file.isEmpty()) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "No file provided");
            return ResponseEntity.badRequest().body(response);
        }

        // Check if it's an image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "File must be an image");
            return ResponseEntity.badRequest().body(response);
        }

        // Upload to Google Drive (blocking call)
        try {
            String fileId = googleDriveService.uploadPhotoToGoogleDrive(file, userName, userEmail).block();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Photo uploaded successfully to Google Drive");
            response.put("fileId", fileId);
            
            // Log the upload with user information
            if (userName != null && !userName.trim().isEmpty()) {
                response.put("uploadedFor", userName.trim());
            }
            
            // Log the target user email if provided
            if (userEmail != null && !userEmail.trim().isEmpty()) {
                response.put("uploadedToAccount", userEmail.trim());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception error) {
            Map<String, String> response = new HashMap<>();
            
            // Check if it's a Google Drive configuration error
            if (error instanceof IllegalStateException && 
                error.getMessage().contains("not configured")) {
                response.put("error", "Google Drive no configurado. Las credenciales de Google Drive no están configuradas en el servidor.");
                return ResponseEntity.badRequest().body(response);
            }
            
            response.put("error", "Failed to upload photo to Google Drive: " + error.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/drive-status")
    public ResponseEntity<Map<String, Object>> getGoogleDriveStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("configured", googleDriveService.isConfigured());
        status.put("folderId", googleDriveService.getFolderId());
        status.put("service", "Google Drive");
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/impersonation-status")
    public ResponseEntity<Map<String, Object>> getImpersonationStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("impersonationEnabled", googleDriveService.isImpersonationEnabled());
        status.put("domain", googleDriveService.getImpersonationDomain());
        status.put("defaultUser", googleDriveService.getDefaultUserEmail());
        status.put("configured", googleDriveService.isConfigured());
        
        return ResponseEntity.ok(status);
    }
}
