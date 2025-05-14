const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  gophishId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  created_date: {
    type: Date,
    required: true
  },
  launch_date: {
    type: Date,
    required: true
  },
  send_by_date: {
    type: Date
  },
  completed_date: {
    type: Date
  },
  template: {
    id: String,
    name: String
  },
  page: {
    id: String,
    name: String
  },
  smtp: {
    id: String,
    name: String
  },
  url: {
    type: String
  },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'QUEUED', 'COMPLETED', 'CANCELED', 'SCHEDULED'],
    default: 'SCHEDULED'
  },
  results: [
    {
      email: String,
      firstName: String,
      lastName: String,
      position: String,
      status: {
        type: String,
        enum: ['SENDING', 'SENT', 'OPENED', 'CLICKED', 'SUBMITTED', 'REPORTED']
      },
      ip: String,
      latitude: Number,
      longitude: Number,
      sendDate: Date,
      openDate: Date,
      clickDate: Date,
      submitDate: Date,
      reportDate: Date
    }
  ],
  stats: {
    total: Number,
    sent: Number,
    opened: Number,
    clicked: Number,
    submitted: Number,
    reported: Number
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign; 