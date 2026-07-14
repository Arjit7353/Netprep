import React, { useState, useEffect } from 'react';
import { useTestContext } from '../../context/TestContext';
import { useNavigate } from 'react-router-dom';
import NTAQuestionDisplay from './NTAQuestionDisplay';

const NTAExamInterface = () => {
  const navigate = useNavigate();
  const {
    test, attempt, questions, answers,
    currentIndex, currentQuestion, currentAnswer,
    remainingTime, language,
    goToQuestion, selectAnswer, toggleMarkForReview, clearResponse,
    saveAndNext, previousQuestion, submitTest, updateRemainingTime,
    getAnswerStatuses, getStatusSummary, setLanguage
  } = useTestContext();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Derived state
  const totalQuestions = questions.length;
  const statuses = getAnswerStatuses();
  const summary = getStatusSummary();
  
  // Timer logic
  useEffect(() => {
    if (remainingTime <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      updateRemainingTime(remainingTime - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingTime, updateRemainingTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (window.confirm("Are you sure you want to submit the exam?")) {
      const result = await submitTest();
      if (result?.success) {
        navigate(`/results/${result.attemptId || attempt._id}`, { replace: true });
      }
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') saveAndNext();
      if (e.key === 'ArrowLeft') previousQuestion();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAndNext, previousQuestion]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'not_visited': return 'bg-[#e2e2e2] text-black border-gray-400';
      case 'not_answered': return 'bg-[#d9534f] text-white border-[#d43f3a] clip-not-answered';
      case 'answered': return 'bg-[#5cb85c] text-white border-[#4cae4c] clip-answered';
      case 'marked': return 'bg-[#5bc0de] text-white border-[#46b8da] rounded-full'; // Wait, marked is purple in NTA
      case 'answered_marked': return 'bg-[#5bc0de] text-white border-[#46b8da] rounded-full relative';
      default: return 'bg-[#e2e2e2] text-black border-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-black font-sans text-sm overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      
      {/* 1. Header with Logos */}
      <div className="flex items-center justify-between px-4 py-1 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-10 flex items-center justify-center">
             <img src="https://nta.ac.in/img/150years.png" alt="150 Years" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
          <div className="w-40 h-10 flex items-center justify-center">
            <img src="https://nta.ac.in/img/NTA_Logo.png" alt="NTA" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
          <div className="hidden md:flex w-32 h-10 items-center justify-center border-l pl-4 border-gray-300">
             <img src="https://nta.ac.in/img/MoE_Logo.png" alt="MoE" className="h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
          </div>
        </div>
        <div className="flex items-center">
           <img src="https://nta.ac.in/img/amrit-mahotsav-logo.png" alt="Azadi" className="h-10 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
        </div>
      </div>

      {/* 2. Blue Action Bar */}
      <div className="bg-[#195a94] text-white px-4 flex justify-between items-center text-xs h-7 shrink-0">
         <div></div>
         <div className="flex items-center gap-4 h-full">
            <div className="bg-[#5978b5] h-full px-2 flex items-center gap-2 border-l border-r border-[#3e5f9e] cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[#5978b5] font-bold text-[10px]">A</div>
              <select 
                className="bg-transparent text-white border-none outline-none cursor-pointer appearance-none pr-4 text-xs"
                value={language === 'en' ? 'English' : 'Hindi'}
                onChange={(e) => setLanguage(e.target.value === 'English' ? 'en' : 'hi')}
              >
                <option value="English" className="text-black">English</option>
                <option value="Hindi" className="text-black">Hindi</option>
              </select>
            </div>
         </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANE */}
        <div className={`flex flex-col border-r border-gray-300 transition-all duration-300 ${panelOpen ? 'w-[75%]' : 'w-full'}`}>
          
          {/* Top Info Header */}
          <div className="flex items-center justify-between p-2 border-b border-gray-300 bg-white shrink-0">
            <div className="flex items-center gap-3">
              {/* Profile Pic Placeholder */}
              <div className="w-16 h-16 bg-gray-200 border border-gray-400 p-1">
                 <svg className="w-full h-full text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                 </svg>
              </div>
              <div className="text-xs space-y-0.5 font-bold text-gray-700">
                <div className="flex"><span className="w-28 text-gray-500 font-normal">Candidate Name</span><span>: ARJIT</span></div>
                <div className="flex"><span className="w-28 text-gray-500 font-normal">Exam Name</span><span>: {test?.paper === 'paper2' ? 'UGC NET HISTORY' : test?.paper === 'paper1' ? 'UGC NET PAPER 1' : 'UGC NET PAPER 1 AND 2'}</span></div>
                <div className="flex"><span className="w-28 text-gray-500 font-normal">Subject Name</span><span>: {test?.paper === 'paper2' ? 'UGC NET HISTORY' : test?.paper === 'paper1' ? 'UGC NET PAPER 1' : 'UGC NET PAPER 1 AND 2'}</span></div>
                <div className="flex items-center"><span className="w-28 text-gray-500 font-normal">Remaining Time</span><span>: <span className="bg-blue-600 text-white px-2 py-0.5 rounded-sm">{formatTime(remainingTime)}</span></span></div>
              </div>
            </div>
            
            {/* Collapse/Expand Palette Button */}
            {!panelOpen && (
              <button onClick={() => setPanelOpen(true)} className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold absolute right-4 z-10 shadow-md">
                {"<"}
              </button>
            )}
          </div>

          {/* Question Area Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Question Header & Toggle Panel Button */}
            <div className="flex justify-between items-center bg-[#f5f5f5] px-3 py-1.5 border-b border-gray-300 shrink-0">
              <span className="font-bold text-sm">Question {currentIndex + 1}:</span>
              {panelOpen && (
                <button onClick={() => setPanelOpen(false)} className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md absolute right-[-10px] z-10">
                  {">"}
                </button>
              )}
            </div>

            {/* Scrollable Question Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-white text-[15px]">
              {currentQuestion ? (
                <NTAQuestionDisplay
                  question={currentQuestion}
                  language={language}
                  selectedAnswer={currentAnswer?.selectedAnswer ?? -1}
                  onAnswerSelect={selectAnswer}
                  showQuestionNumber={false}
                />
              ) : (
                 <div className="text-center p-10">Loading...</div>
              )}
            </div>
            
            {/* Action Buttons Footer */}
            <div className="bg-white border-t border-gray-300 p-2 shrink-0">
               <div className="flex flex-wrap justify-between items-center gap-2">
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { saveAndNext(); }}
                      className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-3 py-1.5 text-xs font-bold border border-[#4cae4c] rounded-sm"
                    >
                      SAVE & NEXT
                    </button>
                    <button 
                      onClick={clearResponse}
                      className="bg-white hover:bg-gray-100 text-black px-3 py-1.5 text-xs font-bold border border-gray-400 rounded-sm uppercase"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={() => { toggleMarkForReview(); saveAndNext(); }}
                      className="bg-[#f0ad4e] hover:bg-[#ec971f] text-white px-3 py-1.5 text-xs font-bold border border-[#eea236] rounded-sm uppercase"
                    >
                      Save & Mark for Review
                    </button>
                    <button 
                      onClick={() => { toggleMarkForReview(); saveAndNext(); }}
                      className="bg-[#337ab7] hover:bg-[#286090] text-white px-3 py-1.5 text-xs font-bold border border-[#2e6da4] rounded-sm uppercase"
                    >
                      Mark for Review & Next
                    </button>
                 </div>
               </div>
            </div>

            {/* Pagination / Submit Footer */}
            <div className="bg-[#f5f5f5] border-t border-gray-300 p-2 flex justify-between items-center shrink-0">
               <div className="flex gap-2">
                 <button onClick={previousQuestion} disabled={currentIndex === 0} className="bg-white text-black px-3 py-1 text-xs border border-gray-400 rounded-sm disabled:opacity-50 uppercase">
                   {"<< Back"}
                 </button>
                 <button onClick={() => goToQuestion(currentIndex + 1)} disabled={currentIndex === totalQuestions - 1} className="bg-white text-black px-3 py-1 text-xs border border-gray-400 rounded-sm disabled:opacity-50 uppercase">
                   {"Next >>"}
                 </button>
               </div>
               <button onClick={handleSubmit} className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-1 text-xs font-bold border border-[#4cae4c] rounded-sm uppercase">
                 Submit
               </button>
            </div>
            
          </div>
        </div>

        {/* RIGHT PANE (Palette) */}
        {panelOpen && (
          <div className="w-[25%] bg-[#eef3f6] flex flex-col shrink-0 border-l border-gray-300">
            
            {/* Language dropdown (redundant but matches screenshot) */}
            <div className="bg-white p-2 border-b border-gray-300 flex justify-end">
              <select 
                className="border border-gray-400 px-2 py-0.5 text-xs w-3/4"
                value={language === 'hi' ? 'Hindi' : 'English'}
                onChange={(e) => setLanguage(e.target.value === 'Hindi' ? 'hi' : 'en')}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>

            {/* Legend */}
            <div className="bg-white p-2 border-b border-gray-300">
               <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-[10px] font-bold text-gray-700 items-center">
                  <div className="flex items-center gap-1">
                     <div className="w-8 h-8 flex items-center justify-center bg-[#e2e2e2] border border-gray-400 text-black">
                       {summary.notVisited}
                     </div>
                     <span className="leading-tight">Not Visited</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-8 h-8 flex items-center justify-center bg-[#d9534f] text-white" style={{clipPath: 'polygon(100% 0, 100% 100%, 50% 80%, 0 100%, 0 0)'}}>
                       {summary.notAnswered}
                     </div>
                     <span className="leading-tight">Not Answered</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-8 h-8 flex items-center justify-center bg-[#5cb85c] text-white" style={{clipPath: 'polygon(50% 0%, 100% 20%, 100% 100%, 0 100%, 0 20%)'}}>
                       {summary.answered}
                     </div>
                     <span className="leading-tight">Answered</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <div className="w-8 h-8 flex items-center justify-center bg-[#5bc0de] text-white rounded-full">
                       {summary.markedForReview}
                     </div>
                     <span className="leading-tight">Marked for Review</span>
                  </div>
                  <div className="flex items-start gap-1 col-span-2 mt-1">
                     <div className="w-8 h-8 flex items-center justify-center bg-[#5bc0de] text-white rounded-full relative shrink-0">
                       {summary.answeredAndMarked}
                       <div className="absolute -bottom-1 -right-1 bg-[#5cb85c] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                         <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                       </div>
                     </div>
                     <span className="leading-tight pt-1">Answered & Marked for Review (will be considered for evaluation)</span>
                  </div>
               </div>
            </div>

            {/* Section Header (if any) */}
            <div className="bg-[#337ab7] text-white px-2 py-1 text-xs font-bold flex justify-between items-center">
               <span>Physics</span>
            </div>

            {/* Question Palette Grid */}
            <div className="flex-1 overflow-y-auto bg-white p-3 border-t border-gray-300">
              <div className="grid grid-cols-5 gap-2">
                 {questions.map((_, index) => {
                   const status = statuses[index];
                   let styleClass = "w-8 h-8 flex items-center justify-center text-xs font-bold cursor-pointer transition-transform hover:scale-110 ";
                   
                   if (status === 'not_visited') {
                      styleClass += "bg-[#e2e2e2] text-black border border-gray-400";
                   } else if (status === 'not_answered') {
                      styleClass += "bg-[#d9534f] text-white";
                   } else if (status === 'answered') {
                      styleClass += "bg-[#5cb85c] text-white";
                   } else if (status === 'marked' || status === 'answered_marked') {
                      styleClass += "bg-[#5bc0de] text-white rounded-full";
                   }
                   
                   return (
                     <div key={index} className="flex justify-center">
                        <div 
                          onClick={() => goToQuestion(index)}
                          className={styleClass}
                          style={{
                            clipPath: status === 'not_answered' ? 'polygon(100% 0, 100% 100%, 50% 80%, 0 100%, 0 0)' :
                                      status === 'answered' ? 'polygon(50% 0%, 100% 20%, 100% 100%, 0 100%, 0 20%)' : 'none'
                          }}
                        >
                           {String(index + 1).padStart(2, '0')}
                           {status === 'answered_marked' && (
                             <div className="absolute -bottom-1 -right-1 bg-[#5cb85c] rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white">
                               <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                             </div>
                           )}
                        </div>
                     </div>
                   );
                 })}
              </div>
            </div>
            
          </div>
        )}

      </div>
      
      {/* Footer */}
      <div className="bg-[#195a94] text-white text-center py-2 text-xs shrink-0">
        © All Rights Reserved - National Testing Agency
      </div>

    </div>
  );
};

export default NTAExamInterface;
