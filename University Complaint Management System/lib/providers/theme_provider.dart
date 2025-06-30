import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ThemeProvider with ChangeNotifier {
  String _appBarColor = '#2196F3'; // Blue
  String _bodyColor = '#FFFFFF'; // White
  int _fontSize = 16;

  String get appBarColor => _appBarColor;
  String get bodyColor => _bodyColor;
  int get fontSize => _fontSize;

  ThemeProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final supabase = Supabase.instance.client;
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      final settings = await supabase.from('settings').select().eq('user_id', userId).maybeSingle();
      if (settings != null) {
        _appBarColor = settings['appbar_color'] ?? '#2196F3';
        _bodyColor = settings['body_color'] ?? '#FFFFFF';
        _fontSize = settings['font_size'] ?? 16;
        notifyListeners();
      }
    }
  }

  Future<void> updateSettings(String appBarColor, String bodyColor, int fontSize) async {
    _appBarColor = appBarColor;
    _bodyColor = bodyColor;
    _fontSize = fontSize;
    notifyListeners();
    final supabase = Supabase.instance.client;
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      await supabase.from('settings').upsert({
        'user_id': userId,
        'appbar_color': appBarColor,
        'body_color': bodyColor,
        'font_size': fontSize,
      });
    }
  }
}