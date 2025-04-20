class Task {
  final int? id;
  final String title;
  final String? description;
  final DateTime createdAt;
  bool isCompleted;
  bool isRepeatable;

  Task({
    this.id,
    required this.title,
    this.description,
    required this.createdAt,
    this.isCompleted = false,
    this.isRepeatable = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'created_at': createdAt.toIso8601String(),
      'is_completed': isCompleted ? 1 : 0,
      'is_repeatable': isRepeatable ? 1 : 0,
    };
  }

  factory Task.fromMap(Map<String, dynamic> map) {
    return Task(
      id: map['id'],
      title: map['title'],
      description: map['description'],
      createdAt: DateTime.parse(map['created_at']),
      isCompleted: map['is_completed'] == 1,
      isRepeatable: map['is_repeatable'] == 1,
    );
  }
}
