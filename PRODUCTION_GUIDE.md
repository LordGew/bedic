# 📋 Guía de Producción - BEDIC Project

## 🎯 Configuración Estable para Producción

### 🔧 Android Studio - Flutter App

#### NDK Configuration
```kotlin
// android/app/build.gradle.kts
android {
    ndkVersion = "26.1.10909125" // Versión estable
    
    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug") // Cambiar por keystore de producción
        }
    }
}
```

#### Firebase Configuration
```dart
// lib/main.dart
await Firebase.initializeApp(
  options: const FirebaseOptions(
    apiKey: "AIzaSyAYZugW4Z2XcNLsEu2WnCIyUWVdc-0dJgM",
    appId: "1:1090040857039:android:1234567890abcdef",
    messagingSenderId: "1090040857039",
    projectId: "bedic-production",
    storageBucket: "bedic-production.appspot.com",
  ),
);
```

### 🌐 URLs de Producción
- **Backend API:** `http://localhost:5000/api`
- **Panel Admin:** `http://localhost:4200`
- **Flutter Web:** `http://127.0.0.1:58868`

### 📱 Comandos de Ejecución

#### Backend
```bash
cd backend
npm start
```

#### Panel Admin
```bash
cd bedic-admin-panel
npm start
```

#### Flutter App
```bash
# Android
flutter run -d emulator-5554

# Web
flutter run -d edge

# Release Build
flutter build apk --release
```

### 🔐 Configuración de Keystore (Producción)
```bash
# Generar keystore
keytool -genkey -v -keystore bedic-release.keystore -alias bedic -keyalg RSA -keysize 2048 -validity 10000

# Configurar en android/app/build.gradle.kts
signingConfigs {
    create("release") {
        storeFile = file("../bedic-release.keystore")
        storePassword = "tu_password"
        keyAlias = "bedic"
        keyPassword = "tu_password"
    }
}
```

### 🚀 Despliegue Google Play Store
1. **Build APK Release:**
   ```bash
   flutter build apk --release --shrink
   ```

2. **Build App Bundle:**
   ```bash
   flutter build appbundle --release
   ```

### 📊 Monitoreo y Logs
- **Firebase Console:** https://console.firebase.google.com/
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **Google Play Console:** https://play.google.com/console

### ⚠️ Notas Importantes
- El NDK 26.1.10909125 es la versión más estable
- Firebase está configurado para manejar errores gracefully
- La app funciona completamente sin conexión a Firebase
- Los assets de localización están configurados para español/inglés

### 🔄 Actualizaciones Futuras
- Mantener Flutter SDK actualizado
- Actualizar dependencias con `flutter pub outdated`
- Revisar compatibilidad de NDK con cada actualización major

## 🎉 ¡Listo para producción!
