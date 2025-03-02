import 'dart:io';

// Contact List
List<Map<String, String>> contacts = [];

void main() {
  showWelcomeMessage();
  authenticateUser();

  while (true) {
    print('\nContact Manager');
    print('1. Add Contact');
    print('2. View Contacts');
    print('3. Update Contact');
    print('4. Delete Contact');
    print('5. Exit');
    stdout.write('Choose an option: ');

    String? choice = stdin.readLineSync();
    switch (choice) {
      case '1':
        addContact();
        break;
      case '2':
        viewContacts();
        break;
      case '3':
        updateContact();
        break;
      case '4':
        deleteContact();
        break;
      case '5':
        print('Exiting Contact Manager.');
        return;
      default:
        print('Invalid option. Please try again.');
    }
  }
}

void showWelcomeMessage() {
  print('====================================');
  print(' Welcome to Contact Manager App ');
  print('====================================');
  print('\nThis app helps you to:');
  print('1. Store and manage your contacts efficiently.');
  print('2. Easily search, update, and delete contacts.');
  print('3. Keep your contact list organized and sorted.');
  print('\nPress any key to continue...');
  stdin.readLineSync();
}

void authenticateUser() {
  while (true) {
    stdout.write('Enter password to access the app: ');
    String? password = stdin.readLineSync();
    if (password == '123') {
      print('Access granted!');
      break;
    } else {
      print('Incorrect password, please try again.');
    }
  }
}

void addContact() {
  stdout.write('Enter name: ');
  String name = stdin.readLineSync()!.trim();

  stdout.write('Enter phone: ');
  String phone = stdin.readLineSync()!.trim();

  stdout.write('Enter email: ');
  String email = stdin.readLineSync()!.trim();

  if (name.isEmpty || phone.isEmpty || email.isEmpty) {
    print('Error: All fields are required.');
    return;
  }

  contacts.add({'name': name, 'phone': phone, 'email': email});
  print('Contact added successfully!');
}

void viewContacts() {
  if (contacts.isEmpty) {
    print('No contacts available.');
    return;
  }

  stdout.write('Enter search keyword (or press enter to view all): ');
  String query = stdin.readLineSync()!.trim().toLowerCase();

  stdout.write('Sort by Name (A for Ascending, D for Descending): ');
  String order = stdin.readLineSync()!.trim().toUpperCase();

  List<Map<String, String>> filteredContacts = contacts.where((c) => c['name']!.toLowerCase().contains(query)).toList();

  if (order == 'D') {
    filteredContacts.sort((a, b) => b['name']!.compareTo(a['name']!));
  } else {
    filteredContacts.sort((a, b) => a['name']!.compareTo(b['name']!));
  }

  print('\nContact List:');
  for (var contact in filteredContacts) {
    print('Name: ${contact['name']}, Phone: ${contact['phone']}, Email: ${contact['email']}');
  }
}

void updateContact() {
  stdout.write('Enter the name of the contact to update: ');
  String name = stdin.readLineSync()!.trim();

  var contact = contacts.firstWhere((c) => c['name'] == name, orElse: () => {});
  if (contact.isEmpty) {
    print('Contact not found.');
    return;
  }

  stdout.write('Enter new phone (leave blank to keep unchanged): ');
  String phone = stdin.readLineSync()!.trim();

  stdout.write('Enter new email (leave blank to keep unchanged): ');
  String email = stdin.readLineSync()!.trim();

  if (phone.isNotEmpty) contact['phone'] = phone;
  if (email.isNotEmpty) contact['email'] = email;

  print('Contact updated successfully!');
}

void deleteContact() {
  stdout.write('Enter the name of the contact to delete: ');
  String name = stdin.readLineSync()!.trim();

  contacts.removeWhere((c) => c['name'] == name);
  print('Contact deleted successfully!');
}


