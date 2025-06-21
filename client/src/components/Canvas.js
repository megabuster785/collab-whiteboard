import React, { useRef, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import jsPDF from 'jspdf';
import { useParams } from 'react-router-dom';

const socket = io('http://localhost:5000');

export default function Canvas({ tool, color, canDraw, username, creator }) {
  const canvasRef = useRef();
  const ctxRef = useRef();
  const undoStackRef = useRef([]);
  const [actions, setActions] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [textBox, setTextBox] = useState(null);
  const [joinedUsername, setJoinedUsername] = useState(null);
  const { roomId } = useParams();

  const clearCanvas = useCallback(() => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setActions([]);
    undoStackRef.current = [];
    socket.emit('clear-canvas', roomId);
  }, [roomId]);
  useEffect(() => {
  window.clearCanvas = clearCanvas;

  return () => {
    delete window.clearCanvas;
  };
}, [clearCanvas]);


  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    if (tool === 'pen') canvas.style.cursor = 'crosshair';
    else if (tool === 'eraser') canvas.style.cursor = 'cell';
    else if (tool === 'text') canvas.style.cursor = 'text';
    else canvas.style.cursor = 'default';
  }, [tool]);

  useEffect(() => {
    if (creator === undefined) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;

    socket.emit("join-room", { roomId, username });

    socket.on("access-denied", () => alert("Access denied to this room"));

    socket.on("user-joined", ({ username }) => {
      setJoinedUsername(username);
      setTimeout(() => setJoinedUsername(null), 3000);
    });

    socket.on("draw-action", ({ action }) => {
      draw(action, ctxRef.current);
      setActions(prev => [...prev, action]);
    });

    socket.on("clear-canvas", () => {
        if (!ctxRef.current || !canvasRef.current) return;
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setActions([]);
        undoStackRef.current = []; // ✅ Important for others
});

    socket.on("canvas-history", (history) => {
      history.forEach(action => draw(action, ctx));
      setActions(history);
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("user-joined");
      socket.off("draw-action");
      socket.off("clear-canvas");
      socket.off("canvas-history");
    };
  }, [clearCanvas, roomId, username, creator]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && ctxRef.current) {
        const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctxRef.current.putImageData(imageData, 0, 0);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const draw = (a, ctx) => {
    if (!a || !a.points?.length) return;

    ctx.lineWidth = a.tool === 'eraser' ? 20 : 2;
    ctx.strokeStyle = a.tool === 'eraser' ? 'white' : a.color || 'black';
    ctx.fillStyle = a.color || 'black';

    switch (a.tool) {
      case 'pen':
      case 'eraser':
        if (a.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        a.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        break;

      case 'rect': {
        if (a.points.length < 2) return;
        const [start, end] = [a.points[0], a.points[a.points.length - 1]];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        break;
      }

      case 'circle': {
        if (a.points.length < 2) return;
        const [start, end] = [a.points[0], a.points[a.points.length - 1]];
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      }

      case 'text': {
        if (!a.text || a.points.length < 1) return;
        const p = a.points[0];
        ctx.font = '18px sans-serif';
        ctx.textBaseline = 'top';
        a.text.split('\n').forEach((line, i) => ctx.fillText(line, p.x, p.y + i * 20));
        break;
      }

      default:
        console.warn('Unknown tool:', a.tool);
    }
  };

  const redrawAll = useCallback((act) => {
  const canvas = canvasRef.current;
  if (!canvas || !ctxRef.current) return;
  ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  act.forEach(a => draw(a, ctxRef.current));
}, []);



  const getCursorPosition = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = e => {
    if (!canDraw || tool === 'text') return;
    const start = getCursorPosition(e);
    setIsDrawing(true);
    setCurrentAction({ tool, color, points: [start], text: '', username });
  };

  const drawAction = e => {
    if (!canDraw || !isDrawing || !currentAction) return;
    const newPoint = getCursorPosition(e);
    const updatedAction = {
      ...currentAction,
      points: [...currentAction.points, newPoint]
    };
    redrawAll([...actions, updatedAction]);
    setCurrentAction(updatedAction);
  };

  const endDrawing = e => {
    if (!canDraw || !isDrawing || !currentAction) return;
    const finalPoint = getCursorPosition(e);
    const finishedAction = {
      ...currentAction,
      points: [...currentAction.points, finalPoint]
    };
    setActions(prev => {
      const updated = [...prev, finishedAction];
      redrawAll(updated);
      return updated;
    });
    socket.emit('draw-action', { roomId, action: finishedAction });
    setIsDrawing(false);
    setCurrentAction(null);
  };

  useEffect(() => {
  window.canvasUndo = () => {
    console.log("Undo triggered");
    setActions(prev => {
      if (prev.length === 0) return prev;
      const newActions = [...prev];
      const undone = newActions.pop();
      undoStackRef.current.unshift(undone);
      redrawAll(newActions); // explicitly pass newActions
      return newActions;
    });
  };

  window.canvasRedo = () => {
    if (undoStackRef.current.length === 0) return;
    setActions(prev => {
      const redone = undoStackRef.current.shift();
      const newActions = [...prev, redone];
      redrawAll(newActions); // explicitly pass newActions
      return newActions;
    });
  };

  window.saveAsCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }
    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  window.saveAsPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not ready");
      return;
    }

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height]);
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, "FAST");
    pdf.save(`canvas-${roomId}.pdf`);
  };
}, [roomId, redrawAll]);

  const handleCanvasClick = e => {
    if (!canDraw || tool !== 'text') return;
    const { x, y } = getCursorPosition(e);
    setTextBox({ x, y, value: '' });
  };


  return (
    <div className="relative w-full h-screen">

  {/* View-only notice */}
  {creator === false && (
    <div className="fixed top-2 left-1/2 transform -translate-x-1/2 text-red-600 font-semibold text-sm z-50">
      View-only access — editing disabled
    </div>
  )}

  {/* Drawing Canvas */}
  <canvas
    ref={canvasRef}
    onMouseDown={startDrawing}
    onMouseMove={drawAction}
    onMouseUp={endDrawing}
    onClick={handleCanvasClick}
    className="bg-white w-full h-screen absolute top-0 left-0 z-0"
  />

  {/* Joined user message */}
  {joinedUsername && (
    <div className="absolute top-20 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md z-50 text-sm animate-fade-in">
      <span className="font-semibold">{joinedUsername}</span> joined the room
    </div>
  )}


  {/* Text Box Input */}
  {canDraw && textBox && (
    <textarea
      autoFocus
      value={textBox.value}
      onChange={e => setTextBox({ ...textBox, value: e.target.value })}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const text = textBox.value.trim();
          if (!text) return setTextBox(null);
          const newAction = {
            tool: 'text',
            color,
            points: [{ x: textBox.x, y: textBox.y }],
            text,
            username
          };
          const updated = [...actions, newAction];
          setActions(updated);
          redrawAll(updated);
          socket.emit('draw-action', { roomId, action: newAction });
          undoStackRef.current = [];
          setTextBox(null);
        }
      }}
      onBlur={() => {
        const text = textBox.value.trim();
        if (text) {
          const newAction = {
            tool: 'text',
            color,
            points: [{ x: textBox.x, y: textBox.y }],
            text,
            username
          };
          const updated = [...actions, newAction];
          setActions(updated);
          redrawAll(updated);
          socket.emit('draw-action', { roomId, action: newAction });
          undoStackRef.current = [];
        }
        setTextBox(null);
      }}
      style={{
        position: 'absolute',
        top: `${textBox.y}px`,
        left: `${textBox.x}px`,
        background: 'transparent',
        color: color || 'black',
        border: '1px solid #ccc',
        font: '18px sans-serif',
        padding: '2px',
        lineHeight: '20px',
        outline: 'none',
        resize: 'both',
        overflow: 'auto',
        minHeight: '24px',
        minWidth: '60px',
        zIndex: 10
      }}
    />
  )}
</div>

  );
}
