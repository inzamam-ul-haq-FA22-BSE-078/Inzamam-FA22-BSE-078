import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'screens/login_screen.dart';
import 'screens/welcome_screen.dart';
import 'screens/student_management_screen.dart';
import 'screens/task_assignment_screen.dart';
import 'screens/reports_screen.dart';
import 'theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: 'https://oooieaswrqgkroldjkhg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb2llYXN3cnFna3JvbGRqa2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODA3MjAsImV4cCI6MjA2MzU1NjcyMH0.7-8WnWy7jRQFrI6xxpezYx5oKKpJUWMdd23HE_KuZaI',
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Admin App',
      theme: appTheme(),
      debugShowCheckedModeBanner: false, // Added to remove the debug banner
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/welcome': (context) => const WelcomeScreen(),
        '/admin_dashboard': (context) => const AdminDashboard(),
        '/student_management': (context) => const StudentManagementScreen(),
        '/task_assignment': (context) => const TaskAssignmentScreen(),
        '/reports': (context) => const ReportsScreen(),
      },
    );
  }
}

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({Key? key}) : super(key: key);

  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  final supabase = Supabase.instance.client;
  int totalStudents = 0;
  int totalTasks = 0;
  int completedTasks = 0;
  int pendingTasks = 0;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final students = await supabase.from('users').select().eq('role', 'student');
      final tasks = await supabase.from('tasks').select();
      setState(() {
        totalStudents = students.length;
        totalTasks = tasks.length;
        completedTasks = tasks.where((task) => task['status'] == 'completed').length;
        pendingTasks = tasks.where((task) => task['status'] == 'pending').length;
      });
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error fetching stats: $e'),
            backgroundColor: Colors.orange[900],
          ),
        );
      }
    }
  }

  void _onNavItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    final routes = [
      '/student_management',
      '/task_assignment',
      '/reports',
    ];
    Navigator.pushNamed(context, routes[index]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Admin Dashboard',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.logout, color: Colors.orange),
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, '/');
              }
            },
          ),
        ],
        flexibleSpace: CustomPaint(
          painter: WavePainter(),
          child: Container(),
        ),
      ),
      body: Container(
        color: Colors.white,
        child: Stack(
          children: [
            Positioned(
              bottom: 0,
              right: 0,
              child: CustomPaint(
                size: Size(120, 120),
                painter: CirclePainter(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildStatCard('Total Students', totalStudents.toString(), Icons.person),
                      _buildStatCard('Total Tasks', totalTasks.toString(), Icons.task),
                      _buildStatCard('Completed', completedTasks.toString(), Icons.check_circle),
                      _buildStatCard('Pending', pendingTasks.toString(), Icons.pending),
                    ],
                  ).animate().fadeIn(duration: 600.ms).slideY(duration: 600.ms, begin: 0.1),
                  SizedBox(height: 24),
                  Expanded(
                    child: Center(
                      child: Text(
                        'Select an action from the bottom menu',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.orange,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.orange, Colors.orange[700]!],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.orange.withOpacity(0.3),
              blurRadius: 8,
              offset: Offset(0, -2),
            ),
          ],
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onNavItemTapped,
          selectedItemColor: Colors.white,
          unselectedItemColor: Colors.orange[200],
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          items: [
            BottomNavigationBarItem(
              icon: Icon(Icons.people_alt, size: 28),
              label: 'Students',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.assignment_add, size: 28),
              label: 'Tasks',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.bar_chart, size: 28),
              label: 'Reports',
            ),
          ],
        ),
      ).animate().slideY(duration: 500.ms, begin: 0.2),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon) {
    return Expanded(
      child: Card(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: Colors.orange, width: 1.5),
        ),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.orange, size: 24),
              SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(color: Colors.orange[700], fontSize: 14, fontWeight: FontWeight.w500),
              ),
              SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  color: Colors.orange,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().scale(duration: 500.ms, curve: Curves.easeOut).slideY(duration: 500.ms, begin: 0.1);
  }
}

class CirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange.withOpacity(0.4)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange.withOpacity(0.3)
      ..style = PaintingStyle.fill;
    final path = Path();
    path.moveTo(0, size.height * 0.8);
    path.quadraticBezierTo(
      size.width * 0.25,
      size.height * 0.9,
      size.width * 0.5,
      size.height * 0.8,
    );
    path.quadraticBezierTo(
      size.width * 0.75,
      size.height * 0.7,
      size.width,
      size.height * 0.8,
    );
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}