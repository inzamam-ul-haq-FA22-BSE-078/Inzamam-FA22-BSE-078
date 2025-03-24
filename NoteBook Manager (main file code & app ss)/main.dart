// ... (keep your imports as they are)
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _isDarkMode = false;

  @override
  void initState() {
    super.initState();
    _loadThemePreference();
  }

  void _loadThemePreference() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      _isDarkMode = prefs.getBool('isDarkMode') ?? false;
    });
  }

  void _toggleTheme() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      _isDarkMode = !_isDarkMode;
      prefs.setBool('isDarkMode', _isDarkMode);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: _isDarkMode ? ThemeData.dark() : ThemeData.light(),
      home: NotesScreen(toggleTheme: _toggleTheme),
    );
  }
}

class NotesScreen extends StatefulWidget {
  final Function toggleTheme;
  NotesScreen({required this.toggleTheme});

  @override
  _NotesScreenState createState() => _NotesScreenState();
}

class _NotesScreenState extends State<NotesScreen> {
  late Database _database;
  List<Map<String, dynamic>> _notes = [];
  TextEditingController _noteController = TextEditingController();
  TextEditingController _searchController = TextEditingController();
  int? _editingId;
  String? _notificationMessage;

  @override
  void initState() {
    super.initState();
    _initDatabase();
  }

  Future<void> _initDatabase() async {
    _database = await openDatabase(
      join(await getDatabasesPath(), 'notes.db'),
      onCreate: (db, version) {
        return db.execute(
          "CREATE TABLE notes(id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)",
        );
      },
      version: 1,
    );
    _fetchNotes();
  }

  Future<void> _fetchNotes({String query = ''}) async {
    final List<Map<String, dynamic>> notes = query.isEmpty
        ? await _database.query('notes')
        : await _database.query(
      'notes',
      where: 'content LIKE ?',
      whereArgs: ['%$query%'],
    );
    setState(() {
      _notes = notes;
    });
  }

  Future<void> _addOrUpdateNote() async {
    if (_noteController.text.isNotEmpty) {
      if (_editingId == null) {
        await _database.insert('notes', {'content': _noteController.text});
        _showNotification("Note added successfully!");
      } else {
        await _database.update(
          'notes',
          {'content': _noteController.text},
          where: 'id = ?',
          whereArgs: [_editingId],
        );
        _showNotification("Note updated successfully!");
        _editingId = null;
      }
      _noteController.clear();
      _fetchNotes();
    }
  }

  Future<void> _deleteNote(int id) async {
    await _database.delete('notes', where: 'id = ?', whereArgs: [id]);
    _showNotification("Note deleted successfully!");
    _fetchNotes();
  }

  void _editNote(Map<String, dynamic> note) {
    setState(() {
      _editingId = note['id'];
      _noteController.text = note['content'];
    });
  }

  void _showNotification(String message) {
    setState(() {
      _notificationMessage = message;
    });
    Future.delayed(Duration(seconds: 2), () {
      setState(() {
        _notificationMessage = null;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Notes Manager'),
        actions: [
          IconButton(
            icon: Icon(Icons.brightness_6),
            onPressed: () => widget.toggleTheme(),
          )
        ],
      ),
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green, Colors.orange],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.all(8.0),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search notes',
                      suffixIcon: IconButton(
                        icon: Icon(Icons.search),
                        onPressed: () =>
                            _fetchNotes(query: _searchController.text),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _noteController,
                          decoration: InputDecoration(
                            hintText: 'Enter a note',
                          ),
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.save),
                        onPressed: _addOrUpdateNote,
                      )
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: _notes.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        title: Text(_notes[index]['content']),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(Icons.edit),
                              onPressed: () => _editNote(_notes[index]),
                            ),
                            IconButton(
                              icon: Icon(Icons.delete),
                              onPressed: () =>
                                  _deleteNote(_notes[index]['id']),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                )
              ],
            ),
          ),
          if (_notificationMessage != null)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Material(
                elevation: 5,
                child: Container(
                  color: Colors.green,
                  padding: EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  child: Text(
                    _notificationMessage!,
                    style: TextStyle(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
