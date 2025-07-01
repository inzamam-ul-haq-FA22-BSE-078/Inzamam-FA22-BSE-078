import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  late Animation<double> _slideAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<double> _bounceAnimation;

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

    _slideAnimation = Tween<double>(begin: 300, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutExpo),
    );

    _rotateAnimation = Tween<double>(begin: 0, end: 2 * 3.1416).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutCirc),
    );

    _bounceAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.bounceOut),
    );

    _controller.forward();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _controller.repeat(period: const Duration(seconds: 3));
      }
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

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'Resolved':
        return Colors.green;
      case 'Rejected':
        return Colors.red;
      case 'Pending':
        return Colors.orange;
      default:
        return _primaryTeal;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _softGray,
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
          'Advisor Dashboard',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
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
              colors: [_primaryTeal, _accentOrange],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        elevation: 12,
      ),
      drawer: Drawer(
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [_softGray, _lightOrange.withOpacity(0.3)],
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
                    return Center(child: SpinKitFadingCircle(color: _primaryTeal));
                  }
                  final user = snapshot.data!;
                  return UserAccountsDrawerHeader(
                    accountName: Text(
                      user['name'] ?? 'Unknown',
                      style: TextStyle(color: _darkTeal, fontWeight: FontWeight.w600),
                    ),
                    accountEmail: Text(
                      user['email'] ?? 'Unknown',
                      style: TextStyle(color: _darkTeal),
                    ),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_primaryTeal, _accentOrange],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  );
                },
              ),
              ListTile(
                leading: FaIcon(FontAwesomeIcons.signOutAlt, color: _primaryTeal),
                title: Text(
                  'Logout',
                  style: TextStyle(color: _darkTeal, fontWeight: FontWeight.w500),
                ),
                onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
              ),
            ],
          ),
        ),
      ),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(_slideAnimation.value, 0),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Card(
                    elevation: 10,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    color: Colors.white.withOpacity(0.3),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ui.ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(18.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              TweenAnimationBuilder(
                                tween: Tween<double>(begin: 0, end: _rotateAnimation.value),
                                duration: const Duration(milliseconds: 1200),
                                builder: (context, double angle, child) {
                                  return Transform.rotate(
                                    angle: angle,
                                    child: FaIcon(
                                      FontAwesomeIcons.fileAlt,
                                      size: 30,
                                      color: _darkTeal,
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Your Complaints',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w600,
                                  color: _darkTeal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Card(
                    elevation: 8,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    color: _softGray.withOpacity(0.9),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 300),
                        transitionBuilder: (child, animation) {
                          return FadeTransition(opacity: animation, child: child);
                        },
                        child: DropdownButton<String>(
                          key: ValueKey<String>(_filterStatus),
                          isExpanded: true,
                          value: _filterStatus,
                          icon: FaIcon(FontAwesomeIcons.filter, color: _primaryTeal, size: 18),
                          items: const [
                            DropdownMenuItem(value: 'All', child: Text('All Complaints')),
                            DropdownMenuItem(value: 'Pending', child: Text('Pending')),
                            DropdownMenuItem(value: 'Escalated to HOD', child: Text('Escalated to HOD')),
                            DropdownMenuItem(value: 'Resolved', child: Text('Resolved')),
                            DropdownMenuItem(value: 'Rejected', child: Text('Rejected')),
                          ],
                          onChanged: (value) => setState(() => _filterStatus = value!),
                          style: TextStyle(color: _darkTeal, fontWeight: FontWeight.w400),
                          dropdownColor: _softGray,
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: StreamBuilder<List<Map<String, dynamic>>>(
                    stream: supabase.from('complaints').stream(primaryKey: ['id']).eq('advisor_id', widget.userId),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return Center(child: SpinKitFadingCircle(color: _primaryTeal));
                      }
                      if (snapshot.hasError) {
                        return Center(
                          child: Text('Error loading complaints', style: TextStyle(color: _darkTeal)),
                        );
                      }
                      if (!snapshot.hasData || snapshot.data!.isEmpty) {
                        return Center(
                          child: Text('No complaints found', style: TextStyle(color: _darkTeal)),
                        );
                      }
                      final complaints = snapshot.data!;
                      final filteredComplaints = _filterStatus == 'All'
                          ? complaints
                          : complaints.where((c) => c['status'] == _filterStatus).toList();
                      return ListView.builder(
                        padding: const EdgeInsets.all(10.0),
                        itemCount: filteredComplaints.length,
                        itemBuilder: (context, index) {
                          final complaint = filteredComplaints[index];
                          return Card(
                            elevation: 6,
                            margin: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                            color: _softGray.withOpacity(0.95),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(15),
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => ComplaintTimeline(complaintId: complaint['id'].toString())),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(14.0),
                                child: Row(
                                  children: [
                                    FaIcon(FontAwesomeIcons.fileAlt, color: _primaryTeal, size: 26),
                                    const SizedBox(width: 18),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            complaint['title'] ?? 'Untitled',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w500,
                                              color: _darkTeal,
                                              fontSize: 17,
                                            ),
                                          ),
                                          const SizedBox(height: 5),
                                          Text(
                                            'Status: ${complaint['status'] ?? 'Unknown'}',
                                            style: TextStyle(color: _getStatusColor(complaint['status']), fontSize: 15),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (complaint['status'] == 'Pending')
                                          TweenAnimationBuilder(
                                            tween: Tween<double>(begin: 1.0, end: _bounceAnimation.value),
                                            duration: const Duration(milliseconds: 500),
                                            builder: (context, scale, child) {
                                              return Transform.scale(
                                                scale: scale,
                                                child: IconButton(
                                                  icon: FaIcon(FontAwesomeIcons.check, color: Colors.green),
                                                  onPressed: () => _updateStatus(complaint['id'].toString(), 'Resolved', 'Solved by advisor'),
                                                ),
                                              );
                                            },
                                          ),
                                        if (complaint['status'] == 'Pending')
                                          TweenAnimationBuilder(
                                            tween: Tween<double>(begin: 1.0, end: _bounceAnimation.value),
                                            duration: const Duration(milliseconds: 500),
                                            builder: (context, scale, child) {
                                              return Transform.scale(
                                                scale: scale,
                                                child: IconButton(
                                                  icon: FaIcon(FontAwesomeIcons.arrowUp, color: _accentOrange),
                                                  onPressed: () => _escalateToHOD(complaint['id'].toString()),
                                                ),
                                              );
                                            },
                                          ),
                                        if (complaint['status'] == 'Pending')
                                          TweenAnimationBuilder(
                                            tween: Tween<double>(begin: 1.0, end: _bounceAnimation.value),
                                            duration: const Duration(milliseconds: 500),
                                            builder: (context, scale, child) {
                                              return Transform.scale(
                                                scale: scale,
                                                child: IconButton(
                                                  icon: FaIcon(FontAwesomeIcons.times, color: Colors.red),
                                                  onPressed: () => _updateStatus(complaint['id'].toString(), 'Rejected', 'Rejected by advisor'),
                                                ),
                                              );
                                            },
                                          ),
                                      ],
                                    ),
                                    Icon(Icons.chevron_right, color: _accentOrange),
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
          );
        },
      ),
    );
  }
}