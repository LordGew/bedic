// Conditional export: pick platform-specific implementation.
// Use the Firebase-backed implementation on non-web platforms, and a lightweight
// no-op stub for web. This avoids compiling firebase_messaging_web when the
// web implementation causes build-time interop errors in some setups.
export 'notification_service_io.dart'
  if (dart.library.html) 'notification_service_web.dart';