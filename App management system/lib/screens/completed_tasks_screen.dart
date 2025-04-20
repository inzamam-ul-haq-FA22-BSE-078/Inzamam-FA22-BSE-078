import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../database/database_helper.dart';
import '../models/task.dart';
import '../providers/task_appearance_provider.dart';

class CompletedTasksScreen extends StatefulWidget {
  const CompletedTasksScreen({super.key});

  @override
  State<CompletedTasksScreen> createState() => _CompletedTasksScreenState();
}

class _CompletedTasksScreenState extends State<CompletedTasksScreen> {
  List<Task> _completedTasks = [];

  @override
  void initState() {
    super.initState();
    _loadCompletedTasks();
  }

  Future<void> _loadCompletedTasks() async {
    final tasks = await DatabaseHelper.instance.getAllTasks();
    setState(() {
      _completedTasks = tasks
          .map((task) => Task.fromMap(task))
          .where((task) => task.isCompleted)
          .toList();
    });
  }

  Future<void> _deleteTask(Task task) async {
    await DatabaseHelper.instance.deleteTask(task.id!);
    _loadCompletedTasks();
  }

  Future<void> _toggleTaskCompletion(Task task) async {
    task.isCompleted = !task.isCompleted;
    await DatabaseHelper.instance.updateTask(task.toMap());
    _loadCompletedTasks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Completed Tasks'),
      ),
      body: ListView.builder(
        itemCount: _completedTasks.length,
        itemBuilder: (context, index) {
          final task = _completedTasks[index];
          return Dismissible(
            key: Key(task.id.toString()),
            background: Container(
              color: Colors.red,
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 16),
              child: const Icon(
                Icons.delete,
                color: Colors.white,
                size: 32,
              ),
            ),
            direction: DismissDirection.endToStart,
            onDismissed: (direction) {
              _deleteTask(task);
            },
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    context
                        .watch<TaskAppearanceProvider>()
                        .taskGradientStartColor,
                    context
                        .watch<TaskAppearanceProvider>()
                        .taskGradientEndColor,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(
                  context.watch<TaskAppearanceProvider>().taskCornerRadius,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(
                      context.watch<TaskAppearanceProvider>().taskShadowOpacity,
                    ),
                    spreadRadius: 1,
                    blurRadius:
                        context.watch<TaskAppearanceProvider>().taskShadowBlur,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    context.watch<TaskAppearanceProvider>().taskCornerRadius,
                  ),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: Checkbox(
                  value: task.isCompleted,
                  onChanged: (value) => _toggleTaskCompletion(task),
                ),
                title: Text(
                  task.title,
                  style: TextStyle(
                    decoration: TextDecoration.lineThrough,
                    fontWeight:
                        context.watch<TaskAppearanceProvider>().titleFontWeight,
                    fontSize:
                        context.watch<TaskAppearanceProvider>().titleFontSize,
                    color: Colors.grey[600],
                  ),
                ),
                subtitle: task.description != null
                    ? Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          task.description!,
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: context
                                .watch<TaskAppearanceProvider>()
                                .descriptionFontSize,
                            fontWeight: context
                                .watch<TaskAppearanceProvider>()
                                .descriptionFontWeight,
                          ),
                        ),
                      )
                    : null,
                onTap: () {
                  Navigator.pushNamed(
                    context,
                    '/task',
                    arguments: task,
                  );
                },
              ),
            ),
          );
        },
      ),
    );
  }
}
