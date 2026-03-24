const mongoose = require('mongoose');

const questionTypeBreakdownSchema = new mongoose.Schema({
  type: { type: String, required: true },
  label: { type: String },
  count: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  qRange: { type: String },
  difficulty: { type: String },
  targetScore: { type: String },
  strategy: { type: String }
}, { _id: false });

const unitWeightageSchema = new mongoose.Schema({
  unitId: { type: String, required: true },
  unitName: { type: String },
  unitNameHi: { type: String },
  questionCount: { type: Number, default: 0 },
  marks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  priority: { type: String },
  difficulty: { type: String },
  roiScore: { type: Number, default: 3, min: 1, max: 5 }
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// QUESTION TOPIC MAP — supports ALL question types
// ═══════════════════════════════════════════════════════════════
const questionTopicMapSchema = new mongoose.Schema({
  qNo: { type: Number },
  originalQNo: { type: String },

  // Type: simple_mcq | multi_statement | matching | chronology |
  //       assertion_reason | comprehension | passage_based |
  //       statement_based | match_following | sequence_order |
  //       di_table | di_bar_chart | di_pie_chart | di_line_graph |
  //       di_caselet | di_mixed | mcq | bulk_mcq | pyq
  type: { type: String },

  // ── Categorization ──
  unitId: { type: String },
  unitName: { type: String },
  chapter: { type: String },
  chapterHi: { type: String },
  topic: { type: String },
  topicHi: { type: String },
  subtopic: { type: String },
  concept: { type: String },
  difficulty: { type: String, default: 'medium' },
  importance: { type: Number, default: 3, min: 1, max: 5 },
  keyTerms: [{ type: String }],

  // ── Question Text (all types) ──
  questionText: { type: String },
  questionTextHi: { type: String },
  questionTextEn: { type: String },

  // ── Instruction text (for match/sequence/statement) ──
  instruction: { type: String },
  instructionHi: { type: String },

  // ── Options (all types) ──
  options: [{ type: String }],
  optionsHi: [{ type: String }],
  optionsEn: [{ type: String }],

  // ── Answer ──
  correctAnswer: { type: mongoose.Schema.Types.Mixed },
  correctAnswerText: { type: String },

  // ── Explanation ──
  explanation: { type: String },
  explanationHi: { type: String },
  explanationEn: { type: String },

  // ── Assertion-Reason ──
  assertion: { type: String },
  assertionHi: { type: String },
  assertionEn: { type: String },
  reason: { type: String },
  reasonHi: { type: String },
  reasonEn: { type: String },

  // ── Statement Based / Multi-Statement ──
  statements: [{ type: String }],
  statementsHi: [{ type: String }],
  statementsEn: [{ type: String }],
  correctStatements: [{ type: Number }],

  // ── Match Following ──
  listA: [{ type: String }],
  listAHi: [{ type: String }],
  listAEn: [{ type: String }],
  listB: [{ type: String }],
  listBHi: [{ type: String }],
  listBEn: [{ type: String }],
  correctMatch: [{ type: Number }],

  // ── Sequence / Chronology ──
  items: [{ type: String }],
  itemsHi: [{ type: String }],
  itemsEn: [{ type: String }],
  correctOrder: [{ type: Number }],

  // ── Passage / Comprehension ──
  passage: { type: String },
  passageHi: { type: String },
  passageEn: { type: String },
  passageTitle: { type: String },

  // ── DI Table ──
  tableData: {
    headers: [{ type: String }],
    headersHi: [{ type: String }],
    rows: [[{ type: mongoose.Schema.Types.Mixed }]],
    footers: [{ type: String }],
    footersHi: [{ type: String }]
  },

  // ── DI Chart (Bar, Pie, Line) ──
  chartData: {
    labels: [{ type: String }],
    labelsHi: [{ type: String }],
    datasets: [{
      label: { type: String },
      labelHi: { type: String },
      data: [{ type: Number }],
      color: { type: String },
      _id: false
    }],
    xAxisLabel: { type: String },
    yAxisLabel: { type: String },
    chartType: { type: String }
  },

  // ── DI Caselet ──
  caseletText: { type: String },
  caseletTextHi: { type: String },
  caseletTextEn: { type: String },

  // ── Image URL (optional) ──
  imageUrl: { type: String },

  // ── Linked sub-questions (for passage/DI sets) ──
  subQuestions: [{
    qNo: { type: Number },
    questionText: { type: String },
    questionTextHi: { type: String },
    options: [{ type: String }],
    optionsHi: [{ type: String }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    explanation: { type: String },
    explanationHi: { type: String },
    _id: false
  }],

  // ── Source / Year meta ──
  source: { type: String },
  pyqYear: { type: String },
  pyqSession: { type: String },
  pyqShift: { type: String },

  // ═══════════════════════════════════════════════════════════════
  // ── Review & Verification System ──
  // ═══════════════════════════════════════════════════════════════
  verificationStatus: {
    type: String,
    enum: ['unchecked', 'checked', 'verified', 'approved', 'rejected'],
    default: 'unchecked'
  },
  correctnessStatus: {
    type: String,
    enum: ['unknown', 'correct', 'incorrect', 'partially_correct', 'needs_review'],
    default: 'unknown'
  },
  reviewNotes: { type: String },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  lastEditedAt: { type: Date },
  lastEditedBy: { type: String },
  editCount: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },

  // ── Edit History (last 20 entries) ──
  editHistory: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String }, // 'edit', 'verify', 'approve', 'reject', 'review'
    changedFields: [{ type: String }],
    previousValues: { type: mongoose.Schema.Types.Mixed },
    editedBy: { type: String, default: 'admin' },
    note: { type: String },
    _id: false
  }],

  // ── Flags ──
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedAt: { type: Date },

  // ── Original Flags ──
  hasContent: { type: Boolean, default: false },
  hasSubQuestions: { type: Boolean, default: false }
}, { _id: false });

const topTopicSchema = new mongoose.Schema({
  rank: { type: Number },
  topic: { type: String },
  topicHi: { type: String },
  unitId: { type: String },
  unitName: { type: String },
  chapter: { type: String },
  questionCount: { type: Number, default: 0 },
  questionNumbers: [{ type: String }],
  mustScore: { type: Boolean, default: false }
}, { _id: false });

const conceptSchema = new mongoose.Schema({
  concept: { type: String },
  conceptHi: { type: String },
  unitId: { type: String },
  chapter: { type: String },
  qNo: { type: String },
  type: { type: String },
  timesAskedThisYear: { type: Number, default: 1 }
}, { _id: false });

const trendSchema = new mongoose.Schema({
  trend: { type: String },
  direction: { type: String, enum: ['new','increasing','decreasing','stable','emerged'], default: 'stable' },
  evidence: { type: String },
  tip: { type: String },
  icon: { type: String }
}, { _id: false });

const difficultyMatrixSchema = new mongoose.Schema({
  zone: { type: String, enum: ['GREEN','RED','YELLOW','BLUE','ORANGE','PURPLE'] },
  qRange: { type: String },
  type: { type: String },
  difficulty: { type: String },
  targetScore: { type: String }
}, { _id: false });

// ═══════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════
const pyqAnalysisSchema = new mongoose.Schema({
  year: { type: String, required: true, trim: true },
  session: {
    type: String,
    enum: ['june','december','november','september','march','other'],
    required: true
  },
  shift: { type: String, enum: ['shift1','shift2','none'], default: 'none' },
  paper: { type: String, enum: ['paper1','paper2'], required: true },
  subject: { type: String, default: 'History' },
  displayLabel: { type: String },

  overview: {
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    marksPerQuestion: { type: Number, default: 2 },
    negativeMarking: { type: Boolean, default: false },
    questionRange: { start: { type: Number }, end: { type: Number } }
  },

  contentStats: {
    totalWithContent: { type: Number, default: 0 },
    totalWithExplanation: { type: Number, default: 0 },
    totalWithSubQuestions: { type: Number, default: 0 },
    typeBreakdown: { type: Map, of: Number }
  },

  questionTypeBreakdown: [questionTypeBreakdownSchema],
  unitWeightage: [unitWeightageSchema],
  questionTopicMap: [questionTopicMapSchema],
  topTopics: [topTopicSchema],
  conceptsTracked: [conceptSchema],
  trends: [trendSchema],
  difficultyMatrix: [difficultyMatrixSchema],

  matchingDetails: [{ qNo: String, listITheme: String, listIITheme: String, unitId: String, _id: false }],
  chronologyDetails: [{ qNo: String, eventsTheme: String, unitId: String, _id: false }],

  notes: { type: String },
  isActive: { type: Boolean, default: true },
  importedAt: { type: Date, default: Date.now }
}, { timestamps: true });

pyqAnalysisSchema.index({ year: 1, session: 1, shift: 1, paper: 1 }, { unique: true });
pyqAnalysisSchema.index({ paper: 1, isActive: 1 });

pyqAnalysisSchema.pre('save', function(next) {
  const sl = this.session.charAt(0).toUpperCase() + this.session.slice(1);
  const shL = this.shift !== 'none' ? ` (${this.shift === 'shift1' ? 'Shift 1' : 'Shift 2'})` : '';
  this.displayLabel = `${this.year} ${sl}${shL} - ${this.paper === 'paper1' ? 'Paper 1' : 'Paper 2'}`;

  if (this.questionTopicMap) {
    const typeCount = {};
    let wContent = 0, wExp = 0, wSub = 0;
    this.questionTopicMap.forEach(q => {
      if (q.hasContent) wContent++;
      if (q.explanation || q.explanationHi) wExp++;
      if (q.hasSubQuestions || q.subQuestions?.length > 0) wSub++;
      typeCount[q.type || 'unknown'] = (typeCount[q.type || 'unknown'] || 0) + 1;
    });
    this.contentStats = { totalWithContent: wContent, totalWithExplanation: wExp, totalWithSubQuestions: wSub, typeBreakdown: typeCount };
  }
  next();
});

pyqAnalysisSchema.statics.getAvailableYears = async function(paper = null) {
  const match = { isActive: true };
  if (paper) match.paper = paper;
  const results = await this.aggregate([
    { $match: match },
    { $group: { _id: { year:'$year', session:'$session', shift:'$shift', paper:'$paper' }, displayLabel: { $first:'$displayLabel' }, docId: { $first:'$_id' }, totalQuestions: { $first:'$overview.totalQuestions' }, contentStats: { $first:'$contentStats' } } },
    { $sort: { '_id.year': -1, '_id.session': 1, '_id.shift': 1 } }
  ]);
  return results.map(r => ({
    id: r.docId, year: r._id.year, session: r._id.session, shift: r._id.shift, paper: r._id.paper,
    displayLabel: r.displayLabel, totalQuestions: r.totalQuestions,
    hasContent: (r.contentStats?.totalWithContent || 0) > 0, contentCount: r.contentStats?.totalWithContent || 0
  }));
};

pyqAnalysisSchema.statics.getAllForPaper = async function(paper) {
  return this.find({ paper, isActive: true }).sort({ year: -1, session: 1, shift: 1 }).lean();
};

module.exports = mongoose.model('PYQAnalysis', pyqAnalysisSchema);