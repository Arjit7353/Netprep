// client/src/components/test/DigitalScratchpad.jsx
// ═══════════════════════════════════════════════════════════════════
// DIGITAL SCRATCHPAD — Canvas-based drawing tool for NTA Exam Interface
// Supports pen, eraser, color picker, undo/redo, touch events
// ═══════════════════════════════════════════════════════════════════

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Pen, Eraser, Undo2, Redo2, Trash2, Minus, Maximize2, Minimize2 } from 'lucide-react';

const COLORS = ['#000000', '#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#d97706'];
const SIZES = [2, 4, 6, 8];

const DigitalScratchpad = ({ onClose, testId, language = 'hi' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');       // 'pen' | 'eraser'
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastPoint = useRef(null);

  const L = (en, hi) => language === 'hi' ? hi : en;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIdx + 1);
      newHistory.push(dataUrl);
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIdx(prev => Math.min(prev + 1, 29));
  }, [historyIdx]);

  const undo = () => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    restoreState(history[newIdx]);
  };

  const redo = () => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    restoreState(history[newIdx]);
  };

  const restoreState = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas || !dataUrl) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    lastPoint.current = pos;
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = pos;
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      lastPoint.current = null;
      saveState();
    }
  };

  // Dragging the panel
  const onDragStart = (e) => {
    if (e.target.closest('canvas') || e.target.closest('button')) return;
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition({ x: clientX - dragOffset.x, y: clientY - dragOffset.y });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging, dragOffset]);

  if (isMinimized) {
    return (
      <div
        className="fixed z-[60] bg-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform"
        style={{ left: position.x, top: position.y }}
        onClick={() => setIsMinimized(false)}
        title={L('Open Scratchpad', 'स्क्रैचपैड खोलें')}
      >
        <Pen className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div
      className="fixed z-[60] select-none"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-amber-300 dark:border-amber-700 overflow-hidden" style={{ width: 420 }}>
        {/* Header — Draggable */}
        <div
          className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 cursor-move"
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          <div className="flex items-center gap-2">
            <Pen className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-800 dark:text-amber-200">
              {L('Digital Scratchpad', 'डिजिटल स्क्रैचपैड')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(true)} className="p-1 rounded hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-600" title="Minimize">
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex-wrap">
          {/* Tool Buttons */}
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${tool === 'pen' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
          >
            <Pen className="w-3.5 h-3.5" /> {L('Pen', 'पेन')}
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${tool === 'eraser' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'}`}
          >
            <Eraser className="w-3.5 h-3.5" /> {L('Eraser', 'इरेज़र')}
          </button>

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Colors */}
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c && tool === 'pen' ? 'border-gray-900 dark:border-white scale-125' : 'border-gray-300 dark:border-gray-500'}`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Size */}
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => setLineWidth(s)}
              className={`flex items-center justify-center w-6 h-6 rounded ${lineWidth === s ? 'bg-gray-300 dark:bg-gray-500' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title={`${s}px`}
            >
              <div className="rounded-full bg-gray-800 dark:bg-white" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}

          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Undo/Redo/Clear */}
          <button onClick={undo} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 disabled:opacity-30" disabled={historyIdx <= 0} title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 disabled:opacity-30" disabled={historyIdx >= history.length - 1} title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearCanvas} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500" title={L('Clear All', 'सब साफ करें')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-2 bg-white dark:bg-gray-900">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg cursor-crosshair touch-none"
            style={{ height: 280 }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default DigitalScratchpad;
