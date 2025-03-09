import 'dart:async'; // Provides support for asynchronous programming, including Future and Stream classes.
import 'dart:convert'; // Provides encoding and decoding utilities for JSON and other formats.
import 'package:flutter/material.dart'; // Core Flutter package for building UI components.
import 'package:shared_preferences/shared_preferences.dart'; // Allows storing and retrieving small amounts of data persistently.


void main() => runApp(const MaterialApp(home: CategoryScreen()));
// The main function initializes the Flutter app and sets CategoryScreen as the home screen.

class CategoryScreen extends StatefulWidget {
// CategoryScreen is a StatefulWidget because it needs to maintain and update the list of categories and flashcards dynamically.

  const CategoryScreen({Key? key}) : super(key: key);

  @override
  _CategoryScreenState createState() => _CategoryScreenState();
// This creates the state for CategoryScreen, allowing it to rebuild when data changes.
}

class _CategoryScreenState extends State<CategoryScreen> {
// The state class _CategoryScreenState manages the UI updates and logic for CategoryScreen.

  List<String> categories = ["Math", "History", "English"];
  // A list to store the available categories.

  Map<String, List<Flashcard>> flashcardsByCategory = {
    "Math": [
      Flashcard(question: "What is 5 + 3?", answer: "8"),
      Flashcard(question: "What is 7 × 6?", answer: "42"),
    ],
    "History": [],
    "English": [],
  };
  // A map that stores flashcards for each category.

  @override
  void initState() {
    super.initState();
    _loadData();
  }
  // initState() is called once when the widget is inserted into the widget tree.
  // It is used here to load saved categories and flashcards from local storage.

  Future<void> _loadData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    // SharedPreferences is used to retrieve saved data persistently.

    setState(() {
      categories = prefs.getStringList('categories') ?? categories;
      // Load saved categories from SharedPreferences.

      for (String category in categories) {
        String? flashcardsJson = prefs.getString('flashcards_$category');
        flashcardsByCategory[category] = flashcardsJson != null
            ? (jsonDecode(flashcardsJson) as List)
            .map((item) => Flashcard.fromJson(item))
            .toList()
            : [];
        // Load saved flashcards for each category and convert JSON data back into Flashcard objects.
      }
    });
  }

  Future<void> _saveData() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    // Obtain a SharedPreferences instance to save data.

    prefs.setStringList('categories', categories);
    // Save the list of categories.

    for (String category in categories) {
      prefs.setString(
          'flashcards_$category', jsonEncode(flashcardsByCategory[category]));
      // Save flashcards of each category in JSON format.
    }
  }

  void _addCategory() {
    TextEditingController categoryController = TextEditingController();
    // Controller to handle user input for adding a new category.

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Add Category"),
          content: TextField(
            controller: categoryController,
            decoration: const InputDecoration(hintText: "Enter category name"),
          ),
          actions: [
            TextButton(
              onPressed: () {
                if (categoryController.text.isNotEmpty) {
                  setState(() {
                    categories.add(categoryController.text);
                    flashcardsByCategory[categoryController.text] = [];
                  });
                  _saveData();
                  Navigator.pop(context);
                }
              },
              child: const Text("Add"),
            ),
          ],
        );
      },
    );
  }
  // This function shows a dialog to allow the user to enter a new category name.
  // It adds the new category to the list and saves the updated data.

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Select Category")),
      // AppBar displaying the screen title.

      body: ListView.builder(
        itemCount: categories.length,
        // The number of items in the list equals the number of categories.

        itemBuilder: (context, index) {
          return ListTile(
            title: Text(categories[index]),
            trailing: const Icon(Icons.arrow_forward),
            // Display each category name with a forward arrow icon.

            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      FlashcardScreen(category: categories[index]),
                ),
              );
            },
            // When a category is tapped, navigate to the FlashcardScreen for that category.
          );
        },
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: _addCategory,
        child: const Icon(Icons.add),
      ),
      // A floating button to add new categories.
    );
  }
}

class Flashcard {
  final String question;
  final String answer;

  // Constructor to initialize a flashcard with a question and answer.
  Flashcard({required this.question, required this.answer});

  // Method to convert a Flashcard object into a JSON-compatible format.
  Map<String, dynamic> toJson() => {'question': question, 'answer': answer};

  // Factory constructor to create a Flashcard object from a JSON map.
  factory Flashcard.fromJson(Map<String, dynamic> json) =>
      Flashcard(question: json['question'], answer: json['answer']);
}

// StatefulWidget is used because the screen's state (list of flashcards) changes dynamically.
class FlashcardScreen extends StatefulWidget {
  final String category; // Category of the flashcards.

  const FlashcardScreen({Key? key, required this.category}) : super(key: key);

  @override
  _FlashcardScreenState createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends State<FlashcardScreen> {
  List<Flashcard> flashcards = []; // List to store flashcards for the selected category.

  @override
  void initState() {
    super.initState();
    _loadFlashcards(); // Load saved flashcards from shared preferences when the screen initializes.
  }

  // Loads flashcards from SharedPreferences for the given category.
  Future<void> _loadFlashcards() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? flashcardsJson = prefs.getString('flashcards_${widget.category}');
    if (flashcardsJson != null) {
      setState(() {
        flashcards = (jsonDecode(flashcardsJson) as List)
            .map((item) => Flashcard.fromJson(item))
            .toList();
      });
    }
  }

  // Adds a new flashcard to the category.
  Future<void> _addFlashcard() async {
    TextEditingController questionController = TextEditingController();
    TextEditingController answerController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Add Flashcard"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Input field for entering the flashcard question.
              TextField(controller: questionController, decoration: const InputDecoration(hintText: "Question")),
              // Input field for entering the flashcard answer.
              TextField(controller: answerController, decoration: const InputDecoration(hintText: "Answer")),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () async {
                // Ensure that both fields are not empty before adding the flashcard.
                if (questionController.text.isNotEmpty &&
                    answerController.text.isNotEmpty) {
                  setState(() {
                    // Add the new flashcard to the list.
                    flashcards.add(Flashcard(
                        question: questionController.text,
                        answer: answerController.text));
                  });

                  // Save the updated flashcards list to SharedPreferences.
                  SharedPreferences prefs =
                  await SharedPreferences.getInstance();
                  prefs.setString(
                      'flashcards_${widget.category}', jsonEncode(flashcards));

                  Navigator.pop(context); // Close the dialog after adding the flashcard.
                }
              },
              child: const Text("Add"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.category)), // Display category name as title.
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: flashcards.length, // Number of flashcards.
              itemBuilder: (context, index) {
                return FlashcardWidget(flashcard: flashcards[index]); // Display each flashcard using a custom widget.
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Button to add a new flashcard.
                ElevatedButton(
                  onPressed: _addFlashcard,
                  child: const Text("Add Flashcard"),
                ),
                // Button to navigate to the QuizScreen for the selected category.
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            QuizScreen(category: widget.category),
                      ),
                    );
                  },
                  child: const Text("Take Quiz"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class FlashcardWidget extends StatefulWidget {
  final Flashcard flashcard;
  const FlashcardWidget({Key? key, required this.flashcard}) : super(key: key);

  @override
  _FlashcardWidgetState createState() => _FlashcardWidgetState();
}

class _FlashcardWidgetState extends State<FlashcardWidget> {
  bool showAnswer = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => showAnswer = !showAnswer),
      child: Card(
        elevation: 4,
        margin: const EdgeInsets.all(10),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: Text(
              showAnswer ? widget.flashcard.answer : widget.flashcard.question,
              key: ValueKey(showAnswer),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}

class QuizScreen extends StatefulWidget {
  final String category;
  const QuizScreen({Key? key, required this.category}) : super(key: key);

  @override
  _QuizScreenState createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  List<Flashcard> flashcards = [];
  int currentQuestionIndex = 0;
  bool showAnswer = false;
  int correctAnswers = 0;
  int wrongAnswers = 0;
  int totalQuestions = 0;
  Stopwatch timer = Stopwatch();
  late Timer _ticker;

  @override
  void initState() {
    super.initState();
    _loadFlashcards();
    timer.start();
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {}); // Refresh UI every second to update the timer
    });
  }

  @override
  void dispose() {
    _ticker.cancel();
    super.dispose();
  }

  Future<void> _loadFlashcards() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? flashcardsJson = prefs.getString('flashcards_${widget.category}');
    if (flashcardsJson != null) {
      setState(() {
        flashcards = (jsonDecode(flashcardsJson) as List)
            .map((item) => Flashcard.fromJson(item))
            .toList();
        totalQuestions = flashcards.length;
      });
    }
  }

  void _nextQuestion() {
    if (currentQuestionIndex < flashcards.length - 1) {
      setState(() {
        currentQuestionIndex++;
        showAnswer = false;
      });
    } else {
      _showQuizSummary();
    }
  }

  void _showQuizSummary() {
    timer.stop();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Quiz Summary"),
          content: Text(
            "Total Questions: $totalQuestions\n"
                "Correct Answers: $correctAnswers\n"
                "Wrong Answers: $wrongAnswers\n"
                "Total Time: ${timer.elapsed.inSeconds} seconds",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context); // Go back to category screen
              },
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }

  void _answerQuestion(bool isCorrect) {
    setState(() {
      if (isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Next Question?"),
          content: const Text("Do you want to move to the next question?"),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _nextQuestion();
              },
              child: const Text("Yes"),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text("No"),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (flashcards.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text("Quiz")),
        body: const Center(child: Text("No flashcards available in this category!")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Quiz"),
      ),
      body: Column(
        children: [
          // Quiz Info at the top
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Text("Total Questions: $totalQuestions"),
                Text("Correct: $correctAnswers  |  Wrong: $wrongAnswers"),
                Text("Time: ${timer.elapsed.inSeconds} sec"),
              ],
            ),
          ),

          // Flashcard
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  showAnswer = !showAnswer;
                });
              },
              child: Center(  // Ensures card is centered
                child: SizedBox(
                  width: 300, // Restricts the card width
                  child: Card(
                    elevation: 4,
                    margin: const EdgeInsets.all(20),
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          showAnswer
                              ? flashcards[currentQuestionIndex].answer
                              : flashcards[currentQuestionIndex].question,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Show Buttons only when answer is revealed
          if (showAnswer)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => _answerQuestion(true),
                  child: const Text("Correct ✅"),
                ),
                ElevatedButton(
                  onPressed: () => _answerQuestion(false),
                  child: const Text("Wrong ❌"),
                ),
              ],
            ),

          // Submit Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ElevatedButton(
              onPressed: _showQuizSummary,
              child: const Text("Submit"),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(150, 50),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
