import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatSidebar({ socket, username, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) {
    console.log('No socket connected');
    return;
  }
    console.log('Listening for messages...');
    const handleMessage = (message) => {
        console.log('Received message:', message);
      setMessages((prev) => [...prev, message]);
      if (!isOpen) setHasNewMessage(true);
    };

    socket.on('receive-message', handleMessage);
    return () => socket.off('receive-message', handleMessage);
  }, [socket, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasNewMessage(false);
    }
  }, [messages, isOpen]);

 const sendMessage = () => {
  if (!input.trim() || !socket?.connected) {
    console.warn('Message not sent: missing input or socket not connected');
    return;
  }

  const msg = {
    roomId,
    username,
    message: input.trim(),
    timestamp: new Date().toISOString()
  };

  socket.emit('send-message', { roomId, msg });
  setInput('');
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 pointer-events-auto">
    
      <div
        className="relative bg-gray-800 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-gray-700 shadow-md transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        Chat
        {hasNewMessage && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        )}
      </div>

    
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-96 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col"
          >
            <div className="bg-gray-100 px-4 py-2 border-b font-semibold text-sm flex justify-between items-center">
              <span>Room Chat</span>
              <button
                className="text-xs text-gray-600 hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="h-64 overflow-y-auto px-4 py-2 space-y-2 text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="text-gray-700">
                  <span className="font-semibold">{msg.username}:</span> {msg.message   }
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex border-t p-2 bg-white">
              <input
                className="flex-1 text-sm px-3 py-1 border rounded-l-md focus:outline-none focus:ring"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-r-md"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
