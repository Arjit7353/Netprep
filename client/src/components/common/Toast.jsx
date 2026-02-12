import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 4000,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, options) => {
    return addToast(message, { ...options, type: 'success' });
  }, [addToast]);

  const error = useCallback((message, options) => {
    return addToast(message, { ...options, type: 'error' });
  }, [addToast]);

  const warning = useCallback((message, options) => {
    return addToast(message, { ...options, type: 'warning' });
  }, [addToast]);

  const info = useCallback((message, options) => {
    return addToast(message, { ...options, type: 'info' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
};

// Single Toast Component
const Toast = ({ toast, onClose }) => {
  const { type, message, title } = toast;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
  };

  const bgColors = {
    success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
  };

  const textColors = {
    success: 'text-green-900 dark:text-green-100',
    error: 'text-red-900 dark:text-red-100',
    warning: 'text-yellow-900 dark:text-yellow-100',
    info: 'text-blue-900 dark:text-blue-100'
  };

  return (
    <div 
      className={`
        flex items-start gap-3 
        px-4 py-3 rounded-lg border shadow-lg
        animate-slideLeft
        ${bgColors[type]}
      `}
    >
      {icons[type]}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-medium text-sm ${textColors[type]}`}>{title}</p>
        )}
        <p className={`text-sm ${textColors[type]}`}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors`}
      >
        <X className="w-4 h-4 text-gray-400 dark:text-secondary-500" />
      </button>
    </div>
  );
};

// Custom Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;