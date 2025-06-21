import React, { useState, useRef, useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  clearCanvas,
  undo,
  redo,
  saveAsImage,
  saveAsPDF,
  canDraw = true,
}) {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toolList = ['pen', 'eraser', 'rect', 'circle', 'text'];
  const disabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';
  const baseButton = 'px-2 py-1 rounded text-sm';
  const interactiveButton = 'bg-gray-100 hover:bg-gray-200';

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg p-3 rounded flex flex-wrap gap-2 z-10">
      {toolList.map((t) => (
        <button
          key={t}
          onClick={() => setTool(t)}
          disabled={!canDraw}
          className={`
            ${baseButton} 
            ${tool === t ? 'bg-blue-500 text-white' : interactiveButton}
            ${disabledStyle}
          `}
          title={t.charAt(0).toUpperCase() + t.slice(1)}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}

      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        disabled={!canDraw}
        className={`h-8 w-8 border rounded cursor-pointer ${disabledStyle}`}
        title="Pick a Color"
      />
      <button
        onClick={undo}
        disabled={!canDraw}
        className={`p-2 rounded hover:bg-gray-200 ${disabledStyle}`}
        title="Undo"
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <button
        onClick={redo}
        disabled={!canDraw}
        className={`p-2 rounded hover:bg-gray-200 ${disabledStyle}`}
        title="Redo"
      >
        <Redo2 className="w-5 h-5" />
      </button>
      <button
        onClick={clearCanvas}
        disabled={!canDraw}
        className={`px-2 py-1 rounded ${interactiveButton} ${disabledStyle}`}
        title="Clear Canvas"
      >
        Clear
      </button>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowExportOptions(!showExportOptions)}
          className={`px-2 py-1 rounded ${interactiveButton}`}
        >
          Export
        </button>
        {showExportOptions && (
          <div className="absolute bottom-10 left-0 bg-white border rounded shadow-lg w-36 z-50">
            <div
              onClick={() => {
                saveAsImage();
                setShowExportOptions(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Export as JPG
            </div>
            <div
              onClick={() => {
                saveAsPDF();
                setShowExportOptions(false);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Export as PDF
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
