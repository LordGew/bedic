import 'auth_service.dart';

// Lightweight stub for web builds where firebase_messaging_web caused build issues.
// This keeps the API surface used by the app but performs no FCM operations.
class NotificationService {
  final AuthService _authService;

  NotificationService(this._authService);

  /// No-op initialize on web. Keep signature to match the IO implementation.
  Future<void> initialize() async {
    // Optionally, add debugging logs or analytics for permission status.
    return;
  }

  // No-op token registration for web stub.
  void _registerTokenWithBackend() async {
    return;
  }

  // No-op foreground handler setup for web stub.
  void _setupForegroundHandler() {
    return;
  }
}
