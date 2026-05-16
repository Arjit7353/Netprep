const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  blockNumber: {
    type: Number,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userRole: {
    type: String
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: Object
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  previousHash: {
    type: String,
    required: true
  },
  currentHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'alert'],
    default: 'success'
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
