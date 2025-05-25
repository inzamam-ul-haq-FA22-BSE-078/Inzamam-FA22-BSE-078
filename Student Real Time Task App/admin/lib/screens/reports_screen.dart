import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  _ReportsScreenState createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _topPerformers = [];
  List<Map<String, dynamic>> _taskProgress = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final tasks = await supabase.from('tasks').select('*, users(name)').eq('status', 'completed');
      final Map<String, int> studentTaskCount = {};
      for (var task in tasks) {
        final studentId = task['student_id'];
        final studentName = task['users']['name'];
        studentTaskCount[studentId] = (studentTaskCount[studentId] ?? 0) + 1;
      }

      final performers = studentTaskCount.entries.map((entry) {
        return {
          'id': entry.key,
          'name': tasks.firstWhere((task) => task['student_id'] == entry.key)['users']['name'],
          'count': entry.value,
        };
      }).toList()
        ..sort((a, b) => (b['count'] as int).compareTo(a['count'] as int));

      final progress = tasks.map((task) {
        return {
          'time': DateTime.now().subtract(Duration(days: tasks.indexOf(task))).toIso8601String().split('T').first,
          'progress': task['status'] == 'completed' ? 100.0 : 50.0,
        };
      }).toList();

      if (mounted) {
        setState(() {
          _topPerformers = performers.take(5).toList();
          _taskProgress = progress;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error fetching data: $e'), backgroundColor: Colors.orange[900]),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      appBar: AppBar(
        title: const Text(
          'Reports & Progress',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orangeAccent,
        centerTitle: true,
        elevation: 4,
      ),
      body: Stack(
        children: [
          Positioned(
            bottom: 0,
            right: 0,
            child: CustomPaint(size: const Size(120, 120), painter: CirclePainter()),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Top 5 Performers',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.orangeAccent.shade700,
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                  const SizedBox(height: 16),
                  _topPerformers.isEmpty
                      ? const Center(child: CircularProgressIndicator(color: Colors.orangeAccent))
                      : Card(
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: Colors.orangeAccent.shade200, width: 1.2),
                    ),
                    elevation: 3,
                    shadowColor: Colors.orangeAccent.withOpacity(0.2),
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        children: _topPerformers.asMap().entries.map((entry) {
                          return ListTile(
                            leading: CircleAvatar(
                              radius: 20,
                              backgroundColor: Colors.orangeAccent,
                              child: Text(
                                '${entry.key + 1}',
                                style: const TextStyle(
                                    color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(
                              entry.value['name'] ?? 'Unknown',
                              style: const TextStyle(
                                  color: Colors.black87, fontWeight: FontWeight.w600),
                            ),
                            subtitle: Text(
                              'Completed Tasks: ${entry.value['count']}',
                              style: TextStyle(
                                  color: Colors.orange.shade700,
                                  fontWeight: FontWeight.w500),
                            ),
                          ).animate().fadeIn(duration: 400.ms, delay: (entry.key * 100).ms).slideX(begin: -0.1);
                        }).toList(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 30),
                  Text(
                    'Task Progress',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.orangeAccent.shade700,
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                  const SizedBox(height: 16),
                  Card(
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: Colors.orangeAccent.shade200, width: 1.2),
                    ),
                    elevation: 3,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: SizedBox(
                        height: 260,
                        child: _taskProgress.isEmpty
                            ? const Center(child: CircularProgressIndicator(color: Colors.orangeAccent))
                            : LineChart(
                          LineChartData(
                            lineBarsData: [
                              LineChartBarData(
                                spots: _taskProgress
                                    .asMap()
                                    .entries
                                    .map((entry) => FlSpot(
                                    entry.key.toDouble(),
                                    entry.value['progress'] ?? 0))
                                    .toList(),
                                isCurved: true,
                                gradient: LinearGradient(
                                  colors: [Colors.orange, Colors.orangeAccent],
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                ),
                                barWidth: 4,
                                dotData: FlDotData(show: false),
                              ),
                            ],
                            titlesData: FlTitlesData(
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) => Padding(
                                    padding: const EdgeInsets.only(top: 8.0),
                                    child: Text(
                                      _taskProgress[value.toInt()]['time']
                                          ?.split('-')
                                          .last ??
                                          '',
                                      style: TextStyle(
                                          color: Colors.orange.shade800, fontSize: 12),
                                    ),
                                  ),
                                  reservedSize: 22,
                                ),
                              ),
                              leftTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (value, meta) => Text(
                                    value.toInt().toString(),
                                    style: TextStyle(
                                        color: Colors.orange.shade800, fontSize: 12),
                                  ),
                                  reservedSize: 28,
                                ),
                              ),
                              topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles:
                              AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            ),
                            gridData: FlGridData(
                              drawHorizontalLine: true,
                              drawVerticalLine: false,
                              horizontalInterval: 20,
                            ),
                            borderData: FlBorderData(
                                show: true,
                                border:
                                Border.all(color: Colors.orangeAccent.shade200)),
                            minY: 0,
                            maxY: 100,
                          ),
                        ).animate().slideY(begin: 0.2).fadeIn(duration: 500.ms),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.orange.withOpacity(0.15)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(
        Offset(size.width / 2, size.height / 2), size.width / 2, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
