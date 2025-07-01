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
  late Animation<double> _slideAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<Color?> _glowAnimation;
  bool _isLoading = false;
  bool _obscurePassword = true;

  // New Color Scheme
  final Color _primaryTeal = const Color(0xFF26A69A);
  final Color _accentOrange = const Color(0xFFF57C00);
  final Color _softGray = const Color(0xFFE0E0E0);
  final Color _darkTeal = const Color(0xFF00695C);
  final Color _lightOrange = const Color(0xFFFFB74D);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _slideAnimation = Tween<double>(begin: -200, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutExpo),
    );

    _rotateAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCirc),
    );

    _glowAnimation = ColorTween(
      begin: _primaryTeal.withOpacity(0.3),
      end: _accentOrange.withOpacity(0.7),
    ).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );

    _controller.forward();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _controller.repeat(period: const Duration(seconds: 2));
      }
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
            colors: [_primaryTeal, _accentOrange],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            stops: const [0.2, 0.8],
          ),
        ),
        child: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(_slideAnimation.value, 0),
                child: Card(
                  elevation: 25,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  color: Colors.white.withOpacity(0.2),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(30),
                    child: BackdropFilter(
                      filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: _glowAnimation.value ?? _primaryTeal, width: 1.5),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(32.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Rotating Logo
                              TweenAnimationBuilder(
                                tween: Tween<double>(begin: 0, end: _rotateAnimation.value * 2 * 3.1416),
                                duration: const Duration(milliseconds: 1200),
                                builder: (context, double angle, child) {
                                  return Transform.rotate(
                                    angle: angle,
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 800),
                                      padding: const EdgeInsets.all(15),
                                      decoration: BoxDecoration(
                                        color: _softGray,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: _lightOrange.withOpacity(0.5),
                                            blurRadius: 15,
                                            spreadRadius: 3,
                                          ),
                                        ],
                                      ),
                                      child: FaIcon(
                                        FontAwesomeIcons.university,
                                        size: 60,
                                        color: _darkTeal,
                                      ),
                                    ),
                                  );
                                },
                              ),

                              const SizedBox(height: 30),

                              // Title with fade and scale
                              TweenAnimationBuilder(
                                tween: Tween<double>(begin: 0, end: 1),
                                duration: const Duration(milliseconds: 1000),
                                builder: (context, value, child) {
                                  return Opacity(
                                    opacity: value,
                                    child: Transform.scale(
                                      scale: value,
                                      child: child,
                                    ),
                                  );
                                },
                                child: Text(
                                  'University Portal',
                                  style: TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w600,
                                    color: _darkTeal,
                                    letterSpacing: 1.5,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),

                              const SizedBox(height: 35),

                              // Email Field
                              TextField(
                                controller: _emailController,
                                style: TextStyle(color: _darkTeal),
                                decoration: InputDecoration(
                                  labelText: 'Email',
                                  labelStyle: TextStyle(color: _darkTeal.withOpacity(0.6)),
                                  prefixIcon: FaIcon(
                                    FontAwesomeIcons.envelope,
                                    color: _primaryTeal,
                                    size: 20,
                                  ),
                                  filled: true,
                                  fillColor: _softGray.withOpacity(0.9),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(20),
                                    borderSide: BorderSide.none,
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(20),
                                    borderSide: BorderSide(
                                      color: _accentOrange,
                                      width: 2.5,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      vertical: 18, horizontal: 22),
                                ),
                              ),

                              const SizedBox(height: 20),

                              // Password Field
                              TextField(
                                controller: _passwordController,
                                obscureText: _obscurePassword,
                                style: TextStyle(color: _darkTeal),
                                decoration: InputDecoration(
                                  labelText: 'Password',
                                  labelStyle: TextStyle(color: _darkTeal.withOpacity(0.6)),
                                  prefixIcon: FaIcon(
                                    FontAwesomeIcons.lock,
                                    color: _primaryTeal,
                                    size: 20,
                                  ),
                                  suffixIcon: IconButton(
                                    icon: AnimatedSwitcher(
                                      duration: const Duration(milliseconds: 300),
                                      transitionBuilder: (child, animation) {
                                        return FadeTransition(opacity: animation, child: child);
                                      },
                                      child: FaIcon(
                                        key: ValueKey<bool>(_obscurePassword),
                                        _obscurePassword ? FontAwesomeIcons.eyeSlash : FontAwesomeIcons.eye,
                                        color: _accentOrange,
                                        size: 20,
                                      ),
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _obscurePassword = !_obscurePassword;
                                      });
                                    },
                                  ),
                                  filled: true,
                                  fillColor: _softGray.withOpacity(0.9),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(20),
                                    borderSide: BorderSide.none,
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(20),
                                    borderSide: BorderSide(
                                      color: _accentOrange,
                                      width: 2.5,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                      vertical: 18, horizontal: 22),
                                ),
                              ),

                              const SizedBox(height: 35),

                              // Pulsating Login Button
                              TweenAnimationBuilder(
                                tween: Tween<double>(begin: 1, end: 1.05),
                                duration: const Duration(milliseconds: 1000),
                                curve: Curves.easeInOut,
                                builder: (context, scale, child) {
                                  return Transform.scale(
                                    scale: scale,
                                    child: child,
                                  );
                                },
                                child: Material(
                                  borderRadius: BorderRadius.circular(20),
                                  elevation: 8,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(20),
                                    onTap: _isLoading ? null : _login,
                                    child: Ink(
                                      width: double.infinity,
                                      height: 55,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(20),
                                        gradient: LinearGradient(
                                          colors: [_primaryTeal, _accentOrange],
                                          begin: Alignment.centerLeft,
                                          end: Alignment.centerRight,
                                        ),
                                      ),
                                      child: Center(
                                        child: _isLoading
                                            ? const SpinKitThreeBounce(
                                          color: Colors.white,
                                          size: 22,
                                        )
                                            : const Text(
                                          'Sign In',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 18,
                                            fontWeight: FontWeight.w600,
                                          ),
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
      ),
    );
  }
}