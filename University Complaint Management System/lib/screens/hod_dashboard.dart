import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'settings_screen.dart';
import 'complaint_timeline.dart';
import 'login_screen.dart';

class HODDashboard extends StatefulWidget {
  final String userId;
  const HODDashboard({super.key, required this.userId});

  @override
  _HODDashboardState createState() => _HODDashboardState();
}

class _HODDashboardState extends State<HODDashboard> with SingleTickerProviderStateMixin {
  final SupabaseClient supabase = Supabase.instance.client;
  String _filterStatus = 'All';
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

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
    supabase.from('complaints').stream(primaryKey: ['id']).eq('hod_id', widget.userId).listen((data) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(String complaintId, String newStatus, String comment) async {
    try {
      final response = await supabase.from('complaints').select('comments').eq('id', complaintId).single();
      final comments = (response['comments'] as List<dynamic>? ?? []).cast<Map<String, dynamic>>();
      comments.add({
        'text': comment,
        'by': (await supabase.from('users').select('email').eq('id', widget.userId).maybeSingle())?['email'] ?? 'Unknown',
        'timestamp': DateTime.now().toIso8601String(),
      });
      await supabase.from('complaints').update({
        'status': newStatus,
        'updated_at': DateTime.now().toIso8601String(),
        'comments': comments,
      }).eq('id', complaintId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Complaint $newStatus successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: ${e.toString()}')));
      }
    }
  }

  Future<void> _escalateToDirector(String complaintId) async {
    try {
      final director = await supabase.from('users').select('id').eq('role', 'director').maybeSingle();
      if (director == null) {
        throw Exception('No director found');
      }
      final directorId = director['id'] as String;
      await _updateStatus(complaintId, 'Escalated to Director', 'Escalated to Director by HOD');
      await supabase.from('complaints').update({'director_id': directorId}).eq('id', complaintId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Complaint escalated to Director')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error escalating: ${e.toString()}')));
      }
    }
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _lightBlue,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
        leading: Builder(
          builder: (context) => IconButton(
            icon: FaIcon(FontAwesomeIcons.bars, color: Colors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Text(
          'HOD Dashboard',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: FaIcon(FontAwesomeIcons.cog, color: Colors.white),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
          IconButton(
            icon: FaIcon(FontAwesomeIcons.signOutAlt, color: Colors.white),
            onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
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
                    return Center(child: SpinKitFadingCircle(color: _primaryPurple));
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
                leading: FaIcon(FontAwesomeIcons.signOutAlt, color: _primaryBlue),
                title: Text(
                  'Logout',
                  style: TextStyle(color: _primaryBlue),
                ),
                onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    'Your Complaints',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: _darkBlue),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Card(
                elevation: 6,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12.0),
                  child: DropdownButton<String>(
                    isExpanded: true,
                    value: _filterStatus,
                    icon: FaIcon(FontAwesomeIcons.filter, color: _primaryPurple, size: 16),
                    items: const [
                      DropdownMenuItem(value: 'All', child: Text('All Complaints')),
                      DropdownMenuItem(value: 'Escalated to HOD', child: Text('Escalated to HOD')),
                      DropdownMenuItem(value: 'Resolved', child: Text('Resolved')),
                      DropdownMenuItem(value: 'Rejected', child: Text('Rejected')),
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
                stream: supabase.from('complaints').stream(primaryKey: ['id']).eq('hod_id', widget.userId),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(child: SpinKitFadingCircle(color: _primaryPurple));
                  }
                  if (snapshot.hasError) {
                    return Center(
                      child: Text('Error loading complaints', style: TextStyle(color: _darkBlue)),
                    );
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return Center(
                      child: Text('No complaints found', style: TextStyle(color: _darkBlue)),
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
                        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ComplaintTimeline(complaintId: complaint['id'].toString())),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(12.0),
                            child: Row(
                              children: [
                                FaIcon(FontAwesomeIcons.fileAlt, color: _primaryBlue, size: 24),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        complaint['title'] ?? 'Untitled',
                                        style: TextStyle(fontWeight: FontWeight.bold, color: _darkBlue, fontSize: 16),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Status: ${complaint['status'] ?? 'Unknown'}',
                                        style: TextStyle(color: _getStatusColor(complaint['status']), fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (complaint['status'] == 'Escalated to HOD')
                                      IconButton(
                                        icon: FaIcon(FontAwesomeIcons.check, color: Colors.green),
                                        onPressed: () => _updateStatus(complaint['id'].toString(), 'Resolved', 'Solved by HOD'),
                                      ),
                                    if (complaint['status'] == 'Escalated to HOD')
                                      IconButton(
                                        icon: FaIcon(FontAwesomeIcons.times, color: Colors.red),
                                        onPressed: () => _updateStatus(complaint['id'].toString(), 'Rejected', 'Rejected by HOD'),
                                      ),
                                    if (complaint['status'] == 'Escalated to HOD')
                                      IconButton(
                                        icon: FaIcon(FontAwesomeIcons.arrowUp, color: _primaryPurple),
                                        onPressed: () => _escalateToDirector(complaint['id'].toString()),
                                      ),
                                  ],
                                ),
                                Icon(Icons.chevron_right, color: _primaryPurple),
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
}