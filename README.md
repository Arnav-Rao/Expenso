# Expenso
A web application designed to track one's day-to-day expenses

This web app provides an easy and interactive way to upload and track your expenses<BR/>

# Features
* Shows total spent for custom durations of time
* A graph gives a visual representation of one's expenditure 
* Gives you the option to view past transactions
* Provides the user with the option of downloading their transaction history <BR/>

# How to Run<BR/>

>## Using existing Firebase database

  1. Download all files in the repository and save them in the same folder
  2. Run index.html using localhost (Usage of localhost is REQUIRED for the login authentication to work correctly)

   **NOTE: Any form of hosting will work**

     
>## Using localhost on VS Code
     
  1. Install the "Live Server" extension available on VS Code
  2. Keeping index.html open, click on the button with the text "Go Live" present at the bottom left side of VS Code<BR/>

>## Using a different Firebase database<BR/>

### Step 1: Create a Firebase Project
This will be the main container for your app's backend services

1. You can just navigate to the Firebase Console and sign in with your Google account

2. Click on "Add project" or "Create a project"

3. Enter a name for your project (eg, "My-Expense-Tracker") and click "Continue"

4. You can disable Google Analytics for this project to simplify the setup process

5. Click "Create project" Firebase will provision your project, which may take a moment<BR/>

### Step 2: Connect Your Web App & Get Config Keys
Here, you will register your web application with Firebase to get the necessary configuration keys that link your code to the project

1. From your project's dashboard, click the Web icon (</>) to start the setup process

2. Enter an app nickname (eg, "Expenso")

3. Click "Register app"

4. Firebase will display your unique firebaseConfig object This is critical Copy the entire object and save it temporarily in a text editor

5. After copying the configuration, click "Continue to console"<BR/>

### Step 3: Enable Authentication
This allows users to sign up and log in securely using their email and password

1. In the left-hand menu, navigate to Build > Authentication

2. Click the "Get started" button

3. Select the "Sign-in method" tab

4. From the list of providers, click on "Email/Password"

5. Enable the "Email/Password" provider and click "Save"<BR/>

### Step 4: Set Up Firestore Database
Firestore is the cloud database where all your expense data will be stored

1. In the left-hand menu, navigate to Build > Firestore Database

2. Click the "Create database" button

3. In the setup wizard, select "Start in test mode." This allows initial access while you set up the project We will secure it in the next step

4. Click "Next"

5. Choose a Cloud Firestore location (select a region geographically close to you)

6. Click "Enable"<BR/>

### Step 5: Secure Your Database with Rules
These rules are essential for security. They ensure that users can only read, write, and delete their own expense data

1. In the Firestore Database section, select the "Rules" tab

2. Delete the existing rules in the editor

3. Copy and paste the following security rules into the editor:

```
rules_version = '2.';
service cloudfirestore {
  match /databases/{database}/documents { 
    // This rule targets the 'users' collection
    match /users/{userId} {
      // A user can only access their own document
      allow read, write: if requestauth != null && requestauthuid == userId; 

      // This rule targets the 'expenses' collection inside a user's document
      match /expenses/{expenseId} {
        // A user can manage expenses only if they are logged in
        // and the data belongs to them
        allow read, write, create, delete: if requestauth != null && requestauthuid == userId;
      }
    }
  }
}
```
4. Click "Publish" to save the new rules<BR/>

### Step 6: Authorize Your Domain for Testing
To allow the app to work on your local machine, you must add your local development address to Firebase's list of trusted domains

1. Go back to the Authentication section

2. Click on the "Settings" tab

3. Under the "Authorized domains" section, click "Add domain"

4. Enter 1.2.7001. and click Add

5. Click "Add domain" again and also add localhost<BR/>

### Step 7: Add Your firebaseConfig to Your Code
This is the final step to connect your application to the Firebase backend

1. Open your JavaScript files: scriptjs, viewer_scriptjs, and download_scriptjs

2. At the top of each file, locate the placeholder firebaseConfig object

3. Replace the entire placeholder object with the unique firebaseConfig object you copied in Step 2.

4. Your Firebase backend is now fully configured and secure. Your application should now be able to handle user sign-ups, logins, and data storage correctly
 
