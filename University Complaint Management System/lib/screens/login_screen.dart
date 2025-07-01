import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'admin_dashboard.dart';
import 'student_dashboard.dart';
import 'advisor_dashboard.dart';
import 'hod_dashboard.dart';
import 'director_dashboard.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final SupabaseClient supabase = Supabase.instance.client;
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Color Scheme
  final Color _primaryBlue = const Color(0xFF2962FF);
  final Color _primaryPurple = const Color(0xFF9C27B0);
  final Color _lightBlue = const Color(0xFFE3F2FD);
  final Color _darkBlue = const Color(0xFF0D47A1);
  final Color _darkPurple = const Color(0xFF6A1B9A);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutQuint),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );

    _colorAnimation = ColorTween(
      begin: _primaryBlue.withOpacity(0.5),
      end: _primaryPurple.withOpacity(0.8),
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _controller.forward();
    _controller.addListener(() {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final userData = await supabase
          .from('users')
          .select()
          .eq('email', _emailController.text.trim())
          .maybeSingle();
      if (userData == null) {
        throw Exception('User not found');
      }
      if (userData['password'] != _passwordController.text.trim()) {
        throw Exception('Invalid password');
      }
      final role = userData['role'] as String?;
      final userId = userData['id'] as String;
      if (role == null) {
        throw Exception('Role not assigned');
      }
      Widget destination;
      switch (role) {
        case 'admin':
          destination = AdminDashboard(userId: userId);
          break;
        case 'student':
          destination = StudentDashboard(userId: userId);
          break;
        case 'advisor':
          destination = AdvisorDashboard(userId: userId);
          break;
        case 'hod':
          destination = HODDashboard(userId: userId);
          break;
        default:
          destination = DirectorDashboard(userId: userId);
      }
      if (mounted) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => destination));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login failed: ${e.toString()}'),
            backgroundColor: Colors.red.withOpacity(0.9),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [_primaryBlue, _primaryPurple],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            stops: const [0.3, 0.7],
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Transform.scale(
                scale: _scaleAnimation.value,
                child: FadeTransition(
                  opacity: _fadeAnimation,
                  child: Card(
                    elevation: 20,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(25),
                        gradient: LinearGradient(
                          colors: [_lightBlue, Colors.white],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: _colorAnimation.value ?? _primaryBlue,
                            blurRadius: 20,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(28.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Animated Logo
                            

                            const SizedBox(height: 25),

                            // Title with subtle animation
                            TweenAnimationBuilder(
                              tween: Tween<double>(begin: 0, end: 1),
                              duration: const Duration(milliseconds: 800),
                              builder: (context, value, child) {
                                return Transform.translate(
                                  offset: Offset(0, 20 * (1 - value)),
                                  child: Opacity(
                                    opacity: value,
                                    child: child,
                                  ),
                                );
                              },
                              child: Text(
                                'University Complaint System',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: _darkBlue,
                                  letterSpacing: 1.2,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),

                            const SizedBox(height: 30),

                            // Email Field
                            TextField(
                              controller: _emailController,
                              style: TextStyle(color: _darkBlue),
                              decoration: InputDecoration(
                                labelText: 'Email',
                                labelStyle: TextStyle(color: _darkBlue.withOpacity(0.7)),
                                prefixIcon: FaIcon(
                                  FontAwesomeIcons.envelope,
                                  color: _primaryBlue,
                                  size: 18,
                                ),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.8),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide(
                                    color: _primaryBlue,
                                    width: 2,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    vertical: 16, horizontal: 20),
                              ),
                            ),

                            const SizedBox(height: 20),

                            // Password Field
                            TextField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              style: TextStyle(color: _darkBlue),
                              decoration: InputDecoration(
                                labelText: 'Password',
                                labelStyle: TextStyle(color: _darkBlue.withOpacity(0.7)),
                                prefixIcon: FaIcon(
                                  FontAwesomeIcons.lock,
                                  color: _primaryBlue,
                                  size: 18,
                                ),
                                suffixIcon: IconButton(
                                  icon: FaIcon(
                                    _obscurePassword
                                        ? FontAwesomeIcons.eyeSlash
                                        : FontAwesomeIcons.eye,
                                    color: _primaryBlue,
                                    size: 18,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                filled: true,
                                fillColor: Colors.white.withOpacity(0.8),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide.none,
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(15),
                                  borderSide: BorderSide(
                                    color: _primaryBlue,
                                    width: 2,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    vertical: 16, horizontal: 20),
                              ),
                            ),

                            const SizedBox(height: 30),

                            // Login Button
                            Material(
                              borderRadius: BorderRadius.circular(15),
                              elevation: 5,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(15),
                                onTap: _isLoading ? null : _login,
                                child: Ink(
                                  width: double.infinity,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(15),
                                    gradient: LinearGradient(
                                      colors: [_primaryBlue, _primaryPurple],
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                    ),
                                  ),
                                  child: Center(
                                    child: _isLoading
                                        ? const SpinKitThreeBounce(
                                      color: Colors.white,
                                      size: 20,
                                    )
                                        : const Text(
                                      'Login',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}