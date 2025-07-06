# Camera to Google Drive Service

Este es un servicio Spring Boot que permite capturar fotos desde una cámara web y subirlas automáticamente a Google Drive.

## Configuración de Google Drive

### 1. Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Drive:
   - Ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Drive API"
   - Haz clic en "Habilitar"

### 2. Crear una Cuenta de Servicio

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "Cuenta de servicio"
3. Proporciona un nombre y descripción para la cuenta de servicio
4. Asigna el rol "Editor" o "Propietario" (o un rol personalizado con permisos de Drive)
5. Haz clic en "Crear"

### 3. Descargar las Credenciales

1. En la página de credenciales, busca tu cuenta de servicio
2. Haz clic en el ícono de lápiz para editarla
3. Ve a la pestaña "Claves"
4. Haz clic en "Agregar clave" > "Crear nueva clave"
5. Selecciona "JSON" y descarga el archivo
6. Guarda el archivo como `service-account-key.json` en `src/main/resources/`

### 4. Configurar la Carpeta de Google Drive (Opcional)

Si quieres que las fotos se suban a una carpeta específica:

1. Crea una carpeta en tu Google Drive
2. Haz clic derecho en la carpeta y selecciona "Compartir"
3. Comparte la carpeta con el email de la cuenta de servicio (está en el archivo JSON)
4. Copia el ID de la carpeta desde la URL (la parte después de `/folders/`)
5. Agrega el ID a `application.properties`:
   ```properties
   google.drive.folder.id=TU_FOLDER_ID_AQUI
   ```

## Configuración del Aplicativo

### Archivo application.properties

```properties
# Configuración de Google Drive
google.drive.credentials.path=src/main/resources/service-account-key.json
google.drive.folder.id=

# Configuración de logging
logging.level.web=DEBUG
```

### Dependencias Maven

El proyecto incluye las siguientes dependencias para Google Drive:

```xml
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
```

## Ejecución

1. Instala las dependencias:
   ```bash
   mvn clean install
   ```

2. Ejecuta la aplicación:
   ```bash
   mvn spring-boot:run
   ```

3. Abre tu navegador y ve a `http://localhost:8080`

## Endpoints de la API

### Subir Foto
- **POST** `/api/upload-photo`
- Parámetros: `file` (MultipartFile)
- Respuesta: JSON con el ID del archivo subido

### Estado de Google Drive
- **GET** `/api/drive-status`
- Respuesta: JSON con el estado de la configuración

## Funcionalidades

- **Captura de fotos**: Interfaz web para tomar fotos con la cámara
- **Detección de movimiento**: Captura automática cuando detecta movimiento
- **Subida automática**: Las fotos se suben automáticamente a Google Drive
- **Validación de archivos**: Solo acepta imágenes
- **Gestión de errores**: Manejo robusto de errores con mensajes informativos

## Seguridad

- Las credenciales de la cuenta de servicio deben mantenerse seguras
- No subas el archivo `service-account-key.json` a repositorios públicos
- Considera usar variables de entorno para la configuración en producción

## Troubleshooting

### Error "Google Drive no configurado"
- Verifica que el archivo `service-account-key.json` existe
- Asegúrate de que la ruta en `application.properties` es correcta
- Revisa que la cuenta de servicio tiene permisos

### Error "Failed to upload photo"
- Verifica que la API de Google Drive está habilitada
- Asegúrate de que la cuenta de servicio tiene permisos de escritura
- Si usas una carpeta específica, verifica que está compartida con la cuenta de servicio

### Archivos no aparecen en Drive
- Las fotos se suben a "Mi Drive" si no se especifica una carpeta
- Si especificaste una carpeta, verifica el ID en la configuración
- Revisa que la carpeta está compartida con la cuenta de servicio
