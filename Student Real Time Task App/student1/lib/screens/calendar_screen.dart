import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:animate_do/animate_do.dart';
import '../services/supabase_service.dart';
import '../models/task.dart';
import 'app_auth_state.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  List<Task> _tasks = [];
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  Map<DateTime, List<Task>> _events = {};

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    _fetchTasks();
  }

  Future<void> _fetchTasks() async {
    final userId = AppAuthState.currentUserId;
    if (userId == null) {
      print('No user ID found for fetching tasks.');
      return;
    }

    final tasks = await _supabaseService.getTasks(userId);
    final events = <DateTime, List<Task>>{};
    for (var task in tasks) {
      final date = task.assignedAt;
      final day = DateTime(date.year, date.month, date.day);
      if (events[day] == null) {
        events[day] = [];
      }
      events[day]!.add(task);
    }
    setState(() {
      _tasks = tasks;
      _events = events;
    });
  }

  List<Task> _getEventsForDay(DateTime day) {
    return _events[DateTime(day.year, day.month, day.day)] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0), // Light background
      appBar: AppBar(
        title: const Text('Task Calendar'),
        backgroundColor: Colors.deepOrangeAccent,
        centerTitle: true,
      ),
      body: Column(
        children: [
          FadeInDown(
            duration: const Duration(milliseconds: 800),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: TableCalendar(
                firstDay: DateTime.utc(2020, 1, 1),
                lastDay: DateTime.utc(2030, 12, 31),
                focusedDay: _focusedDay,
                selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                onDaySelected: (selectedDay, focusedDay) {
                  setState(() {
                    _selectedDay = selectedDay;
                    _focusedDay = focusedDay;
                  });
                },
                eventLoader: _getEventsForDay,
                calendarStyle: CalendarStyle(
                  todayDecoration: BoxDecoration(
                    color: Colors.orangeAccent.shade100,
                    shape: BoxShape.circle,
                  ),
                  selectedDecoration: const BoxDecoration(
                    color: Colors.deepOrangeAccent,
                    shape: BoxShape.circle,
                  ),
                  markerDecoration: BoxDecoration(
                    color: Colors.orange,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                ),
                headerStyle: const HeaderStyle(
                  formatButtonVisible: false,
                  titleCentered: true,
                  titleTextStyle:
                  TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: FadeInUp(
              duration: const Duration(milliseconds: 700),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: _getEventsForDay(_selectedDay!).isEmpty
                    ? Center(
                  child: Text(
                    'No tasks assigned.',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade600,
                    ),
                  ),
                )
                    : ListView(
                  children: _getEventsForDay(_selectedDay!).map((task) {
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      margin: const EdgeInsets.only(bottom: 15),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.orangeAccent.withOpacity(0.3),
                            spreadRadius: 2,
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                            vertical: 10, horizontal: 16),
                        title: Text(
                          task.title,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        subtitle: Text(
                          task.description ?? 'No description provided.',
                          style: const TextStyle(fontSize: 14),
                        ),
                        trailing: Chip(
                          label: Text(
                            task.status == 'completed'
                                ? 'Completed'
                                : 'Pending',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12),
                          ),
                          backgroundColor:
                          task.status == 'completed'
                              ? Colors.green
                              : Colors.deepOrange,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
