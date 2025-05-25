import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/task.dart';
import '../models/user.dart';
import 'package:student1/screens/app_auth_state.dart'; // Updated import

class SupabaseService {
  final supabase = Supabase.instance.client;

  Future<AppUser?> getCurrentUser() async {
    try {
      final userId = AppAuthState.currentUserId; // Updated
      if (userId == null) {
        print('No user ID found in AppAuthState.');
        return null;
      }

      print('Fetching user with ID: $userId');
      final response = await supabase
          .from('users')
          .select()
          .eq('id', userId)
          .maybeSingle();

      if (response == null) {
        print('No user data found in users table for ID: $userId');
        return null;
      }

      return AppUser.fromJson(response);
    } catch (e) {
      print('Error fetching user: $e');
      return null;
    }
  }

  Future<List<Task>> getTasks(String studentId) async {
    try {
      final response = await supabase
          .from('tasks')
          .select()
          .eq('student_id', studentId);
      print('Fetched tasks for student_id: $studentId, count: ${response.length}');
      return (response as List).map((json) => Task.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching tasks: $e');
      return [];
    }
  }

  Future<void> markTaskComplete(String taskId) async {
    try {
      await supabase
          .from('tasks')
          .update({
        'status': 'completed',
        'completed_at': DateTime.now().toIso8601String(),
      })
          .eq('id', taskId);
      print('Marked task $taskId as complete');
    } catch (e) {
      print('Error marking task complete: $e');
    }
  }

  Stream<List<Task>> streamTasks(String studentId) {
    return supabase
        .from('tasks')
        .stream(primaryKey: ['id'])
        .eq('student_id', studentId)
        .map((data) {
      print('Streamed tasks for student_id: $studentId, count: ${data.length}');
      return data.map((json) => Task.fromJson(json)).toList();
    });
  }
}