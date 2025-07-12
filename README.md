# Camera to Google Drive Service

This is a Spring Boot service that allows capturing photos from a web camera and automatically uploading them to Google Drive with user-based organization. The application features advanced camera conflict detection, modern responsive UI, and intelligent photo management.

## 🚀 Key Features

- **Web camera photo capture**: Modern and responsive interface with enhanced button layout
- **Automatic user organization**: Each user has their own folder in Google Drive
- **Name personalization**: Files include the user's name and are organized by user
- **Photo gallery**: View and manage the latest photos taken
- **Motion detection**: Prevents blurry photos with intelligent stabilization
- **Photo download**: Download photos locally with automatic cloud backup
- **Camera conflict detection**: Smart handling of camera usage conflicts
- **Multi-device support**: Responsive design for mobile, tablet, and desktop
- **Enhanced error handling**: Comprehensive camera access error management
- **Auto-upload on download**: Photos are automatically backed up when downloaded

## 📱 Enhanced User Interface

### **Modern Button Layout**
- **👤 User Button**: Far left - Change user name and manage settings
- **📷 Take Photo**: Center - Large, prominent capture button  
- **🔄 Camera Toggle**: Far right - Switch between front and rear cameras

### **Responsive Design**
- **Desktop**: Full-size buttons with optimal spacing and gradients
- **Mobile**: Touch-friendly sizes with proper spacing
- **Landscape**: Optimized layout for horizontal orientation
- **Adaptive**: Buttons stack vertically on very small screens

### **Visual Enhancements**
- Gradient backgrounds and modern shadows
- Enhanced hover effects and button animations
- Improved tooltips with better positioning
- Professional typography and spacing

## 📁 File Organization

The system automatically organizes photos with intelligent naming and folder structure:

```
Google Drive/
├── Juan-fotos/
│   ├── Juan-camera-photo-2025-07-07_14-30-45.jpg
│   ├── Juan-camera-photo-2025-07-07_14-35-22.jpg
│   └── Juan-camera-photo-2025-07-07_14-40-15.jpg
├── Maria-fotos/
│   ├── Maria-camera-photo-2025-07-07_15-10-30.jpg
│   └── Maria-camera-photo-2025-07-07_15-15-45.jpg
└── Pedro-fotos/
    └── Pedro-camera-photo-2025-07-07_16-00-12.jpg
```

### **File Naming Convention**
- Format: `{UserName}-camera-photo-{YYYY-MM-DD}_{HH-MM-SS}.jpg`
- High-quality JPEG with 95% quality setting
- Automatic timestamp inclusion for easy sorting

## 👤 User System

### **First Use Experience**
1. Welcome prompt requests user's name on app launch
2. Name validation ensures file system compatibility (2-30 characters, no special characters)
3. Automatic folder creation: `{UserName}-fotos` in Google Drive
4. Local storage persistence for seamless future sessions

### **User Management Features**
- **Name change**: 👤 button to update name at any time
- **Session persistence**: Name maintained between browser sessions
- **Input validation**: Safe names that work across all file systems
- **Visual feedback**: Clear messages about folder locations and upload status

### **Smart Folder Management**
- Automatic folder creation and organization
- User-specific photo separation
- Fallback to main folder if user folder creation fails
- Sanitized folder names for cross-platform compatibility

## 📹 Camera System

### **Advanced Camera Features**
- **Multiple camera support**: Automatic detection of front and rear cameras
- **Tap-to-focus**: Touch anywhere on the video to focus the camera
- **Motion detection**: Intelligent blur prevention with real-time feedback
- **Anti-blur settings**: Automatic application of optimal camera settings
- **Image stabilization**: Hardware stabilization when available

### **Camera Conflict Detection**
- **Pre-flight checks**: Tests camera availability before starting
- **Conflict resolution**: Detects when camera is in use by other tabs/applications
- **User guidance**: Step-by-step instructions for resolving camera conflicts
- **Automatic recovery**: Reconnection options when camera becomes available
- **Browser-specific help**: Tailored permission instructions for each browser

### **Error Handling**
- **Comprehensive error messages**: Specific guidance for each error type
- **Permission management**: Instructions for enabling camera access
- **Retry mechanisms**: Smart retry with user feedback
- **Fallback options**: Page reload and permission reset options

## Google Drive Configuration

### 1. Create a Project in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create credentials" > "Service account"
3. Provide a name and description for the service account
4. Assign the "Editor" or "Owner" role (or a custom role with Drive permissions)
5. Click "Create"

### 3. Download Credentials

1. On the credentials page, find your service account
2. Click the pencil icon to edit it
3. Go to the "Keys" tab
4. Click "Add key" > "Create new key"
5. Select "JSON" and download the file
6. Save the file as `service-account-key.json` in `src/main/resources/`

### 4. Configure Google Drive Folder (Optional)

If you want photos to be uploaded to a specific folder:

1. Create a folder in your Google Drive
2. Right-click the folder and select "Share"
3. Share the folder with the service account email (found in the JSON file)
4. Copy the folder ID from the URL (the part after `/folders/`)
5. Add the ID to `application.properties`:
   ```properties
   google.drive.folder.id=YOUR_FOLDER_ID_HERE
   ```

## Application Configuration

### application.properties File

```properties
# Google Drive Configuration
google.drive.credentials.path=src/main/resources/service-account-key.json
google.drive.folder.id=

# User Impersonation Configuration (Optional)
google.drive.impersonation.enabled=false
google.drive.impersonation.domain=your-domain.com
google.drive.impersonation.default-user=default@your-domain.com

# Logging Configuration
logging.level.web=DEBUG
```

## 👥 User Impersonation (Advanced)

The service supports **user impersonation** for Google Workspace domains, allowing photos to be uploaded directly to specific users' Google Drive accounts instead of a shared service account.

### 🔧 **Setup Requirements**
- Google Workspace (G Suite) domain
- Domain administrator access
- Domain-wide delegation configuration

### 📋 **Quick Setup**
1. **Enable domain-wide delegation** for your service account in Google Cloud Console
2. **Authorize the service account** in Google Workspace Admin Console with scope: `https://www.googleapis.com/auth/drive.file`
3. **Update configuration**:
   ```properties
   google.drive.impersonation.enabled=true
   google.drive.impersonation.domain=your-company.com
   google.drive.impersonation.default-user=admin@your-company.com
   ```

### 🚀 **Usage**
```bash
# Upload to specific user's Google Drive
curl -X POST "http://localhost:8080/api/upload-photo" \
  -F "file=@photo.jpg" \
  -F "userName=John" \
  -F "userEmail=john.doe@your-company.com"
```

### 📁 **Result**
Photos are uploaded to the target user's personal Google Drive:
```
John's Google Drive/
├── John-fotos/
│   ├── John-camera-photo-2025-07-11_14-30-45.jpg
│   └── John-camera-photo-2025-07-11_14-35-22.jpg
```

### 📖 **Detailed Setup Guide**
See [USER_IMPERSONATION_SETUP.md](USER_IMPERSONATION_SETUP.md) for complete configuration instructions, troubleshooting, and security considerations.

### Maven Dependencies

The project includes the following main dependencies:

```xml
<!-- Spring Boot Dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>

<!-- Google Drive API -->
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-drive</artifactId>
    <version>v3-rev20230822-2.0.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
<dependency>
    <groupId>com.google.http-client</groupId>
    <artifactId>google-http-client-jackson2</artifactId>
    <version>1.43.3</version>
</dependency>

<!-- Reactive Programming -->
<dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-core</artifactId>
</dependency>
```

## 🏗️ System Architecture

### **Backend (Spring Boot)**
- **PhotoUploadController**: RESTful API for photo upload with user support
- **GoogleDriveService**: Complete Google Drive API integration
  - Automatic user folder creation and management
  - File upload with personalized naming conventions
  - Comprehensive error handling and fallback mechanisms
  - Folder permission management and sharing
- **Reactive configuration**: Asynchronous operations using Project Reactor
- **Security**: Input validation and sanitization for user data

### **Frontend (Vanilla JavaScript)**
- **Camera management**: Advanced WebRTC API implementation
  - Multiple camera support with automatic detection
  - Real-time motion detection and blur prevention
  - Tap-to-focus functionality with coordinate mapping
  - Camera conflict detection and resolution
- **User interface**: Modern responsive design
  - CSS Grid and Flexbox for adaptive layouts
  - Touch-optimized controls for mobile devices
  - Progressive enhancement for different screen sizes
- **Photo management**: Intelligent gallery system
  - Local storage with automatic optimization
  - Thumbnail generation and caching
  - Batch operations and smart cleanup
- **Error handling**: Comprehensive user guidance
  - Browser-specific permission instructions
  - Camera conflict resolution workflows
  - Automatic retry mechanisms with exponential backoff

### **Data Flow**
1. **Initialization**: 
   - User name prompt → Validation → Local storage persistence
   - Camera availability check → Conflict detection → Permission verification
2. **Capture Process**: 
   - Motion detection → Stability verification → Photo capture → Quality optimization
3. **Upload Workflow**: 
   - FormData preparation → User folder verification → Google Drive upload → Confirmation
4. **Organization**: 
   - Folder search/creation → Upload with personalized naming → Success notification
5. **Download Process**:
   - Local download trigger → Automatic cloud backup → Dual confirmation

### **Smart Features**
- **Automatic backup**: Downloads trigger silent cloud uploads
- **Storage optimization**: Dynamic gallery size based on available space
- **Session management**: Persistent user preferences and photo history
- **Performance monitoring**: Camera health checks and automatic recovery

## 🚀 Quick Start

### **Prerequisites**
- Java 11 or higher
- Maven 3.6 or higher
- Modern web browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Google Cloud account with Google Drive API access
- HTTPS environment (required for camera access in production)

### **Quick Installation**

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd camera-to-gdrive-service
   ```

2. **Configure Google Drive** (follow the detailed configuration section below)

3. **Install dependencies**:
   ```bash
   mvn clean install
   ```

4. **Run the application**:
   ```bash
   mvn spring-boot:run
   ```

5. **Open in browser**:
   ```
   http://localhost:8080
   ```

### **First Execution**
1. **User setup**: Enter your name when prompted (2-30 characters, no special characters)
2. **Camera permissions**: Allow camera access when the browser requests it
3. **Camera selection**: Use the 🔄 button to switch between front/rear cameras
4. **Take photos**: Use the large center button to capture photos
5. **Automatic organization**: Photos are saved to your personal Google Drive folder

### **Expected Behavior**
- ✅ Smooth camera initialization with conflict detection
- ✅ Real-time motion detection and blur prevention  
- ✅ Automatic photo upload to user-specific folders
- ✅ Local gallery with last 6 photos for quick access
- ✅ Download with automatic cloud backup

## Running the Application

1. Install dependencies:
   ```bash
   mvn clean install
   ```

2. Run the application:
   ```bash
   mvn spring-boot:run
   ```

3. Open your browser and go to `http://localhost:8080`

## API Endpoints

### Upload Photo
- **POST** `/api/upload-photo`
- **Parameters**: 
  - `file` (MultipartFile) - Required image file
  - `userName` (String) - User name for folder organization (optional)
  - `userEmail` (String) - Target user's email for impersonation (optional)
- **Response**: JSON with uploaded file ID and user information
- **Example response**:
  ```json
  {
    "message": "Photo uploaded successfully to Google Drive",
    "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "uploadedFor": "Juan",
    "uploadedToAccount": "juan.doe@company.com"
  }
  ```

### Google Drive Status
- **GET** `/api/drive-status`
- **Response**: JSON with configuration status
- **Example response**:
  ```json
  {
    "configured": true,
    "folderId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "service": "Google Drive"
  }
  ```

### User Impersonation Status
- **GET** `/api/impersonation-status`
- **Response**: JSON with impersonation configuration
- **Example response**:
  ```json
  {
    "impersonationEnabled": true,
    "domain": "company.com",
    "defaultUser": "admin@company.com",
    "configured": true
  }
  ```

## 🎯 Interface Features

### **Enhanced Button Layout**
- **👤 User Button (Left)**: 65x65px circular button for user management
- **📷 Take Photo (Center)**: 240x65px prominent capture button with uppercase text
- **🔄 Camera Toggle (Right)**: 65x65px circular button with camera switch icon
- **Modern styling**: Gradient backgrounds, enhanced shadows, and smooth animations
- **Touch-friendly**: Optimized sizes for both mouse and touch interaction

### **Advanced Camera Controls**
- **Motion detection warnings**: Real-time feedback to prevent blurry photos
- **Tap-to-focus**: Touch/click anywhere on the video to focus
- **Camera switching**: Seamless toggle between front and rear cameras
- **Visual stabilization indicators**: Color-coded feedback for camera stability

### **Smart Photo Management**
- **Integrated gallery**: View last 6 photos with thumbnail previews
- **Photo actions**: Upload, download, or share individual photos
- **Dual backup system**: Photos automatically backed up when downloaded
- **Local storage**: Persistent gallery with smart storage management

### **Responsive Behavior**
- **Desktop (>768px)**: Full-size buttons with optimal spacing
- **Tablet (≤768px)**: Moderately sized buttons maintaining usability
- **Mobile (≤480px)**: Compact but touch-friendly button sizes
- **Tiny screens (≤320px)**: Vertical button stacking for maximum usability
- **Landscape mode**: Optimized layouts for horizontal orientation

### **User Experience Enhancements**
- **Loading indicators**: Clear feedback during photo processing
- **Error recovery**: Helpful guidance for resolving camera issues
- **Tooltips**: Contextual help for button functions
- **Confirmation messages**: Success/error feedback with actionable information

## Security

- Service account credentials must be kept secure
- Do not upload the `service-account-key.json` file to public repositories
- Consider using environment variables for production configuration

## 🛠️ Troubleshooting

### **Camera Access Issues**

#### **"Camera in use" Error**
- **Cause**: Another tab, window, or application is using the camera
- **Solutions**:
  - Close other browser tabs that might be using the camera
  - Close video conferencing apps (Zoom, Teams, Skype, etc.)
  - Close other camera applications
  - Restart the browser if the issue persists
  - Check Windows/Mac privacy settings for camera access

#### **"Access denied" Error**  
- **Cause**: Browser permissions not granted
- **Solutions**:
  - Click the camera icon in the address bar and select "Allow"
  - Check browser settings: Privacy & Security → Camera
  - Ensure the site is not in the blocked list
  - Try incognito/private mode to test permissions
  - Clear browser cache and cookies for the site

#### **"No camera found" Error**
- **Cause**: No camera devices detected
- **Solutions**:
  - Check physical camera connections
  - Verify camera drivers are installed and updated
  - Test camera in other applications
  - Restart the computer if needed
  - Check Windows Device Manager or Mac System Preferences

### **Upload and Storage Issues**

#### **"Failed to upload photo" Error**
- **Verify Google Drive configuration**:
  - Ensure `service-account-key.json` exists in `src/main/resources/`
  - Check that Google Drive API is enabled in Google Cloud Console
  - Verify service account has proper permissions
- **Check folder permissions**:
  - If using a specific folder, ensure it's shared with the service account
  - Verify the folder ID in `application.properties` is correct
- **Network issues**:
  - Check internet connectivity
  - Verify firewall settings allow HTTPS requests
  - Test with a smaller image file

#### **Photos don't appear in Google Drive**
- **Default location**: Photos upload to "My Drive" if no folder is specified
- **Folder access**: If using a specific folder, verify sharing with service account email
- **Permission delays**: Google Drive sometimes takes a few minutes to show new files
- **Check trash**: Files might be in Google Drive trash if there were permission issues

### **User and Folder Issues**

#### **User folder creation problems**
- **Automatic handling**: App automatically falls back to main folder if user folder creation fails
- **Permission verification**: Ensure service account can create folders in Google Drive
- **Name validation**: User names are automatically sanitized for file system compatibility
- **Manual verification**: Check Google Drive to confirm folder existence

#### **Name validation errors**
- **Character restrictions**: Only alphanumeric characters and spaces allowed
- **Length limits**: 2-30 characters required
- **Special characters**: Automatically removed or replaced
- **Reset option**: Use the 👤 button to change/reset user name

### **Browser-Specific Issues**

#### **Chrome/Edge**
- Enable camera permissions: Settings → Privacy and security → Site settings → Camera
- Check for browser updates
- Try disabling extensions that might interfere with camera access

#### **Firefox**  
- Enable camera permissions: about:preferences#privacy → Permissions → Camera
- Check if WebRTC is enabled: about:config → media.navigator.enabled = true

#### **Safari**
- Enable camera permissions: Safari → Preferences → Websites → Camera
- Ensure "Auto-Play" is set to "Allow All Auto-Play"

### **Performance Issues**

#### **Slow camera initialization**
- **Hardware acceleration**: Enable in browser settings
- **Background apps**: Close unnecessary applications
- **Browser cache**: Clear cache and restart browser
- **Network**: Ensure stable internet connection for initial setup

#### **Motion detection too sensitive**
- **Lighting**: Ensure adequate, stable lighting
- **Stability**: Use a tripod or stable surface
- **Settings**: Motion detection automatically adjusts sensitivity

### **Development and Configuration**

#### **Service account issues**
- **File location**: Ensure `service-account-key.json` is in correct directory
- **File format**: Verify JSON file is valid and complete
- **Permissions**: Check file permissions and accessibility
- **Regeneration**: Try generating a new service account key

#### **Application not starting**
- **Java version**: Verify Java 11+ is installed
- **Maven**: Ensure Maven 3.6+ is available
- **Port conflicts**: Check if port 8080 is already in use
- **Dependencies**: Run `mvn clean install` to refresh dependencies

#### **HTTPS requirements**
- **Local development**: HTTP is acceptable for localhost
- **Production**: HTTPS is required for camera access
- **Certificates**: Ensure valid SSL certificates are configured

## 🔧 Advanced Configuration

### Environment Variables for Production
```bash
export GOOGLE_DRIVE_CREDENTIALS_PATH=/path/to/credentials.json
export GOOGLE_DRIVE_FOLDER_ID=your_folder_id
export GOOGLE_DRIVE_ENABLED=true
```

### Logging Configuration
```properties
# For detailed debugging
logging.level.com.magumboi.webcameraapp=DEBUG
logging.level.com.google.api=INFO

# For production
logging.level.root=WARN
logging.level.com.magumboi.webcameraapp=INFO
```

## 📱 Device Support

### **Desktop Browsers**
- **Chrome 90+**: Full feature support with hardware acceleration
- **Firefox 88+**: Complete compatibility with WebRTC features  
- **Safari 14+**: Full support on macOS with camera switching
- **Edge 90+**: Complete Chromium-based compatibility

### **Mobile Browsers**
- **Chrome Mobile**: Full camera support with touch controls
- **Safari Mobile**: Complete iOS integration with front/rear camera switching
- **Firefox Mobile**: WebRTC support with responsive design
- **Samsung Internet**: Full compatibility on Android devices

### **Device Features**
- **Tablets**: Optimized responsive interface for tablet screens
- **Smartphones**: Touch-friendly controls with proper spacing
- **Desktop webcams**: Multiple camera detection and switching
- **Laptop cameras**: Built-in camera support with tap-to-focus

### **Orientation Support**
- **Portrait**: Vertical layout optimized for mobile phones
- **Landscape**: Horizontal layout for tablets and desktop
- **Auto-rotation**: Automatic layout adjustment on device rotation
- **Fixed orientation**: Button layout adapts to screen constraints

### **Touch and Input**
- **Touch gestures**: Tap-to-focus anywhere on the video
- **Button interaction**: Large, touch-friendly buttons
- **Keyboard navigation**: Full accessibility support
- **Mouse interaction**: Hover effects and click feedback

## 🔒 Security Considerations

### **Data Protection**
- **Local storage**: Photos stored temporarily with automatic cleanup
- **Cloud security**: Direct upload to Google Drive with service account authentication
- **User privacy**: No photo data stored on server, direct client-to-cloud upload
- **Encryption**: All data transmission over HTTPS

### **Authentication & Authorization**
- **Service account**: Secure, limited-scope Google Drive access
- **No user login**: No personal Google account access required
- **Scoped permissions**: Minimal required permissions for Google Drive operations
- **Key management**: Secure storage of service account credentials

### **Best Practices**
- **Credential security**: Never commit service account keys to version control
- **Environment variables**: Use environment variables for production credentials
- **User input validation**: All user names sanitized and validated
- **HTTPS enforcement**: Required for camera access in production
- **Rate limiting**: Consider implementing rate limiting for production use

### **Privacy Features**
- **User name only**: Only user name is collected, no other personal data
- **Local processing**: All image processing happens in the browser
- **Automatic cleanup**: Local storage automatically managed and cleaned
- **No tracking**: No analytics or tracking implemented by default

## 📄 License

This project is under the license specified in the LICENSE file.
