import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Layout, Building2, ChevronRight, Sparkles, MonitorPlay } from 'lucide-react';

const TestInterfaceSelectorModal = ({ isOpen, onClose, testId, language = 'en' }) => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  const modalContent = (
    <>
      {/* Premium Backdrop with blur */}
      <div 
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        
        {/* Modal Window */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-3xl w-full border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 pointer-events-auto flex flex-col"
        >
          {/* Decorative Top Gradient */}
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          
          {/* Header */}
          <div className="flex items-start justify-between px-8 pt-8 pb-6 relative overflow-hidden">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                <MonitorPlay className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Choose Exam Interface
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Select the best experience for your test attempt
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="relative z-10 p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 pb-8 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Option 1: Modern Interface */}
              <div
                onClick={() => handleSelect(`/test/${testId}`)}
                className="group relative flex flex-col p-6 rounded-3xl border-2 border-transparent bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* Hover Glow & Border */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:via-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-500" />
                <div className="absolute inset-0 border-2 border-indigo-500/0 group-hover:border-indigo-500/50 rounded-3xl transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                      <Layout className="w-8 h-8 text-white" />
                    </div>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-widest shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Recommended
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Modern Interface
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                    Our premium design featuring advanced tools, smooth animations, and an enhanced user experience.
                  </p>
                  
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    Launch Modern UI
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>

              {/* Option 2: NTA Interface */}
              <div
                onClick={() => handleSelect(`/nta-test/${testId}`)}
                className="group relative flex flex-col p-6 rounded-3xl border-2 border-transparent bg-slate-50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-all duration-500 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/10"
              >
                {/* Hover Glow & Border */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-teal-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:via-teal-500/5 group-hover:to-cyan-500/5 transition-colors duration-500" />
                <div className="absolute inset-0 border-2 border-emerald-500/0 group-hover:border-emerald-500/50 rounded-3xl transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Real Exam (NTA)
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                    An exact replica of the official NTA CBT environment. Best for getting the feel of the real exam.
                  </p>
                  
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    Launch NTA UI
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default TestInterfaceSelectorModal;
