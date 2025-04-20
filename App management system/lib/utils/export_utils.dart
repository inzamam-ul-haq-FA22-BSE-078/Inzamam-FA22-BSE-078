import 'dart:io';
import 'package:csv/csv.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:share_plus/share_plus.dart';
import '../models/task.dart'; // Update this with the correct path to your Task model

class ExportUtils {
  static Future<String> exportTasksToCSV(List<Task> tasks) async {
    List<List<String>> csvData = [
      ['ID', 'Title', 'Description', 'Repeatable', 'Completed', 'Created At'],
      ...tasks.map((task) => [
        task.id.toString(),
        task.title,
        task.description ?? '',
        task.isRepeatable ? 'Yes' : 'No',
        task.isCompleted ? 'Yes' : 'No',
        task.createdAt.toString(),
      ]),
    ];

    String csv = const ListToCsvConverter().convert(csvData);
    final directory = await getApplicationDocumentsDirectory();
    final path = '${directory.path}/tasks.csv';
    final file = File(path);
    await file.writeAsString(csv);

    return path;
  }

  static Future<void> exportTasksToPDF(List<Task> tasks) async {
    final pdf = pw.Document();

    pdf.addPage(
      pw.Page(
        build: (pw.Context context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: tasks.map((task) => pw.Padding(
            padding: const pw.EdgeInsets.only(bottom: 12),
            child: pw.Text(
              'Title: ${task.title}\nDescription: ${task.description ?? ""}\nRepeatable: ${task.isRepeatable ? "Yes" : "No"}\nCompleted: ${task.isCompleted ? "Yes" : "No"}\nCreated At: ${task.createdAt}\n',
              style: pw.TextStyle(fontSize: 12),
            ),
          )).toList(),
        ),
      ),
    );

    await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save());
  }

  static Future<void> shareFile(String filePath) async {
    await Share.shareXFiles([XFile(filePath)], text: 'Here are my exported tasks!');
  }
}
