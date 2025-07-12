# Google Drive User Impersonation Setup Guide

This guide explains how to set up user impersonation for the Camera to Google Drive Service. With user impersonation enabled, the service can upload photos directly to specific users' Google Drive accounts instead of using a shared service account.

## 🔧 Prerequisites

1. **Google Workspace Domain**: You must have a Google Workspace (formerly G Suite) domain
2. **Domain Administrator Access**: Required for setting up domain-wide delegation
3. **Service Account**: Already created for the camera service

## 📋 Setup Steps

### 1. Enable Domain-Wide Delegation

#### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Find your service account (the one you're using for the camera service)
5. Click on the service account email
6. Go to the **Details** tab
7. In the **Advanced settings** section, check **Enable Google Workspace Domain-wide Delegation**
8. Optionally, add a product name (e.g., "Camera Service")
9. Copy the **Client ID** (you'll need this for the next step)

#### In Google Workspace Admin Console:

1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to **Security** > **API Controls** > **Domain-wide Delegation**
3. Click **Add new**
4. Enter the **Client ID** from the previous step
5. Add the required OAuth scopes:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
6. Click **Authorize**

### 2. Configure Application Properties

Update your `application.properties` file:

```properties
# Google Drive configuration
google.drive.credentials.path=src/main/resources/service-account-key.json
google.drive.folder.id=

# User impersonation configuration
google.drive.impersonation.enabled=true
google.drive.impersonation.domain=your-domain.com
google.drive.impersonation.default-user=default@your-domain.com
```

**Replace:**
- `your-domain.com` with your actual Google Workspace domain
- `default@your-domain.com` with a default user email from your domain

### 3. Verify Setup

1. Start the application
2. Check the logs for successful initialization:
   ```
   Google Drive service initialized with user impersonation for: default@your-domain.com
   ```
3. Test the impersonation status endpoint:
   ```bash
   curl http://localhost:8080/api/impersonation-status
   ```

## 🚀 Usage

### API Endpoints

#### Upload Photo with User Impersonation
```bash
curl -X POST "http://localhost:8080/api/upload-photo" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@photo.jpg" \
  -F "userName=John" \
  -F "userEmail=john.doe@your-domain.com"
```

#### Check Impersonation Status
```bash
curl http://localhost:8080/api/impersonation-status
```

**Response:**
```json
{
  "impersonationEnabled": true,
  "domain": "your-domain.com",
  "defaultUser": "default@your-domain.com",
  "configured": true
}
```

### Web Interface Usage

The web interface will continue to work as before. Photos will be uploaded to the default user's Google Drive account unless a specific user email is provided via the API.

## 🔐 Security Considerations

### Domain Validation
- Only emails from the configured domain are allowed for impersonation
- Invalid emails fall back to the default service account behavior
- Email format validation prevents injection attacks

### Access Control
- Service account must have domain-wide delegation permissions
- Users being impersonated must exist in the Google Workspace domain
- Service only requests the minimum required scope (`drive.file`)

### Error Handling
- Failed impersonation attempts fall back to default service account
- Comprehensive logging for troubleshooting
- Graceful degradation when impersonation is misconfigured

## 📊 How It Works

### Without Impersonation (Default)
```
Camera Service → Service Account → Google Drive (Service Account's Drive)
```

### With Impersonation
```
Camera Service → Service Account (impersonating user) → Google Drive (User's Drive)
```

### Folder Structure

When impersonating users, photos are uploaded to the target user's Google Drive:

**User john.doe@your-domain.com:**
```
John's Google Drive/
├── John-fotos/
│   ├── John-camera-photo-2025-07-11_14-30-45.jpg
│   └── John-camera-photo-2025-07-11_14-35-22.jpg
```

**User jane.smith@your-domain.com:**
```
Jane's Google Drive/
├── Jane-fotos/
│   ├── Jane-camera-photo-2025-07-11_15-10-30.jpg
│   └── Jane-camera-photo-2025-07-11_15-15-45.jpg
```

## 🛠 Troubleshooting

### Common Issues

#### 1. "Failed to create impersonated Drive service"
**Cause:** Domain-wide delegation not properly configured
**Solution:** 
- Verify Client ID in Google Admin Console
- Check OAuth scopes are correct
- Ensure service account has domain-wide delegation enabled

#### 2. "Email not in allowed domain"
**Cause:** Trying to impersonate user from different domain
**Solution:** 
- Use emails from the configured domain only
- Check `google.drive.impersonation.domain` setting

#### 3. "Invalid email format"
**Cause:** Malformed email address
**Solution:** 
- Ensure email follows standard format: user@domain.com
- Check for special characters or spaces

### Debug Logging

Enable debug logging in `application.properties`:
```properties
logging.level.com.magumboi.webcameraapp.service.GoogleDriveService=DEBUG
```

### Testing Impersonation

1. **Test with curl:**
   ```bash
   curl -X POST "http://localhost:8080/api/upload-photo" \
     -F "file=@test.jpg" \
     -F "userEmail=test@your-domain.com"
   ```

2. **Check logs for confirmation:**
   ```
   Photo uploaded successfully to Google Drive: test-camera-photo-2025-07-11_14-30-45.jpg (ID: 1a2b3c...) for user: test@your-domain.com
   ```

3. **Verify in target user's Google Drive:**
   - Log in as the target user
   - Check that the photo appears in their Drive
   - Verify the folder was created automatically

## 🔄 Migration from Service Account

If you're migrating from service account-only mode:

1. **Enable impersonation gradually:**
   ```properties
   google.drive.impersonation.enabled=false  # Start disabled
   ```

2. **Test with a few users first:**
   - Use the API to test specific user emails
   - Monitor logs for any issues

3. **Enable by default:**
   ```properties
   google.drive.impersonation.enabled=true
   google.drive.impersonation.default-user=admin@your-domain.com
   ```

4. **Update web interface (optional):**
   - Modify frontend to collect user emails
   - Add user selection dropdown
   - Implement user authentication

## 📝 Best Practices

1. **Use meaningful default user:** Choose a service account or admin user for the default
2. **Validate permissions:** Ensure impersonated users have Drive access
3. **Monitor usage:** Keep track of which users are being impersonated
4. **Regular audits:** Review domain-wide delegation permissions periodically
5. **Error handling:** Always implement fallback to service account behavior

This setup allows your camera service to upload photos directly to users' personal Google Drive accounts while maintaining security and proper access controls.
