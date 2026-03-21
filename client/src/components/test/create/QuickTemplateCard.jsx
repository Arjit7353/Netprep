import React from 'react';
import { Zap } from 'lucide-react';

const QuickTemplateCard = ({ template, onClick, language, isActive }) => {
  const t = (hi, en) => language === 'hi' ? hi : en;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative p-5 rounded-2xl border-2 border-dashed
        ${isActive
          ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
        }
        transition-all duration-300 text-left group hover:shadow-lg hover:-translate-y-0.5
      `}
    >
      <div
        className={`
          w-14 h-14 rounded-2xl bg-gradient-to-br ${template.gradient}
          flex items-center justify-center mb-4
          shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
        `}
      >
        <template.icon className="w-7 h-7 text-white" />
      </div>
      <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1">
        {t(template.nameHi, template.name)}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t(template.descHi, template.desc)}
      </p>
      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <Zap className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
    </button>
  );
};

export default QuickTemplateCard;