import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:animate_do/animate_do.dart';
import '../services/supabase_service.dart';
import '../models/task.dart';
import 'app_auth_state.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  _ProgressScreenState createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  int _completedTasks = 0;
  int _pendingTasks = 0;

  @override
  void initState() {
    super.initState();
    _fetchProgress();
  }

  Future<void> _fetchProgress() async {
    final userId = AppAuthState.currentUserId;
    if (userId == null) {
      print('No user ID found for fetching progress.');
      return;
    }

    final tasks = await _supabaseService.getTasks(userId);
    final completed = tasks.where((task) => task.status == 'completed').length;
    final pending = tasks.where((task) => task.status == 'pending').length;

    setState(() {
      _completedTasks = completed;
      _pendingTasks = pending;
    });
  }

  @override
  Widget build(BuildContext context) {
    final totalTasks = _completedTasks + _pendingTasks;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Progress'),
        backgroundColor: Colors.orangeAccent,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              FadeInDown(
                child: const Text(
                  'Your Task Overview',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.deepPurple,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FadeInLeft(
                child: SizedBox(
                  height: 220,
                  child: PieChart(
                    PieChartData(
                      centerSpaceRadius: 40,
                      sections: [
                        PieChartSectionData(
                          value: _completedTasks.toDouble(),
                          color: Colors.greenAccent.shade400,
                          title: 'Completed',
                          radius: 90,
                          titleStyle: const TextStyle(
                              color: Colors.black, fontWeight: FontWeight.bold),
                        ),
                        PieChartSectionData(
                          value: _pendingTasks.toDouble(),
                          color: Colors.orangeAccent,
                          title: 'Pending',
                          radius: 90,
                          titleStyle: const TextStyle(
                              color: Colors.black, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              FadeInRight(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildStatCard('Completed', _completedTasks, Colors.green),
                    _buildStatCard('Pending', _pendingTasks, Colors.red),
                    _buildStatCard('Total', totalTasks, Colors.blueGrey),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              FadeInUp(
                duration: const Duration(milliseconds: 800),
                child: const Text(
                  'Keep Going! 🎯',
                  style: TextStyle(
                    fontSize: 22,
                    color: Colors.teal,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, int value, Color color) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 6,
      color: color.withOpacity(0.1),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Column(
          children: [
            Text(
              '$value',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                color: color.withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
