**Collaborative Whiteboard - Real-Time Drawing App**
A full-featured real-time collaborative whiteboard application built with React, Tailwind CSS, and Socket.IO. 
This app allows multiple users to draw together in real-time with tools like pen, eraser, rectangles, circles, and text. It supports undo/redo, clear, image export, and is designed with a modular frontend-backend architecture.

**Features**
- Real-time collaborative canvas (Socket.IO based)
- Drawing tools: Pen, Eraser, Rectangle, Circle, Text
- Undo / Redo functionality
- Clear Canvas button (syncs across users)
- Export canvas as PNG image/pdf
- Per-user actions stored and redrawn
- Modern responsive UI with Tailwind CSS

**Architecture Overview**
Frontend (React + Tailwind): Provides drawing UI, handles tool state, emits drawing actions via sockets.
Backend (Node.js + Express + Socket.IO): Handles socket events, synchronizes canvas state across users.

**Folder Structure**
  collab-whiteboard/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── pages/
│   └── tailwind.config.js
│
├── server/                 # Express + Socket.IO backend
│   └── index.js
│
├── README.md

**Technology Stack**
Frontend: React, Tailwind CSS, useRef, useState, useEffect
Backend: Node.js, Express, Socket.IO

**Install dependencies**
# Frontend
cd client
npm install

# Backend
cd ../server
npm install

**Running the Application**
  **Backend**
  cd server
  node index.js

  **frontend**
  cd client
  npm start

**Future Improvements**
Add text resizing and font styling
Chat feature for collaborators
Authentication + profile avatars
Image background support
Admin controls to lock canvas or mute users

