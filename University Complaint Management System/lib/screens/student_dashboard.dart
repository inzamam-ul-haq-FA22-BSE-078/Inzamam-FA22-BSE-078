import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Add this import
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'complaint_timeline.dart';
import 'new_complaint_screen.dart';
import 'login_screen.dart';

class StudentDashboard extends StatefulWidget {
  final String userId;
  const StudentDashboard({super.key, required this.userId});

  @override
  _StudentDashboardState createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> with SingleTickerProviderStateMixin {
  final SupabaseClient supabase = Supabase.instance.client;
  String _filterStatus = 'All';
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  Map<String, String> _previousStatuses = {};

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
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.forward();

    supabase.from('complaints').stream(primaryKey: ['id']).eq('student_id', widget.userId).listen((data) {
      if (mounted) {
        setState(() {
          for (var complaint in data) {
            final id = complaint['id'].toString();
            final currentStatus = complaint['status'] ?? 'Unknown';
            final previousStatus = _previousStatuses[id] ?? 'Pending';
            if (currentStatus != previousStatus && currentStatus != 'Pending') {
              _showStatusUpdateAlert(complaint['title'] ?? 'Untitled', currentStatus);
            }
            _previousStatuses[id] = currentStatus;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _showStatusUpdateAlert(String title, String status) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            'Status Update',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: _primaryBlue,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.notifications_active,
                size: 50,
                color: _primaryPurple,
              ),
              const SizedBox(height: 15),
              Text(
                'Your complaint "$title" status is now $status',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                'OK',
                style: TextStyle(color: _primaryBlue),
              ),
            ),
          ],
          backgroundColor: Colors.white,
          elevation: 15,
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _lightBlue,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light, // For light status bar icons
          statusBarBrightness: Brightness.dark, // For dark status bar icons
        ),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const FaIcon(FontAwesomeIcons.bars, color: Colors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text(
          'Student Dashboard',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.plus, color: Colors.white),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => NewComplaintScreen(),
                settings: RouteSettings(arguments: widget.userId),
              ),
            ),
          ),
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.signOutAlt, color: Colors.white),
            onPressed: () => Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            ),
          ),
        ],
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_primaryBlue, _primaryPurple],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
        ),
        elevation: 10,
      ),
      drawer: Drawer(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.white, _lightBlue],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: ListView(
            padding: EdgeInsets.zero,
            children: [
              FutureBuilder<Map<String, dynamic>>(
                future: supabase.from('users').select().eq('id', widget.userId).single(),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) {
                    return Center(
                      child: SpinKitFadingCircle(color: _primaryPurple),
                    );
                  }
                  final user = snapshot.data!;
                  return UserAccountsDrawerHeader(
                    accountName: Text(
                      user['name'] ?? 'Unknown',
                      style: const TextStyle(color: Colors.white),
                    ),
                    accountEmail: Text(
                      user['email'] ?? 'Unknown',
                      style: const TextStyle(color: Colors.white),
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_primaryBlue, _primaryPurple],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  );
                },
              ),
              ListTile(
                leading: FaIcon(
                  FontAwesomeIcons.signOutAlt,
                  color: _primaryBlue,
                ),
                title: Text(
                  'Logout',
                  style: TextStyle(color: _primaryBlue),
                ),
                onTap: () => Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                ),
              ),
            ],
          ),
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                elevation: 8,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    'Your Complaints',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _darkBlue,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                elevation: 6,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: _filterStatus,
                    icon: FaIcon(
                      FontAwesomeIcons.filter,
                      color: _primaryPurple,
                      size: 16,
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'All',
                        child: Text('All Complaints'),
                      ),
                      DropdownMenuItem(
                        value: 'Pending',
                        child: Text('Pending'),
                      ),
                      DropdownMenuItem(
                        value: 'Escalated to HOD',
                        child: Text('Escalated to HOD'),
                      ),
                      DropdownMenuItem(
                        value: 'Escalated to Director',
                        child: Text('Escalated to Director'),
                      ),
                      DropdownMenuItem(
                        value: 'Resolved',
                        child: Text('Resolved'),
                      ),
                      DropdownMenuItem(
                        value: 'Rejected',
                        child: Text('Rejected'),
                      ),
                    ],
                    onChanged: (value) => setState(() => _filterStatus = value!),
                    style: TextStyle(color: _darkBlue),
                    dropdownColor: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: StreamBuilder<List<Map<String, dynamic>>>(
                stream: supabase.from('complaints').stream(primaryKey: ['id']).eq('student_id', widget.userId),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(
                      child: SpinKitFadingCircle(color: _primaryPurple),
                    );
                  }
                  if (snapshot.hasError) {
                    return Center(
                      child: Text(
                        'Error loading complaints',
                        style: TextStyle(color: _darkBlue),
                      ),
                    );
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return Center(
                      child: Text(
                        'No complaints found',
                        style: TextStyle(color: _darkBlue),
                      ),
                    );
                  }
                  final complaints = snapshot.data!;
                  final filteredComplaints = _filterStatus == 'All'
                      ? complaints
                      : complaints.where((c) => c['status'] == _filterStatus).toList();
                  return ListView.builder(
                    padding: const EdgeInsets.all(8.0),
                    itemCount: filteredComplaints.length,
                    itemBuilder: (context, index) {
                      final complaint = filteredComplaints[index];
                      return Card(
                        elevation: 4,
                        margin: const EdgeInsets.symmetric(
                            vertical: 6, horizontal: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ComplaintTimeline(
                                  complaintId: complaint['id'].toString()),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Row(
                              children: [
                                FaIcon(
                                  FontAwesomeIcons.fileAlt,
                                  color: _primaryBlue,
                                  size: 24,
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        complaint['title'] ?? 'Untitled',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: _darkBlue,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Status: ${complaint['status'] ?? 'Unknown'}',
                                        style: TextStyle(
                                          color: _getStatusColor(complaint['status']),
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  Icons.chevron_right,
                                  color: _primaryPurple,
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Resolved':
        return Colors.green;
      case 'Rejected':
        return Colors.red;
      case 'Pending':
        return Colors.orange;
      default:
        return _primaryPurple;
    }
  }
}