import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'settings_screen.dart';
import 'complaint_timeline.dart';
import 'login_screen.dart';

class AdvisorDashboard extends StatefulWidget {
  final String userId;
  const AdvisorDashboard({super.key, required this.userId});

  @override
  _AdvisorDashboardState createState() => _AdvisorDashboardState();
}

class _AdvisorDashboardState extends State<AdvisorDashboard> with SingleTickerProviderStateMixin {
  final SupabaseClient supabase = Supabase.instance.client;
  String _filterStatus = 'All';
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 1));
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(_controller);
    _controller.forward();
    supabase.from('complaints').stream(primaryKey: ['id']).eq('advisor_id', widget.userId).listen((data) {
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

  Future<void> _escalateToHOD(String complaintId) async {
    try {
      final hodData = await supabase.from('users').select('id').eq('role', 'hod').eq('department', 'CS').maybeSingle();
      if (hodData == null) {
        throw Exception('No HOD found for department CS');
      }
      final hodId = hodData['id'] as String;
      await _updateStatus(complaintId, 'Escalated to HOD', 'Escalated to HOD by advisor');
      await supabase.from('complaints').update({'hod_id': hodId}).eq('id', complaintId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Complaint escalated to HOD')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error escalating: ${e.toString()}')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const FaIcon(FontAwesomeIcons.bars, color: Colors.white),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: const Text('Advisor Dashboard'),
        actions: [
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.cog),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
          ),
          IconButton(
            icon: const FaIcon(FontAwesomeIcons.signOutAlt),
            onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
          ),
        ],
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF2196F3), Color(0xFF7B1FA2)]),
          ),
        ),
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            FutureBuilder<Map<String, dynamic>>(
              future: supabase.from('users').select().eq('id', widget.userId).single(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: SpinKitCubeGrid(color: Color(0xFF7B1FA2)));
                final user = snapshot.data!;
                return UserAccountsDrawerHeader(
                  accountName: Text(user['name'] ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                  accountEmail: Text(user['email'] ?? 'Unknown', style: const TextStyle(color: Colors.white)),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(colors: [Color(0xFF2196F3), Color(0xFF7B1FA2)]),
                  ),
                );
              },
            ),
            ListTile(
              leading: const FaIcon(FontAwesomeIcons.signOutAlt, color: Color(0xFF2196F3)),
              title: const Text('Logout', style: TextStyle(color: Color(0xFF2196F3))),
              onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            ),
          ],
        ),
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: DropdownButton<String>(
                value: _filterStatus,
                items: const [
                  DropdownMenuItem(value: 'All', child: Text('All')),
                  DropdownMenuItem(value: 'Pending', child: Text('Pending')),
                  DropdownMenuItem(value: 'Escalated to HOD', child: Text('Escalated to HOD')),
                  DropdownMenuItem(value: 'Resolved', child: Text('Resolved')),
                  DropdownMenuItem(value: 'Rejected', child: Text('Rejected')),
                ],
                onChanged: (value) => setState(() => _filterStatus = value!),
              ),
            ),
            Expanded(
              child: StreamBuilder<List<Map<String, dynamic>>>(
                stream: supabase.from('complaints').stream(primaryKey: ['id']).eq('advisor_id', widget.userId),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: SpinKitCubeGrid(color: Color(0xFF7B1FA2)));
                  }
                  if (snapshot.hasError) {
                    return Center(child: Text('Error: ${snapshot.error}'));
                  }
                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Center(child: Text('No complaints found'));
                  }
                  final complaints = snapshot.data!;
                  final filteredComplaints = _filterStatus == 'All'
                      ? complaints
                      : complaints.where((c) => c['status'] == _filterStatus).toList();
                  return ListView.builder(
                    itemCount: filteredComplaints.length,
                    itemBuilder: (context, index) {
                      final complaint = filteredComplaints[index];
                      return Card(
                        child: ListTile(
                          leading: const FaIcon(FontAwesomeIcons.file, color: Color(0xFF2196F3)),
                          title: Text(complaint['title'] ?? 'Untitled', style: TextStyle(color: Colors.black)),
                          subtitle: Text('Status: ${complaint['status'] ?? 'Unknown'}', style: TextStyle(color: Colors.black)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (complaint['status'] == 'Pending')
                                IconButton(
                                  icon: const FaIcon(FontAwesomeIcons.check, color: Colors.green),
                                  onPressed: () => _updateStatus(complaint['id'].toString(), 'Resolved', 'Solved by advisor'),
                                ),
                              if (complaint['status'] == 'Pending')
                                IconButton(
                                  icon: const FaIcon(FontAwesomeIcons.arrowUp, color: Color(0xFF7B1FA2)),
                                  onPressed: () => _escalateToHOD(complaint['id'].toString()),
                                ),
                              if (complaint['status'] == 'Pending')
                                IconButton(
                                  icon: const FaIcon(FontAwesomeIcons.times, color: Colors.red),
                                  onPressed: () => _updateStatus(complaint['id'].toString(), 'Rejected', 'Rejected by advisor'),
                                ),
                            ],
                          ),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ComplaintTimeline(complaintId: complaint['id'].toString())),
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