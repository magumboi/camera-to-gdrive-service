// Set constraints for the video stream
var constraints = {
    video: {
        facingMode: "user",
        focusMode: "continuous",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, min: 24 },
        // Anti-blur settings
        exposureMode: "continuous",
        whiteBalanceMode: "continuous",
        imageStabilization: true
    },
    audio: false
};
var track = null;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger"),
    cameraToggle = document.querySelector("#camera--toggle");

// Access the device camera and stream to cameraView
function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function (stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;

            // Configure camera settings for better image quality
            if (track.getCapabilities) {
                const capabilities = track.getCapabilities();
                console.log('Camera capabilities:', capabilities);

                // Apply anti-blur settings
                applyAntiBlurSettings(capabilities);
            }

            // Update mirror effect based on camera facing mode
            updateCameraMirror();

            // Start motion detection after camera is ready
            cameraView.addEventListener('loadedmetadata', () => {
                setTimeout(() => {
                    startMotionDetection();
                }, 1000);
            });

            // Start camera monitoring
            startCameraMonitoring();
        })
        .catch(function (error) {
            console.error("Camera access error:", error);
            handleCameraError(error);
        });
}

// Handle camera access errors
function handleCameraError(error) {
    let errorMessage = 'Error al acceder a la cámara';
    let errorDetails = 'Por favor verifica los permisos de la cámara';
    
    if (error.name === 'NotAllowedError') {
        errorMessage = 'Acceso a la cámara denegado';
        errorDetails = 'Por favor permite el acceso a la cámara en la configuración del navegador';
    } else if (error.name === 'NotFoundError') {
        errorMessage = 'Cámara no encontrada';
        errorDetails = 'No se encontró ninguna cámara disponible en este dispositivo';
    } else if (error.name === 'NotReadableError') {
        errorMessage = 'Cámara en uso';
        errorDetails = 'La cámara está siendo utilizada por otra aplicación o pestaña. Cierra otras aplicaciones que puedan estar usando la cámara e inténtalo de nuevo.';
    } else if (error.name === 'AbortError') {
        errorMessage = 'Acceso interrumpido';
        errorDetails = 'El acceso a la cámara fue interrumpido. Inténtalo de nuevo.';
    } else if (error.name === 'SecurityError') {
        errorMessage = 'Error de seguridad';
        errorDetails = 'El acceso a la cámara está bloqueado por razones de seguridad. Asegúrate de estar usando HTTPS.';
    }

    // Show error message to user
    Swal.fire({
        title: errorMessage,
        html: `
            <div style="text-align: center;">
                <p>${errorDetails}</p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; font-size: 0.9em;">
                    <strong>Posibles soluciones:</strong><br>
                    • Cierra otras pestañas que usen la cámara<br>
                    • Cierra otras aplicaciones de videollamada<br>
                    • Recarga la página e intenta de nuevo<br>
                    • Verifica los permisos de cámara en tu navegador
                </div>
            </div>
        `,
        icon: 'error',
        confirmButtonText: 'Reintentar',
        showCancelButton: true,
        cancelButtonText: 'Verificar permisos',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            title: 'swal-title-white',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Retry camera access
            setTimeout(() => {
                cameraStart();
            }, 1000);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Show permission instructions
            showPermissionInstructions();
        }
    });
}

// Show camera permission instructions
function showPermissionInstructions() {
    Swal.fire({
        title: 'Configurar permisos de cámara',
        html: `
            <div style="text-align: left;">
                <h4>🌐 Chrome/Edge:</h4>
                <p>1. Haz clic en el icono de candado o cámara en la barra de direcciones<br>
                2. Selecciona "Permitir" para la cámara<br>
                3. Recarga la página</p>
                
                <h4>🦊 Firefox:</h4>
                <p>1. Haz clic en el icono de escudo o cámara en la barra de direcciones<br>
                2. Selecciona "Permitir" para la cámara<br>
                3. Recarga la página</p>
                
                <h4>🍎 Safari:</h4>
                <p>1. Ve a Safari > Preferencias > Sitios web > Cámara<br>
                2. Permite el acceso para este sitio<br>
                3. Recarga la página</p>
                
                <div style="margin-top: 15px; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 6px;">
                    <strong>💡 Consejo:</strong> Si otros sitios web o aplicaciones están usando la cámara, ciérralos primero.
                </div>
            </div>
        `,
        confirmButtonText: 'Intentar de nuevo',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        width: '600px',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            title: 'swal-title-white',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            cameraStart();
        }
    });
}

// Apply settings to reduce motion blur
function applyAntiBlurSettings(capabilities) {
    const settings = {};

    // Set higher shutter speed if available
    if (capabilities.exposureTime) {
        settings.exposureTime = capabilities.exposureTime.min || 1 / 60; // Fast shutter speed
    }

    // Set lower ISO if available to reduce noise
    if (capabilities.iso) {
        settings.iso = capabilities.iso.min || 100;
    }

    // Enable image stabilization if available
    if (capabilities.imageStabilization) {
        settings.imageStabilization = true;
    }

    // Set focus mode for sharp images
    if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
        settings.focusMode = 'single-shot';
    }

    // Apply the settings
    if (Object.keys(settings).length > 0) {
        track.applyConstraints({
            advanced: [settings]
        }).then(() => {
            console.log('Anti-blur settings applied successfully');
        }).catch((error) => {
            console.warn('Could not apply anti-blur settings:', error);
        });
    }
}

// Update mirror effect for video preview based on camera facing mode
function updateCameraMirror() {
    if (constraints.video.facingMode === "user") {
        // Mirror effect for front camera
        cameraView.style.transform = "scaleX(-1)";
    } else {
        // No mirror effect for back camera
        cameraView.style.transform = "scaleX(1)";
    }
}

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function () {
    // Check if there's too much movement using average motion
    if (motionHistory.length >= 4) { // Need fewer frames for faster response (was 5)
        const avgMotion = motionHistory.reduce((sum, val) => sum + val, 0) / motionHistory.length;

        // Use a lower threshold for blocking photos (more sensitive)
        const photoBlockThreshold = motionThreshold * 2.0; // 200% higher threshold (was 250%)

        if (avgMotion > photoBlockThreshold) {
            // Show warning for excessive movement
            Swal.fire({
                title: 'Mucho movimiento',
                text: 'Mantén la cámara estable para evitar fotos borrosas',
                icon: 'warning',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }
    }

    // Add a slightly longer delay for better stabilization
    setTimeout(() => {
        capturePhoto();
    }, 200); // Increased delay for better stability
};

// Capture photo with anti-blur techniques
function capturePhoto() {
    // Ensure video is ready and has stable dimensions
    if (!cameraView.videoWidth || !cameraView.videoHeight) {
        console.warn('Video not ready for capture');
        return;
    }

    // Set canvas size to match video dimensions exactly
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    const context = cameraSensor.getContext("2d");

    // Configure context for high quality rendering
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    // Apply focus before capture if supported
    if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
            track.applyConstraints({
                advanced: [{ focusMode: 'single-shot' }]
            }).then(() => {
                // Wait for focus to complete before capturing
                setTimeout(() => {
                    performCapture(context);
                }, 200);
            }).catch(() => {
                // If focus fails, capture anyway
                performCapture(context);
            });
        } else {
            performCapture(context);
        }
    } else {
        performCapture(context);
    }
}

// Perform the actual photo capture
function performCapture(context) {
    // Only flip horizontally for front camera (user mode) to fix mirror effect
    if (constraints.video.facingMode === "user") {
        context.scale(-1, 1);
        context.drawImage(cameraView, -cameraSensor.width, 0);
        context.scale(-1, 1); // Reset the scale
    } else {
        // For back camera (environment mode), draw normally without flipping
        context.drawImage(cameraView, 0, 0);
    }

    // Convert to high quality image
    cameraOutput.src = cameraSensor.toDataURL("image/jpeg", 0.95); // High quality JPEG
    cameraOutput.classList.add("taken");

    // Add photo to gallery
    addPhotoToGallery(cameraOutput.src);

    // Show the photo in a sweet alert
    showPhoto(cameraOutput.src, true); // Auto-upload on close since this is a new photo
}

// Photo click handled by the double-tap listener above

// Toggle between front and back camera
cameraToggle.onclick = function () {
    // Stop motion detection temporarily and reset history
    isMotionDetectionActive = false;
    lastFrameData = null;
    motionHistory = []; // Clear motion history

    if (constraints.video.facingMode === "user") {
        constraints.video.facingMode = "environment"; // Switch to back camera
    } else {
        constraints.video.facingMode = "user"; // Switch to front camera
    }
    // Restart the camera with the new constraints
    if (track) {
        track.stop(); // Stop the current track
    }
    cameraStart(); // Start the camera with the new facing mode
};

// Check if camera stream is still active
function isCameraActive() {
    return track && track.readyState === 'live' && !track.muted;
}

// Monitor camera status and show warning if camera becomes unavailable
function startCameraMonitoring() {
    setInterval(() => {
        if (!isCameraActive() && track) {
            console.warn('Camera stream lost');
            handleCameraStreamLost();
        }
    }, 5000); // Check every 5 seconds
}

// Handle when camera stream is lost
function handleCameraStreamLost() {
    // Stop motion detection
    isMotionDetectionActive = false;
    
    Swal.fire({
        title: 'Conexión de cámara perdida',
        html: `
            <div style="text-align: center;">
                <p>La conexión con la cámara se ha perdido.</p>
                <p style="font-size: 0.9em; color: #ccc;">
                    Esto puede ocurrir si otra aplicación tomó control de la cámara.
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Reconectar',
        showCancelButton: true,
        cancelButtonText: 'Recargar página',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            title: 'swal-title-white',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            cameraStart();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.reload();
        }
    });
}

// Focus the camera at a specific point
function focusCamera(x, y) {
    if (track && track.getCapabilities) {
        const capabilities = track.getCapabilities();
        console.log('Camera capabilities:', capabilities);

        // Try different focus approaches
        let focusAttempts = [];

        // Method 1: Try focus with coordinates
        if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
            const constraintsWithCoords = {
                advanced: [{
                    focusMode: 'manual',
                    pointsOfInterest: [{ x: x, y: y }]
                }]
            };
            focusAttempts.push(constraintsWithCoords);
        }

        // Method 2: Try single-shot focus
        if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
            const constraintsSingleShot = {
                advanced: [{
                    focusMode: 'single-shot'
                }]
            };
            focusAttempts.push(constraintsSingleShot);
        }

        // Method 3: Try continuous focus as fallback
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            const constraintsContinuous = {
                advanced: [{
                    focusMode: 'continuous'
                }]
            };
            focusAttempts.push(constraintsContinuous);
        }

        // Try each method in sequence
        async function tryFocusMethods() {
            for (let i = 0; i < focusAttempts.length; i++) {
                try {
                    await track.applyConstraints(focusAttempts[i]);
                    console.log(`Focus method ${i + 1} succeeded`);
                    return;
                } catch (error) {
                    console.warn(`Focus method ${i + 1} failed:`, error);
                }
            }
            console.warn('All focus methods failed');
        }

        tryFocusMethods();
    } else {
        console.warn('Focus not supported on this device');
    }
}

// Add tap-to-focus functionality
cameraView.addEventListener('click', function (event) {
    event.preventDefault();

    const rect = cameraView.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to normalized coordinates (0-1)
    const normalizedX = Math.max(0, Math.min(1, x / rect.width));
    const normalizedY = Math.max(0, Math.min(1, y / rect.height));

    console.log('Tap to focus at:', { x: normalizedX, y: normalizedY });
    focusCamera(normalizedX, normalizedY);
});

// Also add touch event for mobile devices
cameraView.addEventListener('touchstart', function (event) {
    event.preventDefault();

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        const rect = cameraView.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Convert to normalized coordinates (0-1)
        const normalizedX = Math.max(0, Math.min(1, x / rect.width));
        const normalizedY = Math.max(0, Math.min(1, y / rect.height));

        console.log('Touch to focus at:', { x: normalizedX, y: normalizedY });
        focusCamera(normalizedX, normalizedY);
    }
});

// Motion detection variables
let lastFrameData = null;
let motionThreshold = 80; // More sensitive (was 120)
let isMotionDetectionActive = false;
let motionHistory = []; // Track motion over time for better stability
let maxMotionHistory = 6; // Fewer frames for faster response (was 8)

// Photo gallery storage
let photoGallery = []; // Store up to 6 photos for display
let persistentGallery = []; // Store up to 3 photos in localStorage
const maxGallerySize = 6; // Display limit
const maxPersistentSize = 3; // Storage limit
const GALLERY_STORAGE_KEY = 'cameraGallery';

// User name storage
let userName = '';
const USER_NAME_STORAGE_KEY = 'cameraAppUserName';

// Load user name from localStorage
function loadUserName() {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage not available, user name will not persist');
        return;
    }

    try {
        const savedUserName = localStorage.getItem(USER_NAME_STORAGE_KEY);
        if (savedUserName && savedUserName.trim() !== '') {
            userName = savedUserName.trim();
            console.log('Loaded user name from storage:', userName);
        }
    } catch (error) {
        console.error('Error loading user name from localStorage:', error);
    }
}

// Save user name to localStorage
function saveUserName() {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage not available, user name will not persist');
        return;
    }

    try {
        if (userName && userName.trim() !== '') {
            localStorage.setItem(USER_NAME_STORAGE_KEY, userName.trim());
            console.log('Saved user name to storage:', userName);
        }
    } catch (error) {
        console.error('Error saving user name to localStorage:', error);
    }
}

// Prompt user for their name
async function promptForUserName() {
    const { value: name } = await Swal.fire({
        title: 'Bienvenido',
        text: 'Por favor ingresa tu nombre para personalizar las fotos',
        input: 'text',
        inputLabel: 'Tu nombre',
        inputPlaceholder: 'Ingresa tu nombre aquí',
        inputValue: userName, // Pre-fill with existing name if available
        showCancelButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        inputValidator: (value) => {
            if (!value || value.trim() === '') {
                return 'Por favor ingresa tu nombre';
            }
            if (value.trim().length < 2) {
                return 'El nombre debe tener al menos 2 caracteres';
            }
            if (value.trim().length > 30) {
                return 'El nombre no puede tener más de 30 caracteres';
            }
            // Check for invalid characters for filenames
            const invalidChars = /[<>:"/\\|?*]/;
            if (invalidChars.test(value)) {
                return 'El nombre no puede contener caracteres especiales como < > : " / \\ | ? *';
            }
            return null;
        },
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            title: 'swal-title-white',
            confirmButton: 'swal-confirm-button'
        }
    });

    if (name && name.trim() !== '') {
        userName = name.trim();
        saveUserName();
        
        // Show welcome message
        Swal.fire({
            title: `¡Hola, ${userName}!`,
            html: `
                <div style="text-align: center;">
                    <p>Ahora tus fotos incluirán tu nombre en el archivo</p>
                    <p style="font-size: 0.9em; color: #ccc; margin-top: 10px;">
                        📁 Las fotos se organizarán en una carpeta llamada:<br>
                        <strong>"${userName}-fotos"</strong>
                    </p>
                </div>
            `,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            customClass: {
                popup: 'swal-responsive-popup',
                title: 'swal-title-white'
            }
        });
    }
}

// Initialize user name when app loads
async function initializeUserName() {
    loadUserName();
    
    // If no user name is stored, prompt for it
    if (!userName || userName.trim() === '') {
        await promptForUserName();
    }
}

// Function to change user name
async function changeUserName() {
    await promptForUserName();
}

// Make changeUserName available globally
window.changeUserName = changeUserName;

// Load gallery from localStorage on startup
function loadGalleryFromStorage() {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage not available, gallery will not persist');
        return;
    }

    try {
        const savedGallery = localStorage.getItem(GALLERY_STORAGE_KEY);
        if (savedGallery) {
            const parsedGallery = JSON.parse(savedGallery);

            // Validate the data structure
            if (Array.isArray(parsedGallery)) {
                persistentGallery = parsedGallery.filter(photo =>
                    photo && photo.url && photo.timestamp && photo.id
                );

                // Ensure we don't exceed maxPersistentSize
                if (persistentGallery.length > maxPersistentSize) {
                    persistentGallery = persistentGallery.slice(0, maxPersistentSize);
                    saveGalleryToStorage(); // Save the trimmed version
                }

                // Copy persistent gallery to display gallery
                photoGallery = [...persistentGallery];

                console.log(`Loaded ${persistentGallery.length} photos from localStorage`);

                // Update camera output thumbnail if there are photos
                if (photoGallery.length > 0) {
                    const lastPhoto = photoGallery[0];
                    cameraOutput.src = lastPhoto.url;
                    cameraOutput.classList.add("taken");
                }
            }
        }
    } catch (error) {
        console.error('Error loading gallery from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(GALLERY_STORAGE_KEY);
        photoGallery = [];
        persistentGallery = [];
    }
}

// Save gallery to localStorage
function saveGalleryToStorage() {
    if (!isLocalStorageAvailable()) {
        console.warn('localStorage not available, gallery will not persist');
        return;
    }

    try {
        // Only save the persistent gallery (first 3 photos)
        const galleryData = JSON.stringify(persistentGallery);
        localStorage.setItem(GALLERY_STORAGE_KEY, galleryData);
        console.log(`Saved ${persistentGallery.length} photos to localStorage (${photoGallery.length} total in memory)`);
    } catch (error) {
        console.error('Error saving gallery to localStorage:', error);

        // If storage is full, try with even fewer photos
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, reducing persistent photos');

            // Try with 2 photos
            if (persistentGallery.length > 2) {
                persistentGallery = persistentGallery.slice(0, 2);
                try {
                    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(persistentGallery));
                    console.log('Saved reduced gallery (2 photos) to localStorage');
                    return;
                } catch (secondError) {
                    console.warn('Still failed with 2 photos, trying with 1');
                }
            }

            // Try with just 1 photo
            if (persistentGallery.length > 1) {
                persistentGallery = persistentGallery.slice(0, 1);
                try {
                    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(persistentGallery));
                    console.log('Saved minimal gallery (1 photo) to localStorage');
                    return;
                } catch (thirdError) {
                    console.error('Failed to save even 1 photo to localStorage:', thirdError);
                    persistentGallery = [];
                }
            }
        }
    }
}

// Clear gallery from localStorage (utility function)
function clearGalleryFromStorage() {
    try {
        localStorage.removeItem(GALLERY_STORAGE_KEY);
        photoGallery = [];
        persistentGallery = [];
        console.log('Gallery cleared from localStorage');

        // Reset camera output
        cameraOutput.src = '';
        cameraOutput.classList.remove("taken");
    } catch (error) {
        console.error('Error clearing gallery from localStorage:', error);
    }
}

// Get gallery storage size (utility function)
function getGalleryStorageSize() {
    try {
        const savedGallery = localStorage.getItem(GALLERY_STORAGE_KEY);
        if (savedGallery) {
            return new Blob([savedGallery]).size;
        }
        return 0;
    } catch (error) {
        console.error('Error getting gallery storage size:', error);
        return 0;
    }
}

// Get available storage space estimation
function getAvailableStorageSpace() {
    if (!isLocalStorageAvailable()) {
        return 0;
    }

    try {
        // Rough estimation of localStorage usage
        const totalUsed = JSON.stringify(localStorage).length;
        const maxStorage = 5 * 1024 * 1024; // Estimate 5MB limit for localStorage
        return Math.max(0, maxStorage - totalUsed);
    } catch (error) {
        console.error('Error estimating available storage:', error);
        return 0;
    }
}

// Check how many photos can fit in storage
function calculateOptimalPersistentSize() {
    const availableSpace = getAvailableStorageSpace();
    const currentGallerySize = getGalleryStorageSize();

    if (persistentGallery.length === 0) {
        return maxPersistentSize;
    }

    // Estimate average photo size from current gallery
    const avgPhotoSize = currentGallerySize / persistentGallery.length;
    const photosCanFit = Math.floor((availableSpace + currentGallerySize) / avgPhotoSize);

    // Return optimal size, but not more than maxPersistentSize
    return Math.min(Math.max(1, photosCanFit), maxPersistentSize);
}

// Check localStorage availability
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.warn('localStorage is not available:', error);
        return false;
    }
}

// Start motion detection when camera starts
function startMotionDetection() {
    if (!isMotionDetectionActive) {
        isMotionDetectionActive = true;
        detectMotion();
    }
}

// Detect motion in the video stream
function detectMotion() {
    if (!cameraView.videoWidth || !cameraView.videoHeight) {
        setTimeout(detectMotion, 150);
        return;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 100; // Slightly higher resolution for more sensitivity (was 80)
    canvas.height = 75;

    // Draw current frame
    context.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
    const currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (lastFrameData) {
        const motionLevel = calculateMotionLevel(lastFrameData, currentFrameData);

        // Add to motion history
        motionHistory.push(motionLevel);
        if (motionHistory.length > maxMotionHistory) {
            motionHistory.shift(); // Remove oldest entry
        }

        // Calculate average motion over recent frames for better stability
        const avgMotion = motionHistory.reduce((sum, val) => sum + val, 0) / motionHistory.length;

        // Update UI based on average motion level
        updateMotionIndicator(avgMotion);
    }

    lastFrameData = currentFrameData;

    // Continue motion detection
    if (isMotionDetectionActive) {
        setTimeout(detectMotion, 200); // Faster check for more sensitivity (was 250)
    }
}

// Calculate motion level between two frames
function calculateMotionLevel(frame1, frame2) {
    let totalDiff = 0;
    const data1 = frame1.data;
    const data2 = frame2.data;
    let pixelCount = 0;

    // Sample every 3rd pixel for better sensitivity (was every 4th)
    for (let i = 0; i < data1.length; i += 12) { // Less skipping for more sensitivity (was 16)
        const diff = Math.abs(data1[i] - data2[i]) +
            Math.abs(data1[i + 1] - data2[i + 1]) +
            Math.abs(data1[i + 2] - data2[i + 2]);

        // Lower threshold for counting differences
        if (diff > 20) { // More sensitive (was 30)
            totalDiff += diff;
        }
        pixelCount++;
    }

    return pixelCount > 0 ? totalDiff / pixelCount : 0;
}

// Update motion indicator
function updateMotionIndicator(motionLevel) {
    // Use a lower threshold for the visual indicator for more sensitivity
    const visualThreshold = motionThreshold * 1.1; // Only 10% higher than base threshold (was 1.3)
    const isMoving = motionLevel > visualThreshold;

    if (isMoving) {
        cameraTrigger.style.backgroundColor = '#ff8888'; // Even softer red color
        cameraTrigger.textContent = 'Estabilizando...';
    } else {
        cameraTrigger.style.backgroundColor = 'black';
        cameraTrigger.textContent = 'Tomar foto';
    }

    // Reduced logging frequency for less console spam
    if (Math.random() < 0.1) { // Only log 10% of the time
        console.log('Motion level:', motionLevel.toFixed(2), 'Visual threshold:', visualThreshold.toFixed(2));
    }
}

// Start the video stream when the window loads
window.addEventListener("load", async function () {
    // Load gallery from localStorage first
    loadGalleryFromStorage();

    // Show storage info for debugging
    showStorageInfo();

    // Initialize user name (prompt if needed)
    await initializeUserName();

    // Check if camera is available before starting
    await checkCameraAvailability();

    // Then start the camera
    cameraStart();
}, false);

// Check camera availability and show warning if needed
async function checkCameraAvailability() {
    try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia not supported');
        }

        // Get list of video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            throw new Error('No camera devices found');
        }

        console.log(`Found ${videoDevices.length} camera device(s)`);

        // Test camera access briefly to check if it's available
        let testStream;
        try {
            testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false
            });
            
            // If we get here, camera is available
            console.log('Camera is available');
            
            // Stop the test stream immediately
            testStream.getTracks().forEach(track => track.stop());
            
        } catch (testError) {
            // Camera is not available, likely in use by another tab
            if (testError.name === 'NotReadableError') {
                await showCameraInUseWarning();
            } else {
                throw testError; // Re-throw other errors
            }
        }

    } catch (error) {
        console.warn('Camera availability check failed:', error);
        // Don't show error here, let cameraStart() handle it
    }
}

// Show warning when camera is in use by another tab
async function showCameraInUseWarning() {
    return Swal.fire({
        title: '⚠️ Cámara en uso',
        html: `
            <div style="text-align: center;">
                <p>La cámara parece estar en uso por otra pestaña o aplicación.</p>
                <div style="margin: 20px 0; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
                    <strong>Para usar la cámara:</strong><br>
                    • Cierra otras pestañas que usen la cámara<br>
                    • Cierra aplicaciones como Zoom, Teams, etc.<br>
                    • Luego haz clic en "Continuar"
                </div>
                <p style="font-size: 0.9em; color: #ccc;">
                    Si el problema persiste, intenta recargar la página.
                </p>
            </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Continuar',
        showCancelButton: true,
        cancelButtonText: 'Recargar página',
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            title: 'swal-title-white',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button'
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            // Reload the page
            window.location.reload();
        }
    });
}

//show photo in a sweet alert
function showPhoto(photoUrl, autoUploadOnClose = false) {
    Swal.fire({
        imageUrl: photoUrl,
        imageWidth: 'auto',
        imageHeight: 'auto',
        imageAlt: 'Foto tomada',
        showCloseButton: true,
        confirmButtonText: 'Subir',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        showDenyButton: false, // No deny button for this case
        denyButtonText: 'Descargar',
        width: '90vw', // 90% of viewport width
        heightAuto: false, // Prevent auto height
        background: 'rgba(0, 0, 0, 0.9)', // Dark semi-transparent background
        color: '#ffffff', // White text
        customClass: {
            popup: 'swal-responsive-popup',
            image: 'swal-responsive-image',
            title: 'swal-title-white',
            actions: 'swal-actions-inline',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button',
            denyButton: 'swal-download-button'
        },
        didOpen: () => {
            // Ensure image fits within viewport
            const image = document.querySelector('.swal2-image');
            if (image) {
                image.style.maxWidth = '100%';
                image.style.maxHeight = '70vh'; // Max 70% of viewport height
                image.style.objectFit = 'contain';
            }

            // Adjust layout for landscape orientation
            const popup = document.querySelector('.swal2-popup');
            if (window.innerWidth > window.innerHeight) {
                popup.classList.add('swal-landscape');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // User clicked "Subir" - always show success/error messages
            uploadPhoto(photoUrl, true);
        } else if (result.isDenied) {
            // User clicked "Descargar" - download the photo
            uploadPhoto(photoUrl, false);
            downloadPhoto(photoUrl, new Date().toISOString());
        } else if (autoUploadOnClose && (result.dismiss === Swal.DismissReason.close || result.dismiss === Swal.DismissReason.cancel || result.dismiss === Swal.DismissReason.backdrop)) {
            // Only upload silently if this was called after taking a new photo
            uploadPhoto(photoUrl, false);
        }
        // If opened from cameraOutput click, don't upload on close/cancel
    });
}

// Add photo to gallery
function addPhotoToGallery(photoDataUrl) {
    const photoData = {
        url: photoDataUrl,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random() // Unique ID
    };

    // Add to beginning of display gallery
    photoGallery.unshift(photoData);

    // Keep only the last 6 photos for display
    if (photoGallery.length > maxGallerySize) {
        photoGallery = photoGallery.slice(0, maxGallerySize);
    }

    // Add to persistent gallery (only first 3)
    persistentGallery.unshift(photoData);

    // Keep only the last 3 photos for storage
    if (persistentGallery.length > maxPersistentSize) {
        persistentGallery = persistentGallery.slice(0, maxPersistentSize);
    }

    // Save to localStorage
    saveGalleryToStorage();
}

// Show photo gallery
function showPhotoGallery() {
    if (photoGallery.length === 0) {
        Swal.fire({
            title: 'Galería vacía',
            text: 'No hay fotos tomadas aún',
            icon: 'info',
            confirmButtonText: 'Entendido',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            customClass: {
                popup: 'swal-responsive-popup',
                title: 'swal-title-white',
                confirmButton: 'swal-confirm-button'
            }
        });
        return;
    }

    // Create gallery HTML
    let galleryHTML = '<div class="photo-gallery">';

    photoGallery.forEach((photo, index) => {
        galleryHTML += `
            <div class="gallery-item" onclick="showGalleryPhoto('${photo.url}', ${index})">
                <img src="${photo.url}" alt="Foto ${index + 1}" class="gallery-thumbnail">
                <div class="gallery-item-info">
                    <span class="gallery-timestamp">${new Date(photo.timestamp).toLocaleString()}</span>
                </div>
            </div>
        `;
    });

    galleryHTML += '</div>';

    Swal.fire({
        title: 'Galería de Fotos',
        html: galleryHTML,
        width: '95vw',
        heightAuto: false,
        showCloseButton: true,
        showConfirmButton: false,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-gallery-popup',
            title: 'swal-title-white'
        },
        didOpen: () => {
            // Add responsive layout for landscape
            const popup = document.querySelector('.swal2-popup');
            if (window.innerWidth > window.innerHeight) {
                popup.classList.add('swal-gallery-landscape');
            }
        }
    });
}

// Show individual photo from gallery
function showGalleryPhoto(photoUrl, index) {
    const photo = photoGallery[index];
    const formattedDate = new Date(photo.timestamp).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    Swal.fire({
        html: `<div class="gallery-photo-info">
                  <div class="gallery-photo-timestamp">📅 ${formattedDate}</div>
               </div>`,
        imageUrl: photoUrl,
        imageWidth: 'auto',
        imageHeight: 'auto',
        imageAlt: 'Foto de galería',
        showCloseButton: true,
        confirmButtonText: 'Subir',
        showCancelButton: true,
        cancelButtonText: 'Volver a Galería',
        showDenyButton: true,
        denyButtonText: 'Descargar',
        width: '90vw',
        heightAuto: false,
        background: 'rgba(0, 0, 0, 0.9)',
        color: '#ffffff',
        customClass: {
            popup: 'swal-responsive-popup',
            image: 'swal-responsive-image',
            title: 'swal-title-white',
            actions: 'swal-actions-inline',
            confirmButton: 'swal-confirm-button',
            cancelButton: 'swal-cancel-button',
            denyButton: 'swal-download-button'
        },
        didOpen: () => {
            // Ensure image fits within viewport
            const image = document.querySelector('.swal2-image');
            if (image) {
                image.style.maxWidth = '100%';
                image.style.maxHeight = '70vh';
                image.style.objectFit = 'contain';
            }

            // Adjust layout for landscape orientation
            const popup = document.querySelector('.swal2-popup');
            if (window.innerWidth > window.innerHeight) {
                popup.classList.add('swal-landscape');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // User clicked "Subir" - show success/error messages
            uploadPhoto(photoUrl, true);
        } else if (result.isDenied) {
            // User clicked "Descargar" - download the photo
            downloadPhoto(photoUrl, photo.timestamp);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            // User clicked "Volver a Galería" - show gallery again
            showPhotoGallery();
        } else if (result.dismiss === Swal.DismissReason.close) {
            // User clicked the close button (X) - also return to gallery
            showPhotoGallery();
        }
        // Any other dismiss reason will just close
    });
}

// Make showGalleryPhoto globally accessible
window.showGalleryPhoto = showGalleryPhoto;

// Show photo gallery when clicked
cameraOutput.addEventListener('click', function () {
    if (cameraOutput.classList.contains("taken")) {
        showPhotoGallery();
    }
});

// Function to upload photo
async function uploadPhoto(imageDataUrl, showMessages = true) {
    try {
        // Show loading indicator only if messages are enabled
        if (showMessages) {
            Swal.fire({
                title: 'Subiendo foto...',
                text: 'Por favor espera mientras se procesa la foto',
                allowOutsideClick: false,
                showConfirmButton: false,
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#ffffff',
                customClass: {
                    popup: 'swal-responsive-popup',
                    title: 'swal-title-white'
                },
                didOpen: () => {
                    Swal.showLoading();
                }
            });
        }

        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();

        // Create form data for the backend endpoint
        const formData = new FormData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `camera-photo-${timestamp}.jpg`;

        formData.append('file', blob, filename);
        
        // Include user name if available
        if (userName && userName.trim() !== '') {
            formData.append('userName', userName.trim());
        }

        // Send to our backend endpoint
        const uploadResponse = await fetch('/api/upload-photo', {
            method: 'POST',
            body: formData
        });

        const result = await uploadResponse.json();

        if (uploadResponse.ok) {
            // Success - only show message if enabled
            if (showMessages) {
                let successMessage = 'La foto se ha guardado exitosamente';
                if (userName && userName.trim() !== '') {
                    successMessage += ` en la carpeta "${userName}-fotos"`;
                }
                
                Swal.fire({
                    title: '¡Foto guardada!',
                    text: successMessage,
                    icon: 'success',
                    timer: 2500,
                    showConfirmButton: false,
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: '#ffffff',
                    customClass: {
                        popup: 'swal-responsive-popup',
                        title: 'swal-title-white'
                    }
                });
            }
        } else {
            throw new Error(result.error || `Upload API error: ${uploadResponse.status}`);
        }
    } catch (error) {
        console.error('Error uploading photo:', error);

        // Show error message only if enabled
        if (showMessages) {
            Swal.fire({
                title: 'Error al guardar',
                text: 'No se pudo guardar la foto. Verifica la configuración del servidor.',
                icon: 'error',
                confirmButtonText: 'Entendido',
                background: 'rgba(0, 0, 0, 0.9)',
                color: '#ffffff',
                customClass: {
                    popup: 'swal-responsive-popup',
                    title: 'swal-title-white',
                    confirmButton: 'swal-confirm-button'
                }
            });
        }
    }
}

// Function to download photo
function downloadPhoto(imageDataUrl, timestamp) {
    try {
        // Create a download link
        const link = document.createElement('a');
        link.href = imageDataUrl;

        // Generate filename with timestamp and user name
        const date = new Date(timestamp);
        const formattedTimestamp = date.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
            date.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        let filename;
        if (userName && userName.trim() !== '') {
            filename = `${userName.trim()}-camera-photo-${formattedTimestamp}.jpg`;
        } else {
            filename = `camera-photo-${formattedTimestamp}.jpg`;
        }
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success message
        Swal.fire({
            title: '¡Descarga iniciada!',
            text: 'La foto se está descargando',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            customClass: {
                popup: 'swal-responsive-popup',
                title: 'swal-title-white'
            }
        });
    } catch (error) {
        console.error('Error downloading photo:', error);

        // Show error message
        Swal.fire({
            title: 'Error al descargar',
            text: 'No se pudo descargar la foto.',
            icon: 'error',
            confirmButtonText: 'Entendido',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            customClass: {
                popup: 'swal-responsive-popup',
                title: 'swal-title-white',
                confirmButton: 'swal-confirm-button'
            }
        });
    }
}

// Show storage info in console (for debugging)
function showStorageInfo() {
    if (!isLocalStorageAvailable()) {
        console.log('Storage Info: localStorage not available');
        return;
    }

    try {
        const gallerySize = getGalleryStorageSize();
        const totalStorage = JSON.stringify(localStorage).length;
        const availableSpace = getAvailableStorageSpace();
        const optimalSize = calculateOptimalPersistentSize();

        console.log('Storage Info:', {
            displayPhotos: photoGallery.length,
            persistentPhotos: persistentGallery.length,
            maxDisplay: maxGallerySize,
            maxPersistent: maxPersistentSize,
            optimalPersistent: optimalSize,
            gallerySize: `${(gallerySize / 1024).toFixed(2)} KB`,
            totalLocalStorage: `${(totalStorage / 1024).toFixed(2)} KB`,
            availableSpace: `${(availableSpace / 1024).toFixed(2)} KB`,
            storageAvailable: isLocalStorageAvailable()
        });
    } catch (error) {
        console.error('Error getting storage info:', error);
    }
}

// Dynamic storage optimization
function optimizeStorageSize() {
    if (!isLocalStorageAvailable()) {
        return;
    }

    const optimalSize = calculateOptimalPersistentSize();

    if (optimalSize < persistentGallery.length) {
        console.log(`Optimizing storage: reducing from ${persistentGallery.length} to ${optimalSize} photos`);
        persistentGallery = persistentGallery.slice(0, optimalSize);
        saveGalleryToStorage();
    }
}

// Add a function to manually add photos to session gallery (for testing)
function addSessionPhoto(photoDataUrl) {
    const photoData = {
        url: photoDataUrl,
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random(),
        sessionOnly: true // Mark as session-only
    };

    // Add to display gallery only (not persistent)
    photoGallery.unshift(photoData);

    // Keep only the last 6 photos for display
    if (photoGallery.length > maxGallerySize) {
        photoGallery = photoGallery.slice(0, maxGallerySize);
    }

    console.log(`Added session-only photo. Display: ${photoGallery.length}, Persistent: ${persistentGallery.length}`);
}

// Make storage functions available globally for debugging
window.clearGalleryFromStorage = clearGalleryFromStorage;
window.showStorageInfo = showStorageInfo;
window.optimizeStorageSize = optimizeStorageSize;
window.addSessionPhoto = addSessionPhoto;
window.calculateOptimalPersistentSize = calculateOptimalPersistentSize;