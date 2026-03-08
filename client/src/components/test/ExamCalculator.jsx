import React, { useState, useCallback } from 'react';
import { X, Delete, RotateCcw, History, Trash2 } from 'lucide-react';

const ExamCalculator = ({ onClose, language = 'hi' }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = useCallback((num) => {
    if (newNumber) {
      setDisplay(num === '.' ? '0.' : num);
      setNewNumber(false);
    } else {
      if (num === '.' && display.includes('.')) return;
      setDisplay(prev => prev === '0' && num !== '.' ? num : prev + num);
    }
  }, [display, newNumber]);

  const handleOperator = useCallback((op) => {
    const symbols = { add: '+', sub: '−', mul: '×', div: '÷' };
    setExpression(prev => prev + display + ' ' + symbols[op] + ' ');
    setNewNumber(true);
  }, [display]);

  const handleEquals = useCallback(() => {
    try {
      const fullExpr = expression + display;
      const evalExpr = fullExpr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      const result = Function('"use strict"; return (' + evalExpr + ')')();
      const rounded = Math.round(result * 1e10) / 1e10;
      setHistory(prev => [{ expr: fullExpr, result: rounded }, ...prev].slice(0, 20));
      setDisplay(String(rounded));
      setExpression('');
      setNewNumber(true);
    } catch {
      setDisplay('Error');
      setExpression('');
      setNewNumber(true);
    }
  }, [display, expression]);

  const handlePercent = useCallback(() => {
    setDisplay(prev => String(parseFloat(prev) / 100));
    setNewNumber(true);
  }, []);

  const handleSqrt = useCallback(() => {
    const val = parseFloat(display);
    if (val < 0) { setDisplay('Error'); return; }
    setDisplay(String(Math.round(Math.sqrt(val) * 1e10) / 1e10));
    setNewNumber(true);
  }, [display]);

  const handleSign = useCallback(() => {
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setNewNumber(true);
  }, []);

  const btnBase = 'flex items-center justify-center rounded-xl font-semibold transition-all duration-150 active:scale-95 select-none';
  const btnNum = `${btnBase} bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-600 text-lg h-12`;
  const btnOp = `${btnBase} bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-lg h-12 font-bold`;
  const btnFunc = `${btnBase} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm h-12`;
  const btnEquals = `${btnBase} bg-blue-600 text-white hover:bg-blue-700 text-xl h-12 font-bold`;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[300px] animate-scale-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {language === 'hi' ? 'कैलकुलेटर' : 'Calculator'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(p => !p)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              title="History"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="max-h-32 overflow-y-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">
                {language === 'hi' ? 'कोई इतिहास नहीं' : 'No history'}
              </p>
            ) : (
              <div className="p-2 space-y-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setDisplay(String(h.result)); setNewNumber(true); }}
                    className="w-full text-right px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="text-[10px] text-slate-400 truncate">{h.expr}</div>
                    <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">
                      = {h.result}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Display */}
        <div className="p-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="text-right">
            <div className="text-xs text-slate-400 h-5 truncate font-mono">
              {expression || '\u00A0'}
            </div>
            <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white truncate mt-1">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 grid grid-cols-4 gap-2">
          <button onClick={handleClear} className={btnFunc}>AC</button>
          <button onClick={handleSign} className={btnFunc}>±</button>
          <button onClick={handlePercent} className={btnFunc}>%</button>
          <button onClick={() => handleOperator('div')} className={btnOp}>÷</button>

          <button onClick={() => handleNumber('7')} className={btnNum}>7</button>
          <button onClick={() => handleNumber('8')} className={btnNum}>8</button>
          <button onClick={() => handleNumber('9')} className={btnNum}>9</button>
          <button onClick={() => handleOperator('mul')} className={btnOp}>×</button>

          <button onClick={() => handleNumber('4')} className={btnNum}>4</button>
          <button onClick={() => handleNumber('5')} className={btnNum}>5</button>
          <button onClick={() => handleNumber('6')} className={btnNum}>6</button>
          <button onClick={() => handleOperator('sub')} className={btnOp}>−</button>

          <button onClick={() => handleNumber('1')} className={btnNum}>1</button>
          <button onClick={() => handleNumber('2')} className={btnNum}>2</button>
          <button onClick={() => handleNumber('3')} className={btnNum}>3</button>
          <button onClick={() => handleOperator('add')} className={btnOp}>+</button>

          <button onClick={handleSqrt} className={btnFunc}>√</button>
          <button onClick={() => handleNumber('0')} className={btnNum}>0</button>
          <button onClick={() => handleNumber('.')} className={btnNum}>.</button>
          <button onClick={handleEquals} className={btnEquals}>=</button>

          <button onClick={handleBackspace} className={`${btnFunc} col-span-2`}>
            <Delete className="w-4 h-4 mr-1" /> Backspace
          </button>
          <button
            onClick={() => { setHistory([]); }}
            className={`${btnFunc} col-span-2`}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {language === 'hi' ? 'इतिहास हटाएं' : 'Clear History'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamCalculator;