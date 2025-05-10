import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Data Submission',
      theme: ThemeData(
        primaryColor: Color(0xFF005C97),
        scaffoldBackgroundColor: Color(0xFFF5F7FA),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Color(0xFFCED4DA)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Color(0xFF005C97), width: 2),
          ),
          labelStyle: TextStyle(color: Colors.grey[800]),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(0xFF005C97),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            padding: EdgeInsets.symmetric(vertical: 16),
            textStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ),
      debugShowCheckedModeBanner: false,
      home: MongoForm(),
    );
  }
}

class MongoForm extends StatefulWidget {
  @override
  _MongoFormState createState() => _MongoFormState();
}

class _MongoFormState extends State<MongoForm> with SingleTickerProviderStateMixin {
  final nameController = TextEditingController();
  final emailController = TextEditingController();

  late AnimationController _animationController;
  late Animation<double> _fadeInAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeInAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    );
    _animationController.forward();
  }

  Future<void> sendData(String name, String email) async {
    final url = Uri.parse('http://192.168.100.205:5000/addData');
    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': name, 'email': email}),
      );

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        showCustomSnackBar(result['message'], Colors.green);
      } else {
        showCustomSnackBar('❌ Failed to send data', Colors.red);
      }
    } catch (e) {
      showCustomSnackBar('❌ Error: $e', Colors.red);
    }
  }

  void showCustomSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: EdgeInsets.all(16),
        duration: Duration(seconds: 3),
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'MongoDB DCA ',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
        backgroundColor: Theme.of(context).primaryColor,
        centerTitle: true,
        elevation: 4,
      ),
      body: FadeTransition(
        opacity: _fadeInAnimation,
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(20),
            child: Container(
              padding: EdgeInsets.all(24),
              width: 380,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 12,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.person_add_alt_1, size: 80, color: Theme.of(context).primaryColor),
                  SizedBox(height: 12),
                  Text(
                    'Data Collection',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[800],
                    ),
                  ),
                  SizedBox(height: 30),
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(labelText: 'Name'),
                  ),
                  SizedBox(height: 20),
                  TextField(
                    controller: emailController,
                    decoration: InputDecoration(labelText: 'Email'),
                  ),
                  SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: Icon(Icons.send),
                      label: Text('Submit Details'),
                      onPressed: () {
                        final name = nameController.text.trim();
                        final email = emailController.text.trim();
                        if (name.isNotEmpty && email.isNotEmpty) {
                          sendData(name, email);
                        } else {
                          showCustomSnackBar('⚠ Please fill all fields', Colors.orange);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}