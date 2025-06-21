import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Toolbar from '../components/Toolbar';
import Canvas from '../components/Canvas';
import toast from 'react-hot-toast';

export default function CanvasRoom({ socket }) {
  const { roomId } = useParams();
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [showShareBox, setShowShareBox] = useState(false);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');
  const [permission, setPermission] = useState('view');
  const [username, setUsername] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const hasJoined = useRef(false);

  useEffect(() => {
    if (!roomId || roomId === 'default') return;
    if (!socket || hasJoined.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const nameFromURL = searchParams.get('username');
    const creatorFlag = searchParams.get('creator')?.toLowerCase() === 'true';

    setIsCreator(creatorFlag);
  
    socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});
socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});
socket.on('connect_error', (err) => {
  console.log('Connection error:', err.message);
});

    let finalName = nameFromURL || localStorage.getItem('canvas-username');
    if (!finalName) {
      finalName = prompt('Enter your name:') || `User-${Math.floor(Math.random() * 1000)}`;
    }
    finalName = finalName.trim();
    setUsername(finalName);
    localStorage.setItem('canvas-username', finalName);
   

    const baseLink = `${window.location.origin}/room/${roomId}`;
    setLink(`${baseLink}?username=${encodeURIComponent(finalName)}&creator=false`);

    if (creatorFlag) {
      socket.emit('create-room', {
        roomId,
        isPrivate: true,
        creatorUsername: finalName,
        allowedUsers: [{ username: finalName.toLowerCase(), permission: 'edit' }]
      });

      socket.on('room-created', () => {
        socket.emit('join-room', { roomId, username: finalName, isCreator: creatorFlag });
      });
    } else {
      socket.emit('join-room', { roomId, username: finalName, isCreator: creatorFlag });
    }
    
    hasJoined.current = true;

    socket.on('set-permission', ({ permission }) => {
      if (permission) setPermission(permission);
    });

    socket.on('access-denied', ({ message }) => {
      alert(message || 'Access Denied');
    });

    return () => {
      socket.off('set-permission');
      socket.off('access-denied');
      socket.off('room-created');
    };
  }, [roomId, socket]);

  const canDraw = isCreator || ['edit', 'owner'].includes(permission);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyAccessLink = (type) => {
    const accessLink = `${window.location.origin}/room/${roomId}?username=${encodeURIComponent(username)}&creator=${type === 'edit'}`;
    navigator.clipboard.writeText(accessLink);
    setLink(accessLink);
    toast.success(`Link copied with ${type} access`);
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setShowShareBox(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition"
        >
          Share
        </button>
      </div>
      {showShareBox && (
        <div className="absolute top-16 right-4 bg-white shadow-lg border border-gray-200 rounded-lg p-4 z-50 w-80">
          <div className="text-sm font-semibold mb-2">Share this room</div>
          <input
            type="text"
            value={link}
            readOnly
            className="w-full px-3 py-2 border rounded-md text-sm mb-2 bg-gray-100"
          />

          <div className="flex justify-between items-center mb-2">
            <button
              onClick={handleCopyLink}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
            >
              Copy Link
            </button>
            <button
              onClick={() => setShowShareBox(false)}
              className="text-gray-500 text-sm hover:underline"
            >
              Close
            </button>
          </div>

          <div className="text-gray-700 text-xs">
            Share as:
            <div className="mt-1 flex space-x-2">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition"
                onClick={() => handleCopyAccessLink('view')}
              >
                View
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition"
                onClick={() => handleCopyAccessLink('edit')}
              >
                Edit
              </button>
            </div>
          </div>

          {copied && (
            <div className="text-green-600 text-xs mt-1">Link copied!</div>
          )}
        </div>
      )}
      <div className="absolute top-4 left-4 bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded shadow z-50 flex items-center space-x-4">
            <div>Room ID: {roomId}</div>
            <div>Created by: {username}</div>
            </div>
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        undo={() => window.canvasUndo?.()}
        redo={() => window.canvasRedo?.()}
        clearCanvas={() => window.clearCanvas?.()}
        saveAsImage={() => window.saveAsCanvas?.()}
        saveAsPDF={() => window.saveAsPDF?.()}
        canDraw={canDraw}
      />
      <div className="h-full w-full">
        <Canvas
          tool={tool}
          color={color}
          socket={socket}
          canDraw={canDraw}
          username={username}
          roomId={roomId}
          creator={isCreator}
        />
      </div>
    </div>
  );
}
