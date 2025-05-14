const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: ['email_opened', 'link_clicked', 'form_submitted', 'email_reported']
  },
  email: {
    type: String,
    required: true
  },
  campaignId: {
    type: String,
    required: true
  },
  campaignName: {
    type: String
  },
  userId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

module.exports = WebhookEvent; 