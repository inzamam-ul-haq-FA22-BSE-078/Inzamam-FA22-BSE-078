import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../models/task.dart';
import '../providers/task_appearance_provider.dart';
import 'package:provider/provider.dart';

class ReusableTasksScreen extends StatefulWidget {
  const ReusableTasksScreen({super.key});

  @override
  State<ReusableTasksScreen> createState() => _ReusableTasksScreenState();
}

class _ReusableTasksScreenState extends State<ReusableTasksScreen> {
  List<Task> _reusableTasks = [];

  @override
  void initState() {
    super.initState();
    _loadReusableTasks();
  }

  Future<void> _loadReusableTasks() async {
    final tasks = await DatabaseHelper.instance.getAllTasks();
    setState(() {
      _reusableTasks = tasks
          .map((task) => Task.fromMap(task))
          .where((task) => task.isRepeatable)
          .toList();
    });
  }

  Future<void> _reuseTask(Task task) async {
    final newTask = Task(
      title: task.title,
      description: task.description,
      createdAt: DateTime.now(),
      isRepeatable: false,
      isCompleted: false,
    );
    await DatabaseHelper.instance.insertTask(newTask.toMap());
  }

  Future<void> _reuseAllTasks() async {
    for (var task in _reusableTasks) {
      await _reuseTask(task);
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All tasks have been reused'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _deleteTask(Task task) async {
    await DatabaseHelper.instance.deleteTask(task.id!);
    _loadReusableTasks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reusable Tasks'),
        actions: [
          if (_reusableTasks.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Reuse All Tasks',
              onPressed: _reuseAllTasks,
            ),
        ],
      ),
      body: ListView.builder(
        itemCount: _reusableTasks.length,
        itemBuilder: (context, index) {
          final task = _reusableTasks[index];
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
                title: Text(
                  task.title,
                  style: TextStyle(
                    fontWeight:
                    context.watch<TaskAppearanceProvider>().titleFontWeight,
                    fontSize:
                    context.watch<TaskAppearanceProvider>().titleFontSize,
                  ),
                ),
                subtitle: Row(
                  children: [
                    if (task.description != null)
                      Expanded(
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
                      ),
                    if (task.isCompleted) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.check_circle, color: Colors.green),
                    ],
                  ],
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.refresh),
                  onPressed: () => _reuseTask(task),
                  tooltip: 'Reuse Task',
                ),
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
