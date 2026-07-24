// client/src/components/timeline/HistoryTimeline.jsx
// ═══════════════════════════════════════════════════════════════════
// INTERACTIVE HISTORY TIMELINE & CHRONOLOGY EXPLORER
// Visual timeline, dynasty explorer, search, era filters
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  Search, Filter, Clock, Star, ChevronDown, ChevronUp,
  Crown, BookOpen, Swords, Heart, Sparkles, ArrowRight,
  ZoomIn, ZoomOut, X, Layers, Calendar, Globe
} from 'lucide-react';
import Layout from '../layout/Layout';
import { ERAS, DYNASTIES, TIMELINE_EVENTS, CATEGORIES } from '../../utils/timelineData';
import { useNavigate } from 'react-router-dom';

const HistoryTimeline = ({ language = 'hi' }) => {
  const navigate = useNavigate();
  const [selectedEra, setSelectedEra] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedDynasty, setExpandedDynasty] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'dynasties' | 'events'

  const L = (en, hi) => language === 'hi' ? hi : en;

  // Filtered events
  const filteredEvents = useMemo(() => {
    let events = [...TIMELINE_EVENTS];
    if (selectedEra !== 'all') events = events.filter(e => e.era === selectedEra);
    if (selectedCategory !== 'all') events = events.filter(e => e.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.titleHi.includes(q) ||
        String(Math.abs(e.year)).includes(q)
      );
    }
    return events.sort((a, b) => a.year - b.year);
  }, [selectedEra, selectedCategory, searchQuery]);

  // Filtered dynasties
  const filteredDynasties = useMemo(() => {
    let dynasties = [...DYNASTIES];
    if (selectedEra !== 'all') dynasties = dynasties.filter(d => d.era === selectedEra);
    return dynasties.sort((a, b) => a.startYear - b.startYear);
  }, [selectedEra]);

  const formatYear = (year) => {
    if (year < 0) return `${Math.abs(year)} BCE`;
    return `${year} CE`;
  };

  const getEraColor = (eraId) => {
    return ERAS.find(e => e.id === eraId)?.color || '#6b7280';
  };

  return (
    <Layout language={language}>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-yellow-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <Clock className="w-5 h-5 text-amber-300" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {L('Interactive History Timeline', 'इंटरैक्टिव इतिहास टाइमलाइन')}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-amber-200">
                {L(
                  'Explore Indian History from Indus Valley to Independence — aligned with UGC NET History Syllabus',
                  'सिंधु घाटी से स्वतंत्रता तक भारतीय इतिहास का अन्वेषण करें — UGC NET इतिहास सिलेबस के अनुरूप'
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/timeline/practice')}
              className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-amber-900 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {L('Practice Chronology', 'कालानुक्रम अभ्यास')}
            </button>
          </div>

          {/* Era Quick Stats */}
          <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-2 mt-5">
            {ERAS.map(era => {
              const count = TIMELINE_EVENTS.filter(e => e.era === era.id).length;
              return (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(selectedEra === era.id ? 'all' : era.id)}
                  className={`p-3 rounded-xl text-left transition-all ${
                    selectedEra === era.id
                      ? 'bg-white/20 border-2 border-white/40'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold">{L(era.name, era.nameHi)}</p>
                  <p className="text-lg font-black">{count}</p>
                  <p className="text-[9px] text-amber-300">{L('Events', 'घटनाएं')}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={L('Search events, dynasties, years...', 'घटनाएं, राजवंश, वर्ष खोजें...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {L('All', 'सभी')}
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {L(cat.name, cat.nameHi)}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {[
            { id: 'timeline', label: L('Timeline View', 'टाइमलाइन दृश्य'), icon: Clock },
            { id: 'dynasties', label: L('Dynasty Explorer', 'राजवंश एक्सप्लोरर'), icon: Crown },
            { id: 'events', label: L('Events Grid', 'घटना ग्रिड'), icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === tab.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
          <div className="ml-auto text-xs text-gray-400 font-bold flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            {filteredEvents.length} {L('events', 'घटनाएं')}
          </div>
        </div>

        {/* TIMELINE VIEW */}
        {viewMode === 'timeline' && (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-purple-400 to-red-400 hidden sm:block" />

            <div className="space-y-4">
              {filteredEvents.map((event, i) => {
                const eraColor = getEraColor(event.era);
                const eraData = ERAS.find(e => e.id === event.era);
                return (
                  <div key={event.id} className="relative flex gap-4 sm:pl-14">
                    {/* Timeline Dot */}
                    <div
                      className="absolute left-4 w-5 h-5 rounded-full border-3 border-white dark:border-gray-800 shadow-md hidden sm:block"
                      style={{ backgroundColor: eraColor, top: '1rem' }}
                    />

                    {/* Event Card */}
                    <div
                      className={`flex-1 p-4 rounded-2xl border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                      style={{ borderColor: `${eraColor}30` }}
                      onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                              style={{ backgroundColor: eraColor }}
                            >
                              {formatYear(event.year)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500">
                              {L(eraData?.name, eraData?.nameHi)}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {L(event.title, event.titleHi)}
                          </h3>
                        </div>

                        {/* Importance Stars */}
                        <div className="flex gap-0.5 shrink-0">
                          {Array.from({ length: event.importance }).map((_, s) => (
                            <Star key={s} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedEvent === event.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p><strong>{L('Era', 'युग')}:</strong> {L(eraData?.name, eraData?.nameHi)}</p>
                          <p><strong>{L('Category', 'श्रेणी')}:</strong> {CATEGORIES.find(c => c.id === event.category)?.name || event.category}</p>
                          <p><strong>{L('Exam Relevance', 'परीक्षा प्रासंगिकता')}:</strong> {'⭐'.repeat(event.importance)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-bold">{L('No events found', 'कोई घटना नहीं मिली')}</p>
              </div>
            )}
          </div>
        )}

        {/* DYNASTY EXPLORER VIEW */}
        {viewMode === 'dynasties' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDynasties.map(dynasty => {
              const eraColor = getEraColor(dynasty.era);
              const isExpanded = expandedDynasty === dynasty.id;
              const relatedEvents = TIMELINE_EVENTS.filter(e =>
                e.year >= dynasty.startYear && e.year <= dynasty.endYear && e.era === dynasty.era
              );

              return (
                <div
                  key={dynasty.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => setExpandedDynasty(isExpanded ? null : dynasty.id)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: eraColor }}>
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{L(dynasty.name, dynasty.nameHi)}</h3>
                          <p className="text-[11px] text-gray-500">
                            {formatYear(dynasty.startYear)} — {formatYear(dynasty.endYear)}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-gray-500">{L('Founder', 'संस्थापक')}</p>
                          <p className="font-bold text-gray-900 dark:text-white">{L(dynasty.founder, dynasty.founderHi)}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                          <p className="text-gray-500">{L('Capital', 'राजधानी')}</p>
                          <p className="font-bold text-gray-900 dark:text-white">{dynasty.capital}</p>
                        </div>
                      </div>

                      {relatedEvents.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase mt-2 mb-1">{L('Key Events', 'प्रमुख घटनाएं')}</p>
                          {relatedEvents.slice(0, 5).map(ev => (
                            <div key={ev.id} className="flex items-center gap-2 text-[11px] py-1">
                              <span className="font-bold text-amber-600 w-16 shrink-0">{formatYear(ev.year)}</span>
                              <span className="text-gray-700 dark:text-gray-300">{L(ev.title, ev.titleHi)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* EVENTS GRID VIEW */}
        {viewMode === 'events' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredEvents.map(event => {
              const eraColor = getEraColor(event.era);
              return (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: eraColor }}>
                      {formatYear(event.year)}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: event.importance }).map((_, s) => (
                        <Star key={s} className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{L(event.title, event.titleHi)}</h3>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
};

export default HistoryTimeline;
