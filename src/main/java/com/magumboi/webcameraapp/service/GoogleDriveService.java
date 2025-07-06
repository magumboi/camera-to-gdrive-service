package com.magumboi.webcameraapp.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class GoogleDriveService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleDriveService.class);
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final String APPLICATION_NAME = "Camera to Google Drive Service";

    @Value("${google.drive.credentials.path}")
    private String credentialsPath;

    @Value("${google.drive.folder.id:}")
    private String folderId;

    @Value("${google.drive.enabled:true}")
    private boolean enabled;

    private Drive driveService;
    private ExecutorService executor;

    @PostConstruct
    public void init() {
        if (!enabled) {
            logger.info("Google Drive service is disabled");
            return;
        }
        
        try {
            HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            
            // Load credentials from service account key file
            GoogleCredentials credentials = GoogleCredentials.fromStream(
                new FileInputStream(credentialsPath)
            ).createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));

            // Build Drive service
            driveService = new Drive.Builder(
                httpTransport, 
                JSON_FACTORY, 
                new HttpCredentialsAdapter(credentials)
            ).setApplicationName(APPLICATION_NAME).build();

            executor = Executors.newFixedThreadPool(5);
            
            logger.info("Google Drive service initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize Google Drive service", e);
            throw new RuntimeException("Failed to initialize Google Drive service", e);
        }
    }

    public Mono<String> uploadPhotoToGoogleDrive(MultipartFile photo, String userName) {
        return Mono.fromFuture(CompletableFuture.supplyAsync(() -> {
            try {
                // Generate timestamp for filename
                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
                
                // Create filename with user name if provided
                String filename;
                String sanitizedUserName = null;
                if (userName != null && !userName.trim().isEmpty()) {
                    // Sanitize userName for filename (remove invalid characters)
                    sanitizedUserName = userName.trim().replaceAll("[<>:\"/\\\\|?*]", "");
                    if (sanitizedUserName.length() > 30) {
                        sanitizedUserName = sanitizedUserName.substring(0, 30);
                    }
                    filename = sanitizedUserName + "-camera-photo-" + timestamp + ".jpg";
                } else {
                    filename = "camera-photo-" + timestamp + ".jpg";
                }
                
                // Get or create user-specific folder
                String targetFolderId = getUserFolder(sanitizedUserName);
                
                // Create file metadata
                File fileMetadata = new File();
                fileMetadata.setName(filename);
                fileMetadata.setDescription("Photo taken from web camera at " + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
                
                // Set parent folder (user's folder or main folder)
                if (targetFolderId != null && !targetFolderId.trim().isEmpty()) {
                    fileMetadata.setParents(Collections.singletonList(targetFolderId));
                }

                // Create file content
                InputStreamContent mediaContent = new InputStreamContent(
                    "image/jpeg", 
                    new ByteArrayInputStream(photo.getBytes())
                );
                mediaContent.setLength(photo.getSize());

                // Upload file
                File uploadedFile = driveService.files().create(fileMetadata, mediaContent)
                    .setFields("id,name,webViewLink,webContentLink")
                    .execute();

                logger.info("Photo uploaded successfully to Google Drive: {} (ID: {})", 
                    uploadedFile.getName(), uploadedFile.getId());
                
                return uploadedFile.getId();
                
            } catch (IOException e) {
                logger.error("Failed to upload photo to Google Drive", e);
                throw new RuntimeException("Failed to upload photo to Google Drive: " + e.getMessage(), e);
            }
        }, executor));
    }

    // Overloaded method for backward compatibility
    public Mono<String> uploadPhotoToGoogleDrive(MultipartFile photo) {
        return uploadPhotoToGoogleDrive(photo, null);
    }

    public Mono<String> getFileInfo(String fileId) {
        return Mono.fromFuture(CompletableFuture.supplyAsync(() -> {
            try {
                File file = driveService.files().get(fileId)
                    .setFields("id,name,webViewLink,webContentLink,size,createdTime")
                    .execute();
                
                return String.format("File: %s, Size: %s bytes, Created: %s, View: %s", 
                    file.getName(), 
                    file.getSize(), 
                    file.getCreatedTime(), 
                    file.getWebViewLink());
                    
            } catch (IOException e) {
                logger.error("Failed to get file info from Google Drive", e);
                throw new RuntimeException("Failed to get file info: " + e.getMessage(), e);
            }
        }, executor));
    }

    /**
     * Gets or creates a folder for a specific user
     * @param userName The sanitized user name
     * @return The folder ID for the user's folder, or the main folder ID if no user name
     */
    private String getUserFolder(String userName) {
        if (userName == null || userName.trim().isEmpty()) {
            return folderId; // Return main folder if no user name
        }
        
        try {
            // First, check if the user's folder already exists
            String userFolderName = userName + "-fotos";
            String existingFolderId = findFolderByName(userFolderName, folderId);
            
            if (existingFolderId != null) {
                logger.debug("Found existing folder for user {}: {}", userName, existingFolderId);
                return existingFolderId;
            }
            
            // Create new folder for the user
            String newFolderId = createUserFolder(userFolderName, folderId);
            logger.info("Created new folder for user {}: {} (ID: {})", userName, userFolderName, newFolderId);
            return newFolderId;
            
        } catch (Exception e) {
            logger.error("Failed to get/create user folder for {}, using main folder", userName, e);
            return folderId; // Fallback to main folder
        }
    }
    
    /**
     * Finds a folder by name within a parent folder
     * @param folderName The name of the folder to find
     * @param parentFolderId The parent folder ID (null for root)
     * @return The folder ID if found, null otherwise
     */
    private String findFolderByName(String folderName, String parentFolderId) throws IOException {
        // Build query to find folder by name
        StringBuilder query = new StringBuilder("mimeType='application/vnd.google-apps.folder' and name='" + folderName + "'");
        
        if (parentFolderId != null && !parentFolderId.trim().isEmpty()) {
            query.append(" and '").append(parentFolderId).append("' in parents");
        }
        
        query.append(" and trashed=false");
        
        // Execute search
        var result = driveService.files().list()
            .setQ(query.toString())
            .setFields("files(id, name)")
            .setPageSize(1)
            .execute();
        
        var files = result.getFiles();
        if (files != null && !files.isEmpty()) {
            return files.get(0).getId();
        }
        
        return null;
    }
    
    /**
     * Creates a new folder for a user
     * @param folderName The name of the folder to create
     * @param parentFolderId The parent folder ID (null for root)
     * @return The ID of the created folder
     */
    private String createUserFolder(String folderName, String parentFolderId) throws IOException {
        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setDescription("Carpeta de fotos para el usuario - creada automáticamente");
        
        if (parentFolderId != null && !parentFolderId.trim().isEmpty()) {
            folderMetadata.setParents(Collections.singletonList(parentFolderId));
        }
        
        File createdFolder = driveService.files().create(folderMetadata)
            .setFields("id, name")
            .execute();
        
        return createdFolder.getId();
    }

    public boolean isConfigured() {
        return enabled && driveService != null && credentialsPath != null && !credentialsPath.trim().isEmpty();
    }

    public String getFolderId() {
        return folderId;
    }
}
