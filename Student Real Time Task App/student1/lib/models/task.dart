class Task {
  final String id;
  final String studentId;
  final String title;
  final String description;
  final String status;
  final DateTime assignedAt;
  final DateTime? completedAt;

  Task({
    required this.id,
    required this.studentId,
    required this.title,
    required this.description,
    required this.status,
    required this.assignedAt,
    this.completedAt,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'],
      studentId: json['student_id'],
      title: json['title'],
      description: json['description'] ?? '',
      status: json['status'],
      assignedAt: DateTime.parse(json['assigned_at']),
      completedAt: json['completed_at'] != null ? DateTime.parse(json['completed_at']) : null,
    );
  }
}