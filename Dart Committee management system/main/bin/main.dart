import 'dart:io';
import 'dart:convert';

// Constants
const String fileName = 'members.txt';
const String COMMITTEE_START_DATE = '20-02-2025';
const int MAX_MEMBERS = 10;
const String ADMIN_PASSWORD = '123';

// Member class
class Member {
  late int id;
  late String name;
  late String phone;
  late String preferredMonth;
  late double contributions;
  late int attendanceCount;

  // Default constructor
  Member() {
    id = -1;
    name = '';
    phone = '';
    preferredMonth = 'Not Assigned';
    contributions = 0.0;
    attendanceCount = 0;
  }

  // Parameterized constructor
  Member.withParams(this.id, this.name, this.phone, this.contributions, this.attendanceCount) {
    preferredMonth = 'Not Assigned';
  }

  // Display member information
  void displayMember() {
    print('ID: $id, Name: $name, Phone: $phone, Committee Month: $preferredMonth, '
        'Contributions: \$$contributions, Attendance: $attendanceCount meetings');
  }
}

// Global variables
List<Member> committee = [];
int memberCount = 0;
bool committeeStarted = false;

// File operations
Future<void> saveMembersToFile() async {
  try {
    final file = File(fileName);
    await file.writeAsString(committee.map((member) =>
    '${member.id} ${member.name} ${member.phone} ${member.preferredMonth} '
        '${member.contributions} ${member.attendanceCount}'
    ).join('\n'));
  } catch (e) {
    print('Error: Could not open file for writing!');
  }
}

Future<void> loadMembersFromFile() async {
  try {
    final file = File(fileName);
    if (await file.exists()) {
      final contents = await file.readAsString();
      committee.clear();
      memberCount = 0;

      for (final line in LineSplitter().convert(contents)) {
        if (line.isNotEmpty) {
          final parts = line.split(' ');
          if (parts.length >= 6) {
            committee.add(Member()
              ..id = int.parse(parts[0])
              ..name = parts[1]
              ..phone = parts[2]
              ..preferredMonth = parts[3]
              ..contributions = double.parse(parts[4])
              ..attendanceCount = int.parse(parts[5]));
            memberCount++;
          }
        }
      }
    }
  } catch (e) {
    print('Error loading members from file');
  }
}

// Member management functions
void addMember(String name, String phone) {
  if (memberCount >= MAX_MEMBERS) {
    print('Committee is full. Cannot add more members.');
    return;
  }

  final newId = memberCount + 1;
  committee.add(Member.withParams(newId, name, phone, 0.0, 0));
  memberCount++;

  print('Member added successfully!\nAssigned ID: $newId');
  saveMembersToFile();
}

bool isMonthAssigned(String month) {
  return committee.any((member) => member.preferredMonth == month);
}

void assignCommitteeMonth(int id, String month, String password) {
  if (password != ADMIN_PASSWORD) {
    print('Incorrect password! You are not an admin.');
    return;
  }

  final memberIndex = committee.indexWhere((member) => member.id == id);
  if (memberIndex == -1) {
    print('Member not found.');
    return;
  }

  if (isMonthAssigned(month)) {
    print('Error: This month is already assigned to another member.');
    return;
  }

  committee[memberIndex].preferredMonth = month;
  print('Committee month assigned successfully!');
  saveMembersToFile();
}

void removeMember(int id) {
  if (committeeStarted) {
    print('Committee has started from $COMMITTEE_START_DATE. No member can be removed.');
    return;
  }

  if (memberCount == 0) {
    print('No members in the committee to remove.');
    return;
  }

  final index = committee.indexWhere((member) => member.id == id);
  if (index == -1) {
    print('Member not found.');
    return;
  }

  committee.removeAt(index);
  memberCount--;
  print('Member removed successfully!');
  saveMembersToFile();
}

void displayMembers(String password) {
  if (password != ADMIN_PASSWORD) {
    print('Incorrect password! You are not an admin.');
    return;
  }

  if (memberCount == 0) {
    print('No members in the committee.');
    return;
  }

  print('\nCommittee Members:');
  for (var member in committee) {
    member.displayMember();
  }
}

void updateContributionAndAttendance(int id, double contributionAmount, int attendance, String password) {
  if (password != ADMIN_PASSWORD) {
    print('Incorrect password! You are not an admin.');
    return;
  }

  final memberIndex = committee.indexWhere((member) => member.id == id);
  if (memberIndex == -1) {
    print('Member not found.');
    return;
  }

  committee[memberIndex].contributions += contributionAmount;
  committee[memberIndex].attendanceCount += attendance;

  print('Contribution and attendance updated successfully!');
  saveMembersToFile();
}

// Policies display
void viewPolicies() {
  do {

    print('\n\n\t\t\t******** Committee Policies ********\n');
    print('1. A committee can have a maximum of 10 members.');
    print('2. Members must pay their daily contribution on time.');
    print('3. Once a committee starts, no new members can be added or removed.');
    print('4. The committee payout will be assigned based on the admin\'s decision.');
    print('5. Any disputes should be resolved within the group.');
    print('6. Late payments may result in disqualification from future committees.');
    print('7. The admin reserves the right to make final decisions regarding disputes.');
    print('****************************************\n');

    print('Press Y to return to the main menu: ');
    final input = stdin.readLineSync();
    if (input?.toLowerCase() == 'y') {
      return;
    }
    print('Invalid choice. Please press Y to return.');
  } while (true);
}

// Committee information display
void viewinfo() {
  do {

    print('\n\n\t\t\t******************************');
    print('			Committee Contribution Info');
    print('			******************************\n');
    print('Each member must contribute 100 rupees daily.');

    final totalAmount = 100 * 30 * memberCount;
    print('Total Monthly Committee Amount: $totalAmount rupees');
    print('--------------------------------------\n');

    if (memberCount == 0) {
      print('No members in the committee.');
      return;
    }

    print('Member Names and Assigned Months:');
    for (var member in committee) {
      print('Name: ${member.name} - Committee month: ${member.preferredMonth}');
    }
    print('--------------------------------------\n');

    print('Press Y to return to the main menu: ');
    final input = stdin.readLineSync();
    if (input?.toLowerCase() == 'y') {
      return;
    }
    print('Invalid choice. Please press Y to return.');
  } while (true);
}

// Main menu function
Future<void> showMainMenu() async {
  int choice = 0;
  do {

    print('\n\n\n\t\t\tCommittee Management System\n');
    print('1. Add Member');
    print('2. Assign Committee Month (Admin)');
    print('3. Remove Member');
    print('4. View Members (Admin)');
    print('5. Update Contribution & Attendance (Admin)');
    print('6. View Policies');
    print('7. View Committee info');
    print('8. Exit');

    try {
      stdout.write('Enter your choice: ');
      final input = stdin.readLineSync();
      choice = int.parse(input ?? '0');

      switch (choice) {
        case 1:
          stdout.write('Enter Member Name: ');
          final name = stdin.readLineSync() ?? '';
          stdout.write('Enter Phone Number: ');
          final phone = stdin.readLineSync() ?? '';
          addMember(name, phone);
          break;

        case 2:
          stdout.write('Enter Admin Password: ');
          final password = stdin.readLineSync() ?? '';
          if (password == ADMIN_PASSWORD) {
            stdout.write('Enter Member ID: ');
            final idStr = stdin.readLineSync() ?? '0';
            stdout.write('Enter Committee Month: ');
            final month = stdin.readLineSync() ?? '';
            assignCommitteeMonth(int.parse(idStr), month, password);
          } else {
            print('Incorrect password!');
          }
          break;

        case 3:
          stdout.write('Enter Member ID to remove: ');
          final idStr = stdin.readLineSync() ?? '0';
          removeMember(int.parse(idStr));
          break;

        case 4:
          stdout.write('Enter Admin Password: ');
          final password = stdin.readLineSync() ?? '';
          displayMembers(password);
          break;

        case 5:
          stdout.write('Enter Admin Password: ');
          final password = stdin.readLineSync() ?? '';
          if (password == ADMIN_PASSWORD) {
            stdout.write('Enter Member ID: ');
            final idStr = stdin.readLineSync() ?? '0';
            stdout.write('Enter contribution amount: ');
            final amountStr = stdin.readLineSync() ?? '0';
            stdout.write('Enter attendance count: ');
            final attendanceStr = stdin.readLineSync() ?? '0';

            updateContributionAndAttendance(
                int.parse(idStr),
                double.parse(amountStr),
                int.parse(attendanceStr),
                password
            );
          }
          break;

        case 6:
          viewPolicies();
          break;

        case 7:
          viewinfo();
          break;

        case 8:
          print('Exiting program. Goodbye!');
          return;

        default:
          print('Invalid choice, please try again.');
      }
    } catch (e) {
      print('Please enter valid numeric input');
    }

    print('\nPress Enter to continue...');
    stdin.readLineSync();
  } while (choice != 8);
}

// Main function
Future<void> main() async {
  await loadMembersFromFile();
  await showMainMenu();
}