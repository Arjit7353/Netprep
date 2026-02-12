const mongoose = require('mongoose');
const Counter = require('./Counter');

const diDataSchema = new mongoose.Schema({
  // Auto-generated unique DI number
  diNumber: {
    type: Number,
    unique: true
  },

  // DI Type
  diType: {
    type: String,
    enum: ['table', 'bar_chart', 'pie_chart', 'line_graph', 'mixed', 'caselet'],
    required: [true, 'DI type is required']
  },

  // Title/Heading
  title: {
    hi: {
      type: String,
      trim: true
    },
    en: {
      type: String,
      trim: true
    }
  },

  // Instruction text
  instruction: {
    hi: {
      type: String,
      trim: true
    },
    en: {
      type: String,
      trim: true
    }
  },

  // For Table DI
  tableData: {
    headers: {
      hi: [{
        type: String,
        trim: true
      }],
      en: [{
        type: String,
        trim: true
      }]
    },
    rows: [[{
      type: mongoose.Schema.Types.Mixed  // Can contain numbers, strings, null
    }]],
    footers: {
      hi: [{
        type: String,
        trim: true
      }],
      en: [{
        type: String,
        trim: true
      }]
    }
  },

  // For Chart DI (Bar, Pie, Line, Mixed)
  chartData: {
    labels: {
      hi: [{
        type: String,
        trim: true
      }],
      en: [{
        type: String,
        trim: true
      }]
    },
    datasets: [{
      label: {
        hi: { type: String, trim: true },
        en: { type: String, trim: true }
      },
      data: [{
        type: Number
      }],
      color: {
        type: String,
        default: '#3B82F6'
      },
      backgroundColor: {
        type: String
      },
      borderColor: {
        type: String
      },
      type: {
        type: String,
        enum: ['bar', 'line', 'pie', 'doughnut', 'area'],
        default: 'bar'
      }
    }],
    xAxisLabel: {
      hi: { type: String, trim: true },
      en: { type: String, trim: true }
    },
    yAxisLabel: {
      hi: { type: String, trim: true },
      en: { type: String, trim: true }
    },
    // For pie charts - colors array
    colors: [{
      type: String
    }]
  },

  // For Caselet (text-based data)
  caseletText: {
    hi: {
      type: String,
      trim: true
    },
    en: {
      type: String,
      trim: true
    }
  },

  // Image URL (optional - for image-based DI)
  imageUrl: {
    type: String,
    trim: true
  },

  // Cloudinary image details (if uploaded)
  imageDetails: {
    publicId: { type: String },
    url: { type: String },
    secureUrl: { type: String },
    width: { type: Number },
    height: { type: Number }
  },

  // Categorization
  paper: {
    type: String,
    enum: ['paper1', 'paper2'],
    required: [true, 'Paper is required']
  },

  unit: {
    type: String,
    trim: true
  },

  chapter: {
    type: String,
    trim: true
  },

  topic: {
    type: String,
    trim: true
  },

  // Source information
  source: {
    type: String,
    trim: true
  },

  // Number of questions associated with this DI
  questionCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// Pre-save middleware to auto-generate diNumber
diDataSchema.pre('save', async function(next) {
  if (this.isNew && !this.diNumber) {
    try {
      this.diNumber = await Counter.getNextSequence(Counter.COUNTERS.DI_DATA);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes
diDataSchema.index({ diType: 1 });
diDataSchema.index({ paper: 1 });
diDataSchema.index({ unit: 1 });
diDataSchema.index({ createdAt: -1 });

// Virtual to get associated questions
diDataSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'diDataId'
});

// Method to update question count
diDataSchema.methods.updateQuestionCount = async function() {
  const Question = mongoose.model('Question');
  const count = await Question.countDocuments({ diDataId: this._id });
  this.questionCount = count;
  return this.save();
};

// Static method to get DI data with questions
diDataSchema.statics.getWithQuestions = async function(diDataId) {
  return this.findById(diDataId).populate({
    path: 'questions',
    options: { sort: { diOrder: 1 } }
  });
};

// Static method to get DI by type
diDataSchema.statics.getByType = async function(diType, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const diData = await this.find({ diType, isActive: true })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await this.countDocuments({ diType, isActive: true });

  return {
    diData,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Ensure virtuals are included
diDataSchema.set('toJSON', { virtuals: true });
diDataSchema.set('toObject', { virtuals: true });

const DIData = mongoose.model('DIData', diDataSchema);

module.exports = DIData;