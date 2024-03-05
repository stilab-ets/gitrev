# GitRev Gamification System

GitRev is a comprehensive gamification system designed to enhance the GitHub UI dashboard and user experience. It integrates a GitHub app, GitHub authentication, a Chrome extension, a MongoDB database, a Gamification server, and a FastAPI application to provide an engaging and interactive environment for GitHub users.

## Getting Started

These instructions will guide you through setting up GitRev both locally and on the cloud.

### Prerequisites

Before you begin, ensure you have the following accounts and tools installed:
- A GitHub account
- MongoDB account for database creation
- Node.js installed for running server-side code
- Python installed for running FastAPI application

### Local Setup

#### 1. GitHub App (Folder: `probot`)


This guide will walk you through creating a GitHub App and configuring it to work with Probot.

## Step 1: Create Your GitHub App

1. **Developer Settings**:
   - Go to your GitHub account **Settings**.
   - Click on **Developer settings** > **GitHub Apps** > **New GitHub App**.

2. **App Configuration**:
   - Enter your app's name and Homepage URL.
   - Configure your Webhook URL (optional for development).
   - Generate and download your private key securely.

3. **Permissions & Events**:
   - Set necessary permissions and event subscriptions.
   - Click **Create GitHub App**.

## Step 2: Configure Probot

1. **Clone and Prepare**:
   - Clone your Probot app repository to your machine.

2. **Environment Variables**:
   - Navigate to the `probot` folder.
   - Create or edit the `.env` file with the following variables:

   ```env
   APP_ID=<YOUR_APP_ID>
   PRIVATE_KEY=<YOUR_PRIVATE_KEY_CONTENT>
   WEBHOOK_SECRET=<YOUR_WEBHOOK_SECRET>
   GITHUB_CLIENT_ID=<YOUR_GITHUB_CLIENT_ID>
   GITHUB_CLIENT_SECRET=<YOUR_GITHUB_CLIENT_SECRET>
   PORT=<DESIRED_PORT_NUMBER>

   Replace placeholder values with those specific to your app.

    Install & Build:
    Run npm install and npm run build in the probot directory.
    Step 3: Run Your App
    Execute npm start to run your Probot app.
    For more details, you can read the Probot documentation : https://probot.github.io/docs/configuration/

    Note: The .env file already contains the necessary variables. You need to fill in the actual values provided by GitHub.


#### 2. GitHub Authentication

#### 3. Chrome Extension
- **Client ID:** Locate the `client_id` in `background.ts`, which can be found in the GitHub developer settings.
- **Server IP Address:** Configure the `.env` file to set the server IP address, defaulting to `localhost:3002`.

#### 4. MongoDB Database Creation
- Sign up or log in to [MongoDB Cloud](https://www.mongodb.com/products/platform/cloud) to create a free 500 MB cluster.
- Navigate to your created cluster, then to "Database" in the left menu.
- Click on "Connect", select the "Drivers" option, and copy the URI code. This URI enables the connection between your Node.js gamification server and the MongoDB database.
- **Example URI Format:**
mongodb+srv://<username>:<password>@cluster0.j4sk7x6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

#### 5. Gamification Server (Folder: `myserver`)
- Navigate to `/myserver/.env` and configure the following variables:
- `CLIENT_ID`: Obtain this from your GitHub app settings under Developer Settings.
- `CLIENT_SECRET`: Also found in your GitHub app settings.
- `ATLAS_URI`: Use the MongoDB URI from your cluster setup.
- Run the server with the command:
npm start
This command initiates `server.js` on `localhost:3002`.

#### 6. FastAPI App (Folder: `FastAPI`)
Navigate to `/FastAPI/gpt/main.py` and replace the chatgpt api key string with your obtained api key from OpenAi .

- Navigate back to `/FastAPI` and run the command:
uvicorn main:app --reload
This command starts the FastAPI application, making it accessible on port `8000`.

- **Optional:** If an OpenAI ChatGPT API key is unavailable, you can use the open-source model "Vicuna-8b" locally. For setup instructions, refer to the provided YouTube video and ensure to uncomment the Vicuna-related code in the FastAPI application.

### Cloud Setup

AWS setup for each application

## Contributing

Contributions to GitRev are welcome! Please read `CONTRIBUTING.md` for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.


-------------------------------------------------------------
Not the final Readme Version