class AppAuthState {
  static String? _currentUserId;

  static String? get currentUserId => _currentUserId;

  static void setCurrentUserId(String? userId) {
    _currentUserId = userId;
  }

  static void clear() {
    _currentUserId = null;
  }
}