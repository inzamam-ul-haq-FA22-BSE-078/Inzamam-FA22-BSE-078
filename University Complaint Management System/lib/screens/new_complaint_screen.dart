import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Added this import
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:uuid/uuid.dart';
import 'login_screen.dart';

class NewComplaintScreen extends StatefulWidget {
  const NewComplaintScreen({super.key});

  @override
  _NewComplaintScreenState createState() => _NewComplaintScreenState();
}

class _NewComplaintScreenState extends State<NewComplaintScreen>
    with SingleTickerProviderStateMixin {
  final SupabaseClient supabase = Supabase.instance.client;
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _category = 'Academic';
  String _priority = 'Medium';
  final _attachmentsController = TextEditingController();
  bool _isLoading = false;
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  // Color Scheme
  final Color _primaryBlue = const Color(0xFF2962FF);
  final Color _primaryPurple = const Color(0xFF9C27B0);
  final Color _lightBlue = const Color(0xFFE3F2FD);
  final Color _darkBlue = const Color(0xFF0D47A1);

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
    _scaleAnimation = Tween<double>(begin: 0.95, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    _titleController.dispose();
    _descriptionController.dispose();
    _attachmentsController.dispose();
    super.dispose();
  }

  Future<void> _submitComplaint(String userId) async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final studentData = await supabase
          .from('users')
          .select('batch, advisor_email')
          .eq('id', userId)
          .single();
      final batch = studentData['batch'] as String?;
      final advisorEmail = studentData['advisor_email'] as String?;
      if (batch == null || advisorEmail == null) {
        throw Exception('Batch or advisor not found for student');
      }
      final advisorData = await supabase
          .from('users')
          .select('id')
          .eq('email', advisorEmail)
          .eq('role', 'advisor')
          .single();
      final advisorId = advisorData['id'] as String;

      final uuid = const Uuid().v4();
      final attachmentUrls = _attachmentsController.text.trim().isNotEmpty
          ? [_attachmentsController.text.trim()]
          : [];

      await supabase.from('complaints').insert({
        'id': uuid,
        'student_id': userId,
        'advisor_id': advisorId,
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'category': _category,
        'priority': _priority,
        'status': 'Pending',
        'created_at': DateTime.now().toIso8601String(),
        'comments': [],
        'attachments': attachmentUrls,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Complaint submitted successfully'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    int maxLines = 1,
  }) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: _darkBlue.withOpacity(0.7)),
        prefixIcon: FaIcon(icon, color: _primaryBlue),
        filled: true,
        fillColor: Colors.white.withOpacity(0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: _primaryBlue, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
            vertical: 16, horizontal: 20),
      ),
    );
  }

  Widget _buildDropdownField({
    required String value,
    required String label,
    required IconData icon,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: _darkBlue.withOpacity(0.7)),
        prefixIcon: FaIcon(icon, color: _primaryBlue),
        filled: true,
        fillColor: Colors.white.withOpacity(0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: _primaryBlue, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(
            horizontal: 16, vertical: 8),
      ),
      items: items.map((item) => DropdownMenuItem(
        value: item,
        child: Text(item),
      )).toList(),
      onChanged: onChanged,
      dropdownColor: Colors.white,
      borderRadius: BorderRadius.circular(15),
      icon: FaIcon(FontAwesomeIcons.chevronDown, color: _primaryBlue, size: 16),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userId = ModalRoute.of(context)!.settings.arguments as String? ?? '';
    if (userId.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User ID not found. Please log in again.')),
        );
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: _lightBlue,
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
          statusBarColor: Colors.transparent,
        ),
        title: const Text(
          'New Complaint',
          style: TextStyle(color: Colors.white),
        ),
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
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: SingleChildScrollView(
                  child: Card(
                    elevation: 15,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.white, _lightBlue],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _buildInputField(
                              controller: _titleController,
                              label: 'Complaint Title',
                              icon: FontAwesomeIcons.pen,
                            ),
                            const SizedBox(height: 16),
                            _buildInputField(
                              controller: _descriptionController,
                              label: 'Description',
                              icon: FontAwesomeIcons.alignLeft,
                              maxLines: 4,
                            ),
                            const SizedBox(height: 16),
                            _buildDropdownField(
                              value: _category,
                              label: 'Category',
                              icon: FontAwesomeIcons.list,
                              items: const ['Academic', 'Facility', 'Other'],
                              onChanged: (value) => setState(() => _category = value!),
                            ),
                            const SizedBox(height: 16),
                            _buildDropdownField(
                              value: _priority,
                              label: 'Priority',
                              icon: FontAwesomeIcons.exclamation,
                              items: const ['Low', 'Medium', 'High'],
                              onChanged: (value) => setState(() => _priority = value!),
                            ),
                            const SizedBox(height: 16),
                            _buildInputField(
                              controller: _attachmentsController,
                              label: 'Attachment URL (optional)',
                              icon: FontAwesomeIcons.paperclip,
                            ),
                            const SizedBox(height: 24),
                            Material(
                              borderRadius: BorderRadius.circular(15),
                              elevation: 5,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(15),
                                onTap: _isLoading ? null : () => _submitComplaint(userId),
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
                                      'Submit Complaint',
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
              ),
            ),
          );
        },
      ),
    );
  }
}