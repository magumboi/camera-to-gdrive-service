# Camera to Google Drive Service

This is a Spring Boot service that allows capturing photos from a web camera and automatically uploading them to Google Drive with user-based organization.

## 🚀 Key Features

- **Web camera photo capture**: Modern and responsive interface
- **Automatic user organization**: Each user has their own folder
- **Name personalization**: Files include the user's name
- **Photo gallery**: View the latest photos taken
- **Motion detection**: Prevents blurry photos
- **Photo download**: Option to download photos locally
- **Multi-language interface**: Spanish support
- **Responsive design**: Works on mobile and desktop

## 📁 File Organization

The system automatically organizes photos as follows:

```
Google Drive/
├── Juan-fotos/
│   ├── Juan-camera-photo-2025-07-06_14-30-45.jpg
│   ├── Juan-camera-photo-2025-07-06_14-35-22.jpg
│   └── Juan-camera-photo-2025-07-06_14-40-15.jpg
├── Maria-fotos/
│   ├── Maria-camera-photo-2025-07-06_15-10-30.jpg
│   └── Maria-camera-photo-2025-07-06_15-15-45.jpg
└── Pedro-fotos/
    └── Pedro-camera-photo-2025-07-06_16-00-12.jpg
```

## 👤 User System

### First Use
1. When opening the application, the user's name is requested
2. The name is validated (2-30 characters, no special characters)
3. A folder `{UserName}-fotos` is automatically created in Google Drive
4. The name is saved locally for future sessions

### User Features
- **Name change**: 👤 button to change the name at any time
- **Persistence**: Name is maintained between sessions
- **Validation**: Safe names for use in file names
- **Visual feedback**: Informative messages about where photos are saved

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

# Logging Configuration
logging.level.web=DEBUG
```

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

### Backend (Spring Boot)
- **PhotoUploadController**: Handles photo upload requests
- **GoogleDriveService**: Manages interaction with Google Drive API
  - Automatic creation of user folders
  - File upload with personalized names
  - Error handling and fallbacks
- **Reactive configuration**: Uses Project Reactor for asynchronous operations

### Frontend (Vanilla JavaScript)
- **Camera management**: WebRTC API for camera access
- **Motion detection**: Frame analysis algorithm
- **User management**: LocalStorage for name persistence
- **Photo gallery**: Temporary local storage system
- **Responsive UI**: CSS Grid and Flexbox for adaptability

### Data Flow
1. **Initialization**: User enters name → Validation → Local storage
2. **Capture**: Motion detection → Photo capture → Blob conversion
3. **Upload**: FormData with photo and user → Backend → Google Drive API
4. **Organization**: Folder search/creation → Upload with personalized name
5. **Confirmation**: Server response → User message

## 🚀 Quick Start

### Prerequisites
- Java 11 or higher
- Maven 3.6 or higher
- Modern web browser with WebRTC support
- Google Cloud account with Google Drive API access

### Quick Installation

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

### First Execution
1. Enter your name when prompted
2. Allow camera access when the browser requests it
3. Take your first photo!
4. The photo will be automatically saved to Google Drive in your personal folder

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
  - `userName` (String) - User name (optional)
- **Response**: JSON with uploaded file ID and user information
- **Example response**:
  ```json
  {
    "message": "Photo uploaded successfully to Google Drive",
    "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "uploadedFor": "Juan"
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

## 🎯 Interface Features

### Camera Controls
- **📷 Take photo**: Main centered button to capture photos
- **🔄 Switch camera**: Toggle between front and rear camera
- **👤 Change name**: Allows modifying the user's name

### Advanced Features
- **Motion detection**: Warns if there's too much movement before taking a photo
- **Tap to focus**: Touch the screen to focus the camera
- **Integrated gallery**: View the latest photos taken
- **Local download**: Option to download photos to device
- **Optional upload**: Choose whether to upload photos automatically or manually

### System Messages
- **Personalized welcome**: Greeting with the user's name
- **Upload confirmation**: Indicates which folder the photo was saved to
- **Error handling**: Clear messages for any problems

## Security

- Service account credentials must be kept secure
- Do not upload the `service-account-key.json` file to public repositories
- Consider using environment variables for production configuration

## Troubleshooting

### Error "Google Drive not configured"
- Verify that the `service-account-key.json` file exists
- Make sure the path in `application.properties` is correct
- Check that the service account has permissions

### Error "Failed to upload photo"
- Verify that the Google Drive API is enabled
- Make sure the service account has write permissions
- If using a specific folder, verify it's shared with the service account

### Files don't appear in Drive
- Photos are uploaded to "My Drive" if no folder is specified
- If you specified a folder, verify the ID in the configuration
- Check that the folder is shared with the service account

### Problems with user names
- Names are automatically validated to avoid invalid characters
- If a name causes problems, photos are saved to the main folder
- Special characters are automatically removed from folder names

### User folder permission problems
- User folders are created automatically
- If creation fails, photos are saved to the configured main folder
- Verify that the service account has permissions to create folders

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

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile
- **Tablets**: Adapted responsive interface
- **Orientation**: Support for both vertical and horizontal

## 🔒 Security Considerations

- Service account credentials must be kept secure
- Do not upload the `service-account-key.json` file to public repositories
- User names are automatically sanitized
- Consider using HTTPS in production
- Implement rate limiting if necessary

## 📄 License

This project is under the license specified in the LICENSE file.
