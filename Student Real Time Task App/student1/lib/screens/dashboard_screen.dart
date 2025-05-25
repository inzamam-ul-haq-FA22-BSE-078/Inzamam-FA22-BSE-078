import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import '../services/supabase_service.dart';
import '../models/user.dart';
import 'app_auth_state.dart';
import 'package:student1/theme/app_theme.dart'; // Import AppTheme

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  AppUser? _user;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchUser();
  }

  Future<void> _fetchUser() async {
    try {
      final user = await _supabaseService.getCurrentUser();
      print('Fetched user: $user');
      if (user == null) {
        setState(() {
          _errorMessage = 'No user found. Please log in again or contact admin.';
        });
        return;
      }
      setState(() {
        _user = user;
      });
    } catch (e) {
      print('Error fetching user: $e');
      setState(() {
        _errorMessage = 'Error loading user data: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: AppTheme.lightTheme, // Apply lightTheme from AppTheme
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                AppAuthState.clear();
                Navigator.pushReplacementNamed(context, '/');
              },
            ),
          ],
        ),
        body: _errorMessage != null
            ? Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _errorMessage!,
                style: const TextStyle(fontSize: 18, color: Colors.redAccent),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  AppAuthState.clear();
                  Navigator.pushReplacementNamed(context, '/');
                },
                child: const Text('Return to Login'),
              ),
            ],
          ),
        )
            : _user == null
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(8.0), // Reduced padding
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FadeInDown(
                  child: Text(
                    'Welcome, ${_user!.name}!',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange[900], // Darker orange for contrast
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 20, // Reduced spacing
                  mainAxisSpacing: 20, // Reduced spacing
                  childAspectRatio: 1.6, // Reduced to increase height (taller cards)
                  children: [
                    _buildDashboardBox(
                      context,
                      icon: Icons.task_alt,
                      color: Colors.orange,
                      title: 'My Tasks',
                      route: '/tasks',
                    ),
                    _buildDashboardBox(
                      context,
                      icon: Icons.show_chart,
                      color: Colors.orange,
                      title: 'Progress',
                      route: '/progress',
                    ),
                    _buildDashboardBox(
                      context,
                      icon: Icons.calendar_today,
                      color: Colors.orange,
                      title: 'Task Calendar',
                      route: '/calendar',
                    ),
                    _buildDashboardBox(
                      context,
                      icon: Icons.person,
                      color: Colors.orange,
                      title: 'Profile',
                      route: '/profile',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDashboardBox(
      BuildContext context, {
        required IconData icon,
        required Color color,
        required String title,
        required String route,
      }) {
    return FadeInUp(
      delay: const Duration(milliseconds: 100),
      child: GestureDetector(
        onTap: () => Navigator.pushNamed(context, route),
        child: Card(
          elevation: AppTheme.lightTheme.cardTheme.elevation,
          shape: AppTheme.lightTheme.cardTheme.shape,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 36, // Adjusted size for better fit
                color: color,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14, // Smaller font for better fit
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}