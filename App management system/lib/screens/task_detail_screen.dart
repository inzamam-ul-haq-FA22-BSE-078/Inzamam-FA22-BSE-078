import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../models/task.dart';
import '../models/subtask.dart';

class TaskDetailScreen extends StatefulWidget {
  final Task task;

  const TaskDetailScreen({super.key, required this.task});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  List<Subtask> _subtasks = [];

  @override
  void initState() {
    super.initState();
    _loadSubtasks();
  }

  Future<void> _loadSubtasks() async {
    final subtasks =
        await DatabaseHelper.instance.getSubtasksForTask(widget.task.id!);
    setState(() {
      _subtasks = subtasks.map((subtask) => Subtask.fromMap(subtask)).toList();
    });
  }

  double get _completionProgress {
    if (_subtasks.isEmpty) return 0.0;
    final completedCount =
        _subtasks.where((subtask) => subtask.isCompleted).length;
    return completedCount / _subtasks.length;
  }


  Future<void> _addSubtask() async {
    final titleController = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Subtask'),
        content: TextField(
          controller: titleController,
          decoration: const InputDecoration(labelText: 'Title'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty) {
                final subtask = Subtask(
                  taskId: widget.task.id!,
                  title: titleController.text,
                );
                await DatabaseHelper.instance.insertSubtask(subtask.toMap());
                Navigator.pop(context);
                _loadSubtasks();
                _showAlert(context, "Subtask added successfully!");
              } else {
                _showAlert(context, "Please enter a title.");
              }
            },
            child: const Text('Add'),
          ),

        ],
      ),
    );
  }

  Future<void> _deleteSubtask(Subtask subtask) async {
    await DatabaseHelper.instance.deleteSubtask(subtask.id!);
    _loadSubtasks();
  }

  Future<void> _toggleSubtaskCompletion(Subtask subtask) async {
    subtask.isCompleted = !subtask.isCompleted;
    await DatabaseHelper.instance.updateSubtask(subtask.toMap());
    _loadSubtasks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.task.title),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.task.title,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                if (widget.task.description != null) ...[
                  const SizedBox(height: 8),
                  Text(widget.task.description!),
                ],
              ],
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Subtasks',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                TextButton.icon(
                  onPressed: _addSubtask,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Subtask'),
                ),
              ],
            ),
          ),
          if (_subtasks.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Progress: ${(_completionProgress * 100).toStringAsFixed(0)}%'),
                  const SizedBox(height: 4),
                  LinearProgressIndicator(
                    value: _completionProgress,
                    backgroundColor: Colors.grey[300],
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ],
          Expanded(
            child: ListView.builder(
            itemCount: _subtasks.length,
              itemBuilder: (context, index) {
                final subtask = _subtasks[index];
                return ListTile(
                  leading: Checkbox(
                    value: subtask.isCompleted,
                    onChanged: (value) => _toggleSubtaskCompletion(subtask),
                  ),
                  title: Text(
                    subtask.title,
                    style: TextStyle(
                      decoration: subtask.isCompleted
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete),
                    onPressed: () => _deleteSubtask(subtask),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAlert(BuildContext context, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Alert"),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text("OK"),
          ),
        ],
      ),
    );
  }

}
