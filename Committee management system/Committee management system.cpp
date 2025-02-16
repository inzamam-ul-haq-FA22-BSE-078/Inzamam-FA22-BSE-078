#include <iostream>
#include <fstream>

using namespace std;

const string fileName = "members.txt"; // File to store member data
const string COMMITTEE_START_DATE = "20-02-2025";
const int MAX_MEMBERS = 10;
const string ADMIN_PASSWORD = "123";

class Member {
public:
    int id;
    string name;
    string phone;
    string preferredMonth;
    double contributions;
    int attendanceCount;

    Member() {
        id = -1;
        name = "";
        phone = "";
        preferredMonth = "Not Assigned";
        contributions = 0.0;
        attendanceCount = 0;
    }

    Member(int i, string n, string p, double c, int a) {
        id = i;
        name = n;
        phone = p;
        preferredMonth = "Not Assigned";
        contributions = c;
        attendanceCount = a;
    }

    void displayMember() {
        cout << "ID: " << id
             << ", Name: " << name
             << ", Phone: " << phone
             << ", Committee Month: " << preferredMonth
             << ", Contributions: $" << contributions
             << ", Attendance: " << attendanceCount << " meetings\n";
    }
};

Member committee[MAX_MEMBERS];
int memberCount = 0;
bool committeeStarted = false;

void clearScreen() {
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

void saveMembersToFile() {
    ofstream file(fileName.c_str());
    if (file.is_open()) {
        for (int i = 0; i < memberCount; i++) {
            file << committee[i].id << " "
                 << committee[i].name << " "
                 << committee[i].phone << " "
                 << committee[i].preferredMonth << " "
                 << committee[i].contributions << " "
                 << committee[i].attendanceCount << endl;
        }
        file.close();
    } else {
        cout << "		Error: Could not open file for writing!\n";
    }
}

void loadMembersFromFile() {
    ifstream file(fileName.c_str());
    if (file.is_open()) {
        memberCount = 0;
        while (file >> committee[memberCount].id
                   >> committee[memberCount].name
                   >> committee[memberCount].phone
                   >> committee[memberCount].preferredMonth
                   >> committee[memberCount].contributions
                   >> committee[memberCount].attendanceCount) {
            memberCount++;
            if (memberCount >= MAX_MEMBERS) break;
        }
        file.close();
    }
}

void addMember() {
	clearScreen();
	cout<<"\n\n\n 		Add a new member\n\n";
    if (memberCount >= MAX_MEMBERS) {
        cout << "		Committee is full. Cannot add more members.\n";
        return;
    }

    string name, phone;
    cout << "		Enter Member Name: ";
    cin >> name;
    cout << "		Enter Phone Number: ";
    cin >> phone;

    int newId = memberCount + 1;
    committee[memberCount] = Member(newId, name, phone, 0.0, 0);
    memberCount++;

    cout << "		Member added successfully!\n		Assigned ID: " << newId << endl;
    saveMembersToFile();
}

bool isMonthAssigned(string month) {
    for (int i = 0; i < memberCount; i++) {
        if (committee[i].preferredMonth == month) {
            return true; // Month is already assigned
        }
    }
    return false;
}

void assignCommitteeMonth() {
	clearScreen();
	cout<<"\n\n\n 		Assign month to members\n\n";
    string password;
    cout << "		Enter Admin Password: ";
    cin >> password;

    if (password != ADMIN_PASSWORD) {
        cout << "		Incorrect password! You are not an admin.\n";
        return;
    }

    int id;
    string month;
    cout << "		Enter Member ID: ";
    cin >> id;
    
    for (int i = 0; i < memberCount; i++) {
        if (committee[i].id == id) {
            cout << "		Enter Committee Month for " << committee[i].name << ": ";
            cin >> month;

            if (isMonthAssigned(month)) {
                cout << "		Error: This month is already assigned to another member. Please choose a unique month.\n";
                return;
            }

            committee[i].preferredMonth = month;
            cout << "		Committee month assigned successfully!\n";
            saveMembersToFile();
            return;
        }
    }
    cout << "		Member not found.\n";
}

void removeMember() {
	clearScreen();
	cout<<"\n\n\n 		Remove any member\n\n";
    if (committeeStarted) {
        cout << "		Committee has started from " << COMMITTEE_START_DATE << ". No member can be removed.\n";
        return;
    }
    if (memberCount == 0) {
        cout << "		No members in the committee to remove.\n";
        return;
    }

    int id;
    cout << "		Enter the ID of the member to remove: ";
    cin >> id;
    
    for (int i = 0; i < memberCount; i++) {
        if (committee[i].id == id) {
            for (int j = i; j < memberCount - 1; j++) {
                committee[j] = committee[j + 1];
            }
            memberCount--;
            cout << "		Member removed successfully!\n";
            saveMembersToFile();
            return;
        }
    }
    cout << "		Member not found.\n";
}

void displayMembers() {
	clearScreen();
	cout<<"\n\n\n 		Show members info\n\n";
    string password;
    cout << "		Enter Admin Password: ";
    cin >> password;

    if (password != ADMIN_PASSWORD) {
        cout << "		Incorrect password! You are not an admin.\n";
        return;
    }

    if (memberCount == 0) {
        cout << "		No members in the committee.\n";
        return;
    }

    cout << "\n		Committee Members:\n";
    for (int i = 0; i < memberCount; i++) {
        committee[i].displayMember();
    }
}

void updateContributionAndAttendance() {
	clearScreen();
	cout<<"\n\n\n 		Attendance & Contribution\n\n";
    string password;
    cout << "		Enter Admin Password: ";
    cin >> password;

    if (password != ADMIN_PASSWORD) {
        cout << "		Incorrect password! You are not an admin.\n";
        return;
    }

    int id;
    double amount;
    int attendance;

    cout << "		Enter Member ID: ";
    cin >> id;

    for (int i = 0; i < memberCount; i++) {
        if (committee[i].id == id) {
            cout << "		Enter contribution amount: ";
            cin >> amount;
            committee[i].contributions += amount;

            cout << "		Enter number of attendance entries to add: ";
            cin >> attendance;
            committee[i].attendanceCount += attendance;

            cout << "		Contribution and attendance updated successfully!\n";
            saveMembersToFile();
            return;
        }
    }
    cout << "		Member not found.\n";
}

void showMainMenu();

// Function to display policies
void viewPolicies() {
    char choice;
    do {
        clearScreen();
        cout << "\n\n			******** Committee Policies ********\n\n";
        cout << "		1. A committee can have a maximum of 10 members.\n";
        cout << "		2. Members must pay their daily contribution on time.\n";
        cout << "		3. Once a committee starts, no new members can be added or removed.\n";
        cout << "		4. The committee payout will be assigned based on the admin's decision.\n";
        cout << "		5. Any disputes should be resolved within the group.\n";
        cout << "		6. Late payments may result in disqualification from future committees.\n";
        cout << "		7. The admin reserves the right to make final decisions regarding disputes.\n";
        cout << "		****************************************\n\n";
        cout << "		Press 'Y' to return to the main menu: ";
        cin >> choice;

        if (choice == 'Y' || choice == 'y') {
            showMainMenu();
            return;
        } else {
            cout << "		Invalid choice. Please press 'Y' to return.\n";
        }
    } while (true);
}


void viewinfo() {
	char choice;
    do {
		    clearScreen();
		    cout << "\n\n			******************************\n";
		    cout << "  			Committee Contribution Info\n";
		    cout << "			******************************\n\n";
		    cout << "		Each member must contribute 100 rupees daily.\n";
		    
		    int totalAmount = 100 * 30 * memberCount;
		    cout << "		Total Monthly Committee Amount: " << totalAmount << " rupees\n";
		    cout << "		--------------------------------------\n\n";
		
		    if (memberCount == 0) {
		        cout << "		No members in the committee.\n";
		        return;
		    }
		
		    cout << "		Member Names and Assigned Months:\n";
		    for (int i = 0; i < memberCount; i++) {
		        cout <<"		Name :"<< committee[i].name << " - " <<"Committee month :"<< committee[i].preferredMonth << "\n";
		    }
		
		    cout << "		--------------------------------------\n\n";
    		cout << "		Press 'Y' to return to the main menu: ";
	        cin >> choice;
	
	        if (choice == 'Y' || choice == 'y') {
	            showMainMenu();
	            return;
	        } else {
	            cout << "		Invalid choice. Please press 'Y' to return.\n";
	        }
    } while (true);
}




void showMainMenu() {
    int choice;
    do {
        clearScreen();
        cout << "\n\n\n				Committee Management System\n\n";
        cout << "		1. Add Member\n";
        cout << "		2. Assign Committee Month (Admin)\n";
        cout << "		3. Remove Member\n";
        cout << "		4. View Members (Admin)\n";
        cout << "		5. Update Contribution & Attendance (Admin)\n";
        cout << "		6. View Policies\n";
        cout << "		7. View Committee info\n";
        cout << "		8. Exit\n";
        cout << "		Enter your choice: ";
        cin >> choice;
        
        switch (choice) {
            case 1:
                addMember();
                break;
            case 2:
                assignCommitteeMonth();
                break;
            case 3:
                removeMember();
                break;
            case 4:
                displayMembers();
                break;
            case 5:
                updateContributionAndAttendance();
                break;
            case 6:
                viewPolicies();
                break;
            case 7:
                viewinfo();
                break;
            case 8:
                cout << "		Exiting program. Goodbye! \n";
                return;
            default:
                cout << "		Invalid choice, please try again.\n";
        }
        cout << "		Press Enter to continue...";
        cin.ignore(); cin.get();
    } while (choice != 8);
}

int main() {
    loadMembersFromFile();
    showMainMenu();
    return 0;
}

