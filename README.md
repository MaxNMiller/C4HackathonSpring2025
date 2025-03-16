# Collaborative Drawing Application

A real-time collaborative drawing application where users can be matched with partners to draw together on a shared canvas.

## Features
- Real-time drawing synchronization
- Matchmaking system for pairing users
- User count display
- Color picker and brush size control
- Canvas clearing synchronization

## Deployment Instructions for Render.com

1. **Create a GitHub Repository** (if you haven't already)
   - Push your code to GitHub
   - Make sure your repository is public

2. **Sign Up for Render**
   - Go to [render.com](https://render.com)
   - Sign up using your GitHub account

3. **Create a New Web Service**
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Use the following settings:
     - Name: `your-app-name`
     - Environment: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: `Free`

4. **Set Environment Variables**
   - No environment variables are required for basic setup

5. **Deploy**
   - Click "Create Web Service"
   - Wait for the deployment to complete

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open `http://localhost:3000` in your browser

## Technologies Used
- Node.js
- Express
- Socket.IO
- HTML5 Canvas


https://docs.google.com/presentation/d/1U4aP_uzbVLu-2cQlBeSIMxJbzC--Svh885E_GgKMnk8/edit?usp=sharing
