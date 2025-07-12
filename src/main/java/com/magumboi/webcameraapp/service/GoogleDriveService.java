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

    @Value("${google.drive.impersonation.enabled:false}")
    private boolean impersonationEnabled;

    @Value("${google.drive.impersonation.domain:}")
    private String impersonationDomain;

    @Value("${google.drive.impersonation.default-user:}")
    private String defaultUserEmail;

    private Drive driveService;
    private ExecutorService executor;
    private GoogleCredentials baseCredentials;

    @PostConstruct
    public void init() {
        if (!enabled) {
            logger.info("Google Drive service is disabled");
            return;
        }
        
        try {
            // Load base credentials from service account key file
            baseCredentials = GoogleCredentials.fromStream(
                new FileInputStream(credentialsPath)
            ).createScoped(Collections.singleton(DriveScopes.DRIVE_FILE));

            // Create default Drive service (either with impersonation or service account)
            if (impersonationEnabled && defaultUserEmail != null && !defaultUserEmail.trim().isEmpty()) {
                driveService = createDriveServiceForUser(defaultUserEmail.trim());
                logger.info("Google Drive service initialized with user impersonation for: {}", defaultUserEmail);
            } else {
                driveService = createDriveServiceWithServiceAccount();
                logger.info("Google Drive service initialized with service account");
            }

            executor = Executors.newFixedThreadPool(5);
            
            logger.info("Google Drive service initialized successfully");
        } catch (Exception e) {
            logger.error("Failed to initialize Google Drive service", e);
            throw new RuntimeException("Failed to initialize Google Drive service", e);
        }
    }

    public Mono<String> uploadPhotoToGoogleDrive(MultipartFile photo, String userName) {
        return uploadPhotoToGoogleDrive(photo, userName, null);
    }

    public Mono<String> uploadPhotoToGoogleDrive(MultipartFile photo, String userName, String userEmail) {
        return Mono.fromFuture(CompletableFuture.supplyAsync(() -> {
            try {
                // Get the appropriate Drive service (impersonated or default)
                Drive targetDriveService = getDriveServiceForUser(userEmail);
                
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
                String targetFolderId = getUserFolder(sanitizedUserName, targetDriveService);
                
                // Create file metadata
                File fileMetadata = new File();
                fileMetadata.setName(filename);
                String description = "Photo taken from web camera at " + 
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
                if (userEmail != null && !userEmail.trim().isEmpty()) {
                    description += " (uploaded to: " + userEmail + ")";
                }
                fileMetadata.setDescription(description);
                
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

                // Upload file using the target Drive service
                File uploadedFile = targetDriveService.files().create(fileMetadata, mediaContent)
                    .setFields("id,name,webViewLink,webContentLink")
                    .execute();

                String logMessage = "Photo uploaded successfully to Google Drive: {} (ID: {})";
                if (userEmail != null && !userEmail.trim().isEmpty()) {
                    logMessage += " for user: " + userEmail;
                }
                logger.info(logMessage, uploadedFile.getName(), uploadedFile.getId());
                
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
     * @param targetDriveService The Drive service to use (could be impersonated)
     * @return The folder ID for the user's folder, or the main folder ID if no user name
     */
    private String getUserFolder(String userName, Drive targetDriveService) {
        if (userName == null || userName.trim().isEmpty()) {
            return folderId; // Return main folder if no user name
        }
        
        try {
            // First, check if the user's folder already exists
            String userFolderName = userName + "-fotos";
            String existingFolderId = findFolderByName(userFolderName, folderId, targetDriveService);
            
            if (existingFolderId != null) {
                logger.debug("Found existing folder for user {}: {}", userName, existingFolderId);
                return existingFolderId;
            }
            
            // Create new folder for the user
            String newFolderId = createUserFolder(userFolderName, folderId, targetDriveService);
            logger.info("Created new folder for user {}: {} (ID: {})", userName, userFolderName, newFolderId);
            return newFolderId;
            
        } catch (Exception e) {
            logger.error("Failed to get/create user folder for {}, using main folder", userName, e);
            return folderId; // Fallback to main folder
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    private String getUserFolder(String userName) {
        return getUserFolder(userName, driveService);
    }
    
    /**
     * Finds a folder by name within a parent folder
     * @param folderName The name of the folder to find
     * @param parentFolderId The parent folder ID (null for root)
     * @param targetDriveService The Drive service to use
     * @return The folder ID if found, null otherwise
     */
    private String findFolderByName(String folderName, String parentFolderId, Drive targetDriveService) throws IOException {
        // Build query to find folder by name
        StringBuilder query = new StringBuilder("mimeType='application/vnd.google-apps.folder' and name='" + folderName + "'");
        
        if (parentFolderId != null && !parentFolderId.trim().isEmpty()) {
            query.append(" and '").append(parentFolderId).append("' in parents");
        }
        
        query.append(" and trashed=false");
        
        // Execute search
        var result = targetDriveService.files().list()
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
     * Legacy method for backward compatibility
     */
    private String findFolderByName(String folderName, String parentFolderId) throws IOException {
        return findFolderByName(folderName, parentFolderId, driveService);
    }
    
    /**
     * Creates a new folder for a user
     * @param folderName The name of the folder to create
     * @param parentFolderId The parent folder ID (null for root)
     * @param targetDriveService The Drive service to use
     * @return The ID of the created folder
     */
    private String createUserFolder(String folderName, String parentFolderId, Drive targetDriveService) throws IOException {
        File folderMetadata = new File();
        folderMetadata.setName(folderName);
        folderMetadata.setMimeType("application/vnd.google-apps.folder");
        folderMetadata.setDescription("Carpeta de fotos para el usuario - creada automáticamente");
        
        if (parentFolderId != null && !parentFolderId.trim().isEmpty()) {
            folderMetadata.setParents(Collections.singletonList(parentFolderId));
        }
        
        File createdFolder = targetDriveService.files().create(folderMetadata)
            .setFields("id, name")
            .execute();
        
        return createdFolder.getId();
    }

    /**
     * Legacy method for backward compatibility
     */
    private String createUserFolder(String folderName, String parentFolderId) throws IOException {
        return createUserFolder(folderName, parentFolderId, driveService);
    }

    /**
     * Creates a Drive service with service account credentials (no impersonation)
     */
    private Drive createDriveServiceWithServiceAccount() throws Exception {
        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        return new Drive.Builder(
            httpTransport, 
            JSON_FACTORY, 
            new HttpCredentialsAdapter(baseCredentials)
        ).setApplicationName(APPLICATION_NAME).build();
    }

    /**
     * Creates a Drive service with user impersonation
     */
    private Drive createDriveServiceForUser(String userEmail) throws Exception {
        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        // Create impersonated credentials
        GoogleCredentials impersonatedCredentials = baseCredentials.createDelegated(userEmail);
        
        return new Drive.Builder(
            httpTransport, 
            JSON_FACTORY, 
            new HttpCredentialsAdapter(impersonatedCredentials)
        ).setApplicationName(APPLICATION_NAME).build();
    }

    /**
     * Gets a Drive service for a specific user email
     * If impersonation is enabled, creates a new service for that user
     * Otherwise, returns the default service
     */
    private Drive getDriveServiceForUser(String userEmail) {
        if (!impersonationEnabled || userEmail == null || userEmail.trim().isEmpty()) {
            return driveService; // Use default service
        }
        
        try {
            // Validate email format and domain
            String cleanEmail = userEmail.trim().toLowerCase();
            if (!isValidEmail(cleanEmail)) {
                logger.warn("Invalid email format: {}, using default service", userEmail);
                return driveService;
            }
            
            if (!cleanEmail.endsWith("@" + impersonationDomain)) {
                logger.warn("Email {} not in allowed domain {}, using default service", 
                    cleanEmail, impersonationDomain);
                return driveService;
            }
            
            // Create impersonated service for this user
            return createDriveServiceForUser(cleanEmail);
            
        } catch (Exception e) {
            logger.error("Failed to create impersonated Drive service for user: {}, using default service", 
                userEmail, e);
            return driveService; // Fallback to default service
        }
    }

    /**
     * Simple email validation
     */
    private boolean isValidEmail(String email) {
        return email != null && email.contains("@") && email.contains(".") && 
               email.length() > 5 && !email.startsWith("@") && !email.endsWith("@");
    }

    public boolean isConfigured() {
        return enabled && driveService != null && credentialsPath != null && !credentialsPath.trim().isEmpty();
    }

    public String getFolderId() {
        return folderId;
    }

    public boolean isImpersonationEnabled() {
        return impersonationEnabled;
    }

    public String getImpersonationDomain() {
        return impersonationDomain;
    }

    public String getDefaultUserEmail() {
        return defaultUserEmail;
    }
}
