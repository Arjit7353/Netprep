import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getBilingualText, getBilingualArray, getOptionLabel,
  getRomanNumeral, getChartLabels, getDatasetLabel
} from '../../utils/helpers';
import { QUESTION_TYPE_LABELS, CHART_COLORS, AR_OPTIONS_HI, AR_OPTIONS_EN } from '../../utils/constants';

const HINDI_RE = /[\u0900-\u097F]/;

const resolveAROptions = (question, language) => {
  const defaultOptions = language === 'hi' ? AR_OPTIONS_HI : AR_OPTIONS_EN;
  const rawOptions = getBilingualArray(question.options, language);
  if (!rawOptions || rawOptions.length === 0) return defaultOptions;
  const resolved = rawOptions.map((opt, i) => {
    if (!opt || !opt.trim()) return defaultOptions[i] || '';
    const optText = opt.trim();
    const hasHindi = HINDI_RE.test(optText);
    if (language === 'hi') {
      if (hasHindi) return optText;
      const englishChars = (optText.match(/[A-Za-z]/g) || []).length;
      if (englishChars > 5 && i < defaultOptions.length) return defaultOptions[i];
      return optText;
    } else {
      if (!hasHindi) return optText;
      const hindiChars = (optText.match(/[\u0900-\u097F]/g) || []).length;
      const englishChars = (optText.match(/[A-Za-z]/g) || []).length;
      if (hindiChars > englishChars && i < defaultOptions.length) return defaultOptions[i];
      return optText;
    }
  });
  return resolved;
};

const OptionButton = ({ index, text, isSelected, disabled, onClick }) => {
  const label = `${index + 1}`;

  return (
    <div 
      className={`flex items-start gap-3 p-3 border rounded-lg mb-3 cursor-pointer transition-all ${isSelected ? 'bg-[#f0f8ff] border-[#8cb4d6]' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
      onClick={() => !disabled && onClick?.(index)}
    >
      <div className="flex items-center gap-3 mt-0.5">
        <input 
          type="radio" 
          checked={isSelected} 
          readOnly 
          className="w-4 h-4 cursor-pointer accent-[#195a94]"
        />
        <div className="w-6 h-6 rounded-full bg-[#e3f2fd] text-[#195a94] flex items-center justify-center text-xs font-bold shrink-0 border border-[#bce0fd]">
           {label}
        </div>
      </div>
      <div className="text-[14px] text-black pt-0.5">
        {text}
      </div>
    </div>
  );
};

const NTAQuestionDisplay = ({
  question,
  language = 'hi',
  selectedAnswer = -1,
  onAnswerSelect,
  disabled = false,
  showQuestionNumber = false,
  questionNumber = 1
}) => {
  const questionType = question.questionType;
  const questionText = getBilingualText(question.question, language);

  const renderOptions = (options) => (
    <div className="mt-4">
      {options.map((option, index) => (
        <OptionButton
          key={index}
          index={index}
          text={option}
          isSelected={selectedAnswer === index}
          disabled={disabled}
          onClick={onAnswerSelect}
        />
      ))}
    </div>
  );

  const TitleText = ({ children }) => (
    <div className="text-black text-[15px] leading-[1.6] font-medium mb-4">
      {children}
    </div>
  );

  const renderMCQ = () => {
    const options = getBilingualArray(question.options, language);
    return (
      <div>
        <TitleText>{questionText}</TitleText>
        {renderOptions(options)}
      </div>
    );
  };

  const renderAssertionReason = () => {
    const assertion = getBilingualText(question.assertionReasonData?.assertion, language);
    const reason = getBilingualText(question.assertionReasonData?.reason, language);
    const options = resolveAROptions(question, language);

    return (
      <div>
        <div className="text-black text-[14px] font-medium mb-3">
          {language === 'hi'
            ? 'निर्देश: नीचे दो कथन दिए गए हैं, जिनमें से एक को कथन (A) और दूसरे को कारण (R) कहा गया है।'
            : 'Directions: Given below are two statements, one labelled Assertion (A) and the other labelled Reason (R).'}
        </div>
        <div className="mb-4 text-[14px] leading-relaxed">
          <div className="mb-2"><b>{language === 'hi' ? 'अभिकथन (A): ' : 'Assertion (A): '}</b>{assertion}</div>
          <div><b>{language === 'hi' ? 'कारण (R): ' : 'Reason (R): '}</b>{reason}</div>
        </div>
        <div className="text-[14px] font-medium text-black mb-2 mt-4">
          {language === 'hi' ? 'उपर्युक्त कथनों के आलोक में, नीचे दिए गए विकल्पों में से सबसे उपयुक्त उत्तर का चयन कीजिए:' : 'In the light of the above statements, choose the most appropriate answer from the options given below:'}
        </div>
        {renderOptions(options)}
      </div>
    );
  };

  const renderMatchFollowing = () => {
    const listA = getBilingualArray(question.matchData?.listA, language);
    const listB = getBilingualArray(question.matchData?.listB, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div>
        <TitleText>
          {questionText || (language === 'hi' ? 'सूची-I को सूची-II से सुमेलित कीजिए:' : 'Match List-I with List-II:')}
        </TitleText>

        <div className="border border-slate-400 mb-6 rounded overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-[#2c3e50] text-white">
                <th className="px-4 py-2.5 text-left font-bold border-r border-slate-500 w-1/2">{language === 'hi' ? 'सूची-I' : 'List-I'}</th>
                <th className="px-4 py-2.5 text-left font-bold w-1/2">{language === 'hi' ? 'सूची-II' : 'List-II'}</th>
              </tr>
            </thead>
            <tbody>
              {listA.map((itemA, idx) => (
                <tr key={idx} className="border-t border-slate-300 bg-white">
                  <td className="px-4 py-3 border-r border-slate-300">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-[#e3f2fd] text-[#195a94] flex items-center justify-center text-xs font-bold shrink-0">{getOptionLabel(idx)}</span>
                      <span className="pt-0.5">{itemA}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-auto min-w-[24px] px-1 h-6 rounded-full bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center text-xs font-bold shrink-0">({getRomanNumeral(idx).toLowerCase()})</span>
                      <span className="pt-0.5">{listB[idx] || ''}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[14px] text-gray-700 font-medium mb-1">
          {language === 'hi' ? 'नीचे दिए गए विकल्पों में से सही उत्तर का चयन कीजिए:' : 'Choose the correct answer from the options given below:'}
        </p>
        {renderOptions(options)}
      </div>
    );
  };

  const renderSequenceOrder = () => {
    const items = getBilingualArray(question.sequenceData?.items, language);
    const options = getBilingualArray(question.options, language);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    return (
      <div>
        <TitleText>
          {questionText || (language === 'hi' ? 'निम्नलिखित को सही क्रम में व्यवस्थित कीजिए:' : 'Arrange the following in correct order:')}
        </TitleText>

        <div className="pl-2 space-y-2 mb-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 text-[14px]">
              <span className="font-bold shrink-0">({letters[idx]})</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-[14px] text-gray-700 font-medium mb-1">
          {language === 'hi' ? 'नीचे दिए गए विकल्पों में से सही उत्तर का चयन कीजिए:' : 'Choose the correct answer from the options given below:'}
        </p>
        {renderOptions(options)}
      </div>
    );
  };

  const renderStatementBased = () => {
    const statements = getBilingualArray(question.statementData?.statements, language);
    const options = getBilingualArray(question.options, language);

    return (
      <div>
        <TitleText>
          {questionText || (language === 'hi' ? 'नीचे दो कथन दिए गए हैं:' : 'Given below are two statements:')}
        </TitleText>

        <div className="pl-2 space-y-3 mb-6">
          {statements.map((st, idx) => (
            <div key={idx} className="text-[14px]">
              <b>{language === 'hi' ? `कथन ${idx + 1}: ` : `Statement ${getRomanNumeral(idx)}: `}</b>
              {st}
            </div>
          ))}
        </div>

        <p className="text-[14px] text-gray-700 font-medium mb-1">
          {language === 'hi' ? 'उपर्युक्त कथनों के आलोक में, नीचे दिए गए विकल्पों में से सबसे उपयुक्त उत्तर का चयन कीजिए:' : 'In the light of the above statements, choose the most appropriate answer from the options given below:'}
        </p>
        {renderOptions(options)}
      </div>
    );
  };

  const renderPassageBased = () => {
    const passageObj = question.passageId;
    const passageContent = getBilingualText(passageObj?.content, language);
    const options = getBilingualArray(question.options, language);
    const hasPassageContent = !!passageContent;

    return (
      <div>
        {hasPassageContent && (
          <div className="mb-6 p-4 border border-gray-300 bg-gray-50 rounded text-[14px] leading-relaxed max-h-[300px] overflow-y-auto">
            {passageContent.split('\n').map((p, i) => (
              <p key={i} className="mb-2 last:mb-0">{p}</p>
            ))}
          </div>
        )}

        <TitleText>{questionText}</TitleText>
        {options.length > 0 && renderOptions(options)}
      </div>
    );
  };

  const renderDITable = () => {
    const di = question.diDataId;
    const instruction = getBilingualText(di?.instruction, language);
    const headers = getBilingualArray(di?.tableData?.headers, language);
    const rows = di?.tableData?.rows || [];
    const options = getBilingualArray(question.options, language);

    return (
      <div>
        {instruction && (
          <div className="mb-4 text-[14px] leading-relaxed font-medium">
            {instruction}
          </div>
        )}
        
        {di && (
          <div className="mb-6 border border-slate-400 overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              {headers.length > 0 && (
                <thead>
                  <tr className="bg-[#f5f5f5]">
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-2 border border-slate-300 text-center font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="bg-white">
                    {Array.isArray(row) && row.map((cell, ci) => (
                      <td key={ci} className={`px-4 py-2 border border-slate-300 ${ci === 0 ? 'text-left font-semibold' : 'text-center'}`}>
                        {cell !== null && cell !== undefined ? (typeof cell === 'number' ? cell.toLocaleString() : cell) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <TitleText>{questionText}</TitleText>
        {renderOptions(options)}
      </div>
    );
  };

  // We fallback charts to standard rendering logic since NTA usually only has tables or simple charts.
  // We'll reuse the rechart imports if needed, but for simplicity, NTA uses tables mostly.
  const renderContent = () => {
    switch (questionType) {
      case 'assertion_reason': return renderAssertionReason();
      case 'match_following': return renderMatchFollowing();
      case 'sequence_order': return renderSequenceOrder();
      case 'statement_based': return renderStatementBased();
      case 'passage_based': return renderPassageBased();
      case 'di_table': return renderDITable();
      // Charts might need similar simple containers, falling back to MCQ if unsupported
      default: return renderMCQ();
    }
  };

  return (
    <div className="font-sans text-black">
      {showQuestionNumber && (
        <div className="font-bold text-[15px] mb-2">
          Question {questionNumber}:
        </div>
      )}
      {question.isPYQ && question.year && (
        <div className="mb-3 text-[12px] text-gray-500 font-bold">
          [ PYQ {question.year} ]
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default NTAQuestionDisplay;
