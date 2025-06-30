import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'screens/login_screen.dart';
import 'providers/theme_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'https://tjpddpjysowbaodzjrqf.supabase.co', // Replace with your Supabase Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcGRkcGp5c293YmFvZHpqcnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNTQwNjAsImV4cCI6MjA2NjgzMDA2MH0.CfDc_gXQ81s3Wdi9Zibh6qOKWyMtWqZyCQwQ5msv6P0', // Replace with your Supabase Anon Key
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) => MaterialApp(
          title: 'University Complaint System',
          theme: ThemeData(
            primaryColor: Color(int.parse(themeProvider.appBarColor.replaceFirst('#', '0xFF'))),
            scaffoldBackgroundColor: Color(int.parse(themeProvider.bodyColor.replaceFirst('#', '0xFF'))),
            textTheme: TextTheme(
              bodyMedium: TextStyle(fontSize: themeProvider.fontSize.toDouble(), color: Colors.black),
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7B1FA2), // Purple
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            cardTheme: CardTheme(
              elevation: 5,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
          ),
          home: const LoginScreen(),
        ),
      ),
    );
  }
}