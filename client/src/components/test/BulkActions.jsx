// client/src/components/test/BulkActions.jsx
// ⭐ BULK ACTIONS BAR - UPDATED WITH BATCH EXPORT

import React from 'react';
import { X, CheckSquare, Square, Download, Archive, Loader2 } from 'lucide-react';

const BulkActions = ({
  selectedCount, totalCount, onSelectAll, onClearSelection,
  onBulkDelete, onBulkExport, loading, language = 'en',
}) => {
  return (
    <div className="sticky top-16 z-30 animate-slide-down">
      <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-indigo-600 rounded-2xl p-4 shadow-2xl shadow-primary-600/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onClearSelection} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-lg">{selectedCount} {language === 'hi' ? 'चयनित' : 'selected'}</div>
                <div className="text-white/70 text-xs">{language === 'hi' ? 'कार्रवाई चुनें' : 'Choose action'}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {selectedCount === totalCount ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              {selectedCount === totalCount ? (language === 'hi' ? 'सभी हटाएं' : 'Deselect') : (language === 'hi' ? 'सभी चुनें' : 'Select All')}
            </button>

            {/* Export PDFs Button */}
            <button
              onClick={onBulkExport}
              disabled={selectedCount === 0 || loading}
              className="px-4 py-2.5 bg-white text-primary-700 text-sm font-bold rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {language === 'hi' ? 'PDF निर्यात' : 'Export PDFs'} ({selectedCount})
            </button>

            <button
              onClick={onBulkDelete}
              disabled={selectedCount === 0 || loading}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {language === 'hi' ? 'हटाएं' : 'Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;