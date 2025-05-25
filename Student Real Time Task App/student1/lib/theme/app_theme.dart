import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    primarySwatch: Colors.orange, // Orange as the primary color (~#FF5722)
    scaffoldBackgroundColor: Colors.white, // White background for a clean look
    textTheme: GoogleFonts.poppinsTextTheme().apply(
      bodyColor: Colors.black87, // Dark text for readability on white
      displayColor: Colors.black87,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.orange, // Orange buttons
        foregroundColor: Colors.white, // White text/icons on buttons
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 8,
        shadowColor: Colors.orangeAccent.withOpacity(0.3), // Subtle shadow
      ),
    ),
    cardTheme: CardTheme(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      color: Colors.orange[100], // Light orange for cards (~#FFCCBC)
      shadowColor: Colors.orangeAccent.withOpacity(0.2), // Subtle shadow
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.orange, // Orange app bar
      foregroundColor: Colors.white, // White text/icons on app bar
      elevation: 0,
      titleTextStyle: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    iconTheme: const IconThemeData(
      color: Colors.orange, // Orange icons by default
    ),
  );

  static ThemeData darkTheme = ThemeData(
    primarySwatch: Colors.orange,
    scaffoldBackgroundColor: Colors.grey[900]!, // Dark background
    textTheme: GoogleFonts.poppinsTextTheme().apply(
      bodyColor: Colors.white, // White text for readability on dark
      displayColor: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.orange, // Orange buttons
        foregroundColor: Colors.white, // White text/icons on buttons
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 8,
        shadowColor: Colors.orangeAccent.withOpacity(0.3),
      ),
    ),
    cardTheme: CardTheme(
      elevation: 6,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      color: Colors.orange[200], // Slightly darker light orange for dark theme
      shadowColor: Colors.orangeAccent.withOpacity(0.2),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.orange,
      foregroundColor: Colors.white,
      elevation: 0,
      titleTextStyle: GoogleFonts.poppins(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    iconTheme: const IconThemeData(
      color: Colors.orange,
    ),
  );
}