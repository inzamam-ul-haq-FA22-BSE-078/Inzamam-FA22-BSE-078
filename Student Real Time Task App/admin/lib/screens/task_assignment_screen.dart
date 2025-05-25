import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';

class TaskAssignmentScreen extends StatefulWidget {
  const TaskAssignmentScreen({Key? key}) : super(key: key);

  @override
  _TaskAssignmentScreenState createState() => _TaskAssignmentScreenState();
}

class _TaskAssignmentScreenState extends State<TaskAssignmentScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _feedbackController = TextEditingController();
  String? _assignmentType = 'single';
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _tasks = [];
  List<String> _selectedStudents = [];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
    _fetchTasks();
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
          SnackBar(content: Text('Error fetching students: $e'), backgroundColor: Colors.orange[900]),
        );
      }
    }
  }

  Future<void> _fetchTasks() async {
    try {
      final response = await supabase.from('tasks').select('*, users(name)');
      if (mounted) {
        setState(() {
          _tasks = response as List<Map<String, dynamic>>;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error fetching tasks: $e'), backgroundColor: Colors.orange[900]),
        );
      }
    }
  }

  Future<void> _assignTask() async {
    try {
      if (_assignmentType == 'single' && _selectedStudents.length != 1) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Select one student for single assignment'), backgroundColor: Colors.orange[900]),
          );
        }
        return;
      }
      if (_assignmentType == 'multiple' && _selectedStudents.isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Select at least one student for multiple assignment'), backgroundColor: Colors.orange[900]),
          );
        }
        return;
      }
      final studentIds = _assignmentType == 'all' ? _students.map((s) => s['id'] as String).toList() : _selectedStudents;
      for (var studentId in studentIds) {
        await supabase.from('tasks').insert({
          'student_id': studentId,
          'title': _titleController.text,
          'description': _descriptionController.text,
          'status': 'pending',
        });
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Task assigned successfully'), backgroundColor: Colors.orange),
        );
        _titleController.clear();
        _descriptionController.clear();
        setState(() {
          _selectedStudents = [];
        });
        _fetchTasks();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.orange[900]),
        );
      }
    }
  }

  Future<void> _addFeedback(String taskId) async {
    try {
      await supabase.from('tasks').update({
        'feedback': _feedbackController.text,
      }).eq('id', taskId);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Feedback added successfully'), backgroundColor: Colors.orange),
        );
        _feedbackController.clear();
        _fetchTasks();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.orange[900]),
        );
      }
    }
  }

  void _showFeedbackDialog(String taskId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: Text('Add Feedback', style: TextStyle(color: Colors.orange)),
        content: TextField(
          controller: _feedbackController,
          decoration: InputDecoration(
            labelText: 'Feedback',
            labelStyle: TextStyle(color: Colors.orange[700]),
            filled: true,
            fillColor: Colors.orange[50],
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.orange),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: TextStyle(color: Colors.orange[700])),
          ),
          ElevatedButton(
            onPressed: () {
              _addFeedback(taskId);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
            ),
            child: Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalTasks = _tasks.length;
    final completedTasks = _tasks.where((task) => task['status'] == 'completed').length;
    final pendingTasks = _tasks.where((task) => task['status'] == 'pending').length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Assign & View Tasks', style: TextStyle(color: Colors.orange)),
        backgroundColor: Colors.white,
      ),
      body: Container(
        color: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SingleChildScrollView(
            child: Column(
              children: [
                Card(
                  color: Colors.orange[50],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Text(
                          'Task Stats',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildStatCard('Total Tasks', totalTasks.toString()),
                            _buildStatCard('Completed', completedTasks.toString()),
                            _buildStatCard('Pending', pendingTasks.toString()),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  color: Colors.orange[50],
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Text(
                          'Assign New Task',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange,
                          ),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          decoration: InputDecoration(
                            labelText: 'Assignment Type',
                            labelStyle: TextStyle(color: Colors.orange[700]),
                            prefixIcon: Icon(Icons.category, color: Colors.orange),
                            filled: true,
                            fillColor: Colors.orange[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange, width: 2),
                            ),
                          ),
                          value: _assignmentType,
                          onChanged: (value) {
                            setState(() {
                              _assignmentType = value;
                              if (value == 'all') _selectedStudents = _students.map((s) => s['id'] as String).toList();
                              else _selectedStudents = [];
                            });
                          },
                          items: ['single', 'multiple', 'all']
                              .map<DropdownMenuItem<String>>((type) => DropdownMenuItem<String>(
                            value: type,
                            child: Text(type, style: TextStyle(color: Colors.orange)),
                          ))
                              .toList(),
                        ).animate().slideX(duration: 500.ms, begin: -0.2),
                        const SizedBox(height: 12),
                        if (_assignmentType != 'all') ...[
                          _assignmentType == 'single'
                              ? DropdownButtonFormField<String>(
                            decoration: InputDecoration(
                              labelText: 'Select Student',
                              labelStyle: TextStyle(color: Colors.orange[700]),
                              prefixIcon: Icon(Icons.person, color: Colors.orange),
                              filled: true,
                              fillColor: Colors.orange[50],
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.orange),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.orange),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(color: Colors.orange, width: 2),
                              ),
                            ),
                            value: _selectedStudents.isNotEmpty ? _selectedStudents.first : null,
                            onChanged: (value) => setState(() => _selectedStudents = [value!]),
                            items: _students
                                .map<DropdownMenuItem<String>>((student) => DropdownMenuItem<String>(
                              value: student['id'] as String,
                              child: Text(student['name'], style: TextStyle(color: Colors.orange)),
                            ))
                                .toList(),
                            isExpanded: true,
                          ).animate().slideX(duration: 500.ms, begin: -0.2, delay: 100.ms)
                              : Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.orange[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.orange),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Select Students',
                                  style: TextStyle(color: Colors.orange[700], fontSize: 16),
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _students.map((student) {
                                    final studentId = student['id'] as String;
                                    final isSelected = _selectedStudents.contains(studentId);
                                    return ChoiceChip(
                                      label: Text(student['name'], style: TextStyle(color: isSelected ? Colors.white : Colors.orange)),
                                      selected: isSelected,
                                      onSelected: (selected) {
                                        setState(() {
                                          if (selected) {
                                            _selectedStudents.add(studentId);
                                          } else {
                                            _selectedStudents.remove(studentId);
                                          }
                                        });
                                      },
                                      selectedColor: Colors.orange,
                                      backgroundColor: Colors.white,
                                      labelStyle: TextStyle(color: Colors.orange),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          ).animate().slideX(duration: 500.ms, begin: -0.2, delay: 100.ms),
                        ],
                        const SizedBox(height: 12),
                        TextField(
                          controller: _titleController,
                          decoration: InputDecoration(
                            labelText: 'Task Title',
                            labelStyle: TextStyle(color: Colors.orange[700]),
                            prefixIcon: Icon(Icons.title, color: Colors.orange),
                            filled: true,
                            fillColor: Colors.orange[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange, width: 2),
                            ),
                          ),
                        ).animate().slideX(duration: 500.ms, begin: -0.2, delay: 200.ms),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _descriptionController,
                          decoration: InputDecoration(
                            labelText: 'Description',
                            labelStyle: TextStyle(color: Colors.orange[700]),
                            prefixIcon: Icon(Icons.description, color: Colors.orange),
                            filled: true,
                            fillColor: Colors.orange[50],
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.orange, width: 2),
                            ),
                          ),
                        ).animate().slideX(duration: 500.ms, begin: -0.2, delay: 300.ms),
                        const SizedBox(height: 20),
                        _buildButton('Assign Task', _assignTask),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Assigned Tasks',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(height: 16),
                _tasks.isEmpty
                    ? Center(child: CircularProgressIndicator(color: Colors.orange))
                    : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final task = _tasks[index];
                    return Card(
                      color: Colors.orange[50],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        title: Text(
                          task['title'],
                          style: TextStyle(color: Colors.orange),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Student: ${task['users']['name']}',
                              style: TextStyle(color: Colors.orange[700]),
                            ),
                            Text(
                              'Status: ${task['status']}',
                              style: TextStyle(color: Colors.orange[700]),
                            ),
                            if (task['feedback'] != null)
                              Text(
                                'Feedback: ${task['feedback']}',
                                style: TextStyle(color: Colors.orange[700]),
                              ),
                          ],
                        ),
                        trailing: task['status'] == 'completed'
                            ? IconButton(
                          icon: Icon(Icons.feedback, color: Colors.orange),
                          onPressed: () => _showFeedbackDialog(task['id']),
                        )
                            : null,
                      ),
                    ).animate().fadeIn(duration: 500.ms, delay: (index * 100).ms);
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: Colors.orange[700])),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(color: Colors.orange, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildButton(String label, VoidCallback onPressed) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange, Colors.orange[700]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 10)],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          minimumSize: const Size(double.infinity, 50),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    ).animate().scale(duration: 500.ms);
  }
}