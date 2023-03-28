# Jotter
Jotter is a minimalist to-do list app designed to keep things simple and focused.
It is built using Node.js and EJS for the frontend and MongoDB for the backend. 
User authentication is implemented using Passport and OAuth 2.0, with Google sign-in also supported.

### Features
* Create and manage to-do items
* Mark tasks as completed
* User authentication with Passport and OAuth 2.0
* Google sign-in support

### Installation
To install Jotter, follow these steps:

* Clone the repository: git clone https://github.com/subhajit-mallick/jotter.git
* Navigate to the project directory: cd jotter
* Install dependencies: npm install
* Create a .env file in the root directory with the following variables:
  - Add the following enviroment variables inside .env file
    - SECRET_CODE=your_secret_code
    - MONGO_URLI=your_mongodb_uri_here
    - GOOGLE_CLIENT_ID=your_google_client_id_here
    - GOOGLE_CLIENT_SECRET=your_google_client_secret_here
    - GOOGLE_CALLBACK_URL=your_google_callback_url
    
Start the server: node app.js
Navigate to http://localhost:3000 in your web browser to use the app

### Usage
- Jotter is a simple app with an easy-to-use interface. 
- To create a new task, simply enter it in the input field and press Enter. 
- To mark a task as completed, click the checkbox next to it.
- To sign in to Jotter, click the "Sign in with Google" button and follow the prompts to authenticate with your Google account.
- Alternatively, sign in with Email & Password is also available.

### Contributing
Contributions to Jotter are welcome! If you find a bug or have an idea for a new feature, please open an issue or submit a pull request.
