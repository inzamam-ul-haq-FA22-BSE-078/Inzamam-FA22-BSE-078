import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:excel/excel.dart' as excel; // Add alias to avoid conflict
import 'package:flutter_animate/flutter_animate.dart';
import 'package:uuid/uuid.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({Key? key}) : super(key: key);

  @override
  _StudentManagementScreenState createState() => _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _students = [];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final response = await supabase.from('users').select().eq('role', 'student');
      if (mounted) {
        setState(() {
          _students = response as List<Map<String, dynamic>>;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.orange[700],
          ),
        );
      }
    }
  }

  Future<void> _addStudent() async {
    try {
      final uuid = const Uuid().v4();
      await supabase.from('users').insert({
        'id': uuid,
        'name': _nameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text.trim(),
        'role': 'student',
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Student added successfully'),
            backgroundColor: Colors.orange,
          ),
        );
        _nameController.clear();
        _emailController.clear();
        _passwordController.clear();
        _fetchStudents();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding student: $e'),
            backgroundColor: Colors.orange[700],
          ),
        );
      }
    }
  }

  Future<void> _updateStudent(String studentId, String name, String email, String password) async {
    try {
      await supabase.from('users').update({
        'name': name,
        'email': email,
        'password': password,
      }).eq('id', studentId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Student updated successfully'),
            backgroundColor: Colors.orange,
          ),
        );
        _fetchStudents();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.orange[700],
          ),
        );
      }
    }
  }

  Future<void> _deleteStudent(String studentId) async {
    try {
      await supabase.from('users').delete().eq('id', studentId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Student deleted successfully'),
            backgroundColor: Colors.orange,
          ),
        );
        _fetchStudents();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.orange[700],
          ),
        );
      }
    }
  }

  Future<void> _uploadExcel() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'xls'],
    );
    if (result != null) {
      try {
        var bytes = result.files.single.bytes;
        var excelDoc = excel.Excel.decodeBytes(bytes!); // Use alias
        for (var row in excelDoc['Sheet1'].rows.skip(1)) {
          final name = row[0]?.value.toString()?.trim();
          final email = row[1]?.value.toString()?.trim();
          final password = 'default123';
          if (name != null && email != null) {
            final uuid = const Uuid().v4();
            await supabase.from('users').insert({
              'id': uuid,
              'name': name,
              'email': email,
              'password': password,
              'role': 'student',
            });
          }
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Students uploaded successfully'),
              backgroundColor: Colors.orange,
            ),
          );
          _fetchStudents();
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error: $e'),
              backgroundColor: Colors.orange[700],
            ),
          );
        }
      }
    }
  }

  void _showEditDialog(Map<String, dynamic> student) {
    _nameController.text = student['name'];
    _emailController.text = student['email'];
    _passwordController.text = student['password'];

    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.orange[200]!, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.1),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Edit Student',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                  SizedBox(height: 16),
                  _buildModernTextField(
                    controller: _nameController,
                    label: 'Name',
                    icon: Icons.person,
                  ),
                  SizedBox(height: 12),
                  _buildModernTextField(
                    controller: _emailController,
                    label: 'Email',
                    icon: Icons.email,
                  ),
                  SizedBox(height: 12),
                  _buildModernTextField(
                    controller: _passwordController,
                    label: 'Password',
                    icon: Icons.lock,
                    obscureText: true,
                  ),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: Text(
                          'Cancel',
                          style: TextStyle(color: Colors.orange[700], fontSize: 16),
                        ),
                      ),
                      SizedBox(width: 12),
                      _buildModernButton('Update', () {
                        _updateStudent(
                          student['id'],
                          _nameController.text,
                          _emailController.text,
                          _passwordController.text,
                        );
                        Navigator.pop(context);
                      }, width: 120),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              top: 0,
              right: 0,
              child: CustomPaint(
                size: Size(50, 50),
                painter: CirclePainter(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Manage Students',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
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
              left: 0,
              child: CustomPaint(
                size: Size(100, 100),
                painter: CirclePainter(),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.orange[200]!, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.orange.withOpacity(0.1),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    padding: EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Add New Student',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                              ),
                            ),
                            CustomPaint(
                              size: Size(30, 30),
                              painter: CirclePainter(),
                            ),
                          ],
                        ),
                        SizedBox(height: 16),
                        _buildModernTextField(
                          controller: _nameController,
                          label: 'Name',
                          icon: Icons.person,
                        ),
                        SizedBox(height: 12),
                        _buildModernTextField(
                          controller: _emailController,
                          label: 'Email',
                          icon: Icons.email,
                        ),
                        SizedBox(height: 12),
                        _buildModernTextField(
                          controller: _passwordController,
                          label: 'Password',
                          icon: Icons.lock,
                          obscureText: true,
                        ),
                        SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildModernButton('Add Student', _addStudent, width: 160),
                            _buildModernButton('Upload Excel', _uploadExcel, width: 160),
                          ],
                        ),
                      ],
                    ),
                  ).animate().slideY(duration: 600.ms, begin: 0.2),
                  SizedBox(height: 24),
                  Text(
                    'Student List',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange,
                    ),
                  ),
                  SizedBox(height: 12),
                  Expanded(
                    child: _students.isEmpty
                        ? Center(child: CircularProgressIndicator(color: Colors.orange))
                        : ListView.builder(
                      itemCount: _students.length,
                      itemBuilder: (context, index) {
                        final student = _students[index];
                        return Card(
                          color: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.orange[200]!, width: 1),
                          ),
                          elevation: 0,
                          margin: EdgeInsets.symmetric(vertical: 6),
                          child: ListTile(
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            title: Text(
                              student['name'],
                              style: TextStyle(
                                color: Colors.orange,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            subtitle: Text(
                              student['email'],
                              style: TextStyle(color: Colors.orange[700]),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: Icon(Icons.edit, color: Colors.orange),
                                  onPressed: () => _showEditDialog(student),
                                ),
                                IconButton(
                                  icon: Icon(Icons.delete, color: Colors.orange[900]),
                                  onPressed: () => _deleteStudent(student['id']),
                                ),
                              ],
                            ),
                          ),
                        ).animate().fadeIn(duration: 500.ms, delay: (index * 100).ms);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.orange),
        filled: true,
        fillColor: Colors.orange[50],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.orange[200]!, width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.orange[200]!, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.orange, width: 2),
        ),
        labelStyle: TextStyle(color: Colors.orange[700]),
        hintStyle: TextStyle(color: Colors.orange[400]),
      ),
    ).animate().fadeIn(duration: 600.ms);
  }

  Widget _buildModernButton(String label, VoidCallback onPressed, {double width = double.infinity}) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: width,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.orange,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.orange.withOpacity(0.3),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      ),
    ).animate().scale(duration: 300.ms, curve: Curves.easeOut).then().fadeIn(duration: 300.ms);
  }
}

class CirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange[200]!.withOpacity(0.5)
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
      ..color = Colors.orange[200]!.withOpacity(0.3)
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