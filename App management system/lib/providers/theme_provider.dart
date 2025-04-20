import 'package:flutter/material.dart';

class ThemeProvider with ChangeNotifier {
  List<Color> _gradientColors = [
    Colors.blue,
    Colors.purple,
  ];

  List<Color> get gradientColors => _gradientColors;

  void updateGradientColors(List<Color> colors) {
    _gradientColors = colors;
    notifyListeners();
  }

  ThemeData get currentTheme => ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: AppBarTheme(
          backgroundColor: _gradientColors[0],
          foregroundColor: Colors.white,
        ),
        floatingActionButtonTheme: FloatingActionButtonThemeData(
          backgroundColor: _gradientColors[1],
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          selectedItemColor: _gradientColors[0],
          unselectedItemColor: Colors.grey,
        ),
      );
}
