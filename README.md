# Project Creator with Firebase & Pollinations AI

A modern web application that allows users to create projects using AI-powered generation with Firebase backend integration.

## Features

- **AI-Powered Content Generation**: Uses Pollinations API to generate project descriptions and images
- **User Authentication**: Firebase Google Sign-In integration
- **Project Management**: Create, view, and manage projects with persistent storage
- **Real-time Updates**: Firebase Firestore for real-time data synchronization
- **Modern UI**: Beautiful glassmorphic design with smooth animations

## Setup Instructions

### 1. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google provider
3. Set up Firestore Database:
   - Go to Firestore Database → Create database
   - Start in test mode (update security rules for production)
4. Get your Firebase configuration:
   - Project Settings → General → Your apps → Web app → Firebase SDK snippet
   - Copy the config object

### 2. Pollinations API Setup

1. Get your API key from [Pollinations](https://pollinations.ai)
2. Sign up for an account to get your API key

### 3. Environment Configuration

1. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here

   # Pollinations API
   VITE_POLLINATIONS_API_KEY=your_pollinations_api_key_here
   ```

### 4. Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### 5. Deployment to Netlify

#### Option 1: Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist` folder to [Netlify](https://netlify.com)

#### Option 2: Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

#### Option 3: Git Integration

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy automatically on push

## Usage

1. **Sign In**: Click the profile icon and sign in with Google
2. **Create Projects**: Type what you want to create and press Enter
3. **AI Generation**: The app will automatically generate descriptions and images using Pollinations AI
4. **View Projects**: Click on project cards to view details
5. **Manage Projects**: Your projects are saved to Firebase and persist across sessions

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Authentication, Firestore)
- **AI Integration**: Pollinations API
- **Deployment**: Netlify

## Security Notes

- Environment variables are prefixed with `VITE_` to be accessible in the browser
- For production, update Firebase security rules to restrict access
- Consider using Firebase Functions for sensitive operations
- API keys are client-side but can be restricted in Firebase/Pollinations dashboards

## Troubleshooting

- **Firebase errors**: Check that your configuration is correct and services are enabled
- **API errors**: Verify your Pollinations API key is valid
- **Build errors**: Ensure all dependencies are installed and Node.js version is compatible
- **Deployment issues**: Check environment variables are set correctly in Netlify dashboard

## License

MIT License - feel free to use this project for your own applications!
