
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart'; // Updated to flutter_animate
import '../services/supabase_service.dart';
import '../models/task.dart';
import '../widgets/task_card.dart';
import 'app_auth_state.dart';
import 'package:student1/theme/app_theme.dart'; // Import AppTheme

class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  _TaskListScreenState createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  List<Task> _tasks = [];

  @override
  void initState() {
    super.initState();
    _fetchTasks();
    final userId = AppAuthState.currentUserId;
    if (userId != null) {
      _supabaseService.streamTasks(userId).listen((tasks) {
        setState(() {
          _tasks = tasks;
        });
      });
    } else {
      print('No user ID found for streaming tasks.');
    }
  }

  Future<void> _fetchTasks() async {
    final userId = AppAuthState.currentUserId;
    if (userId != null) {
      final tasks = await _supabaseService.getTasks(userId);
      setState(() {
        _tasks = tasks;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: AppTheme.lightTheme, // Apply lightTheme from AppTheme
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My Tasks'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _fetchTasks,
            ),
          ],
        ),
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange, Color(0xFFFFCCBC)], // Orange to light orange
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: _tasks.isEmpty
              ? Center(
            child: const Text(
              'No tasks available',
              style: TextStyle(
                fontSize: 20,
                color: Colors.white,
                fontWeight: FontWeight.w500,
                shadows: [
                  Shadow(
                    color: Colors.orangeAccent,
                    offset: Offset(1, 1),
                    blurRadius: 2,
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 500.ms),
          )
              : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _tasks.length,
            itemBuilder: (context, index) {
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                child: TaskCard(
                  task: _tasks[index],
                  onComplete: () async {
                    await _supabaseService.markTaskComplete(_tasks[index].id);
                  },
                ),
              ).animate().slideY(
                duration: 500.ms,
                delay: (index * 100).ms,
                begin: 0.2,
              );
            },
          ),
        ),

      ),
    );
  }
}