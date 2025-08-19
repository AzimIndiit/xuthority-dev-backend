const mongoose = require('mongoose');

const TICKET_STATUS = ['open', 'pending', 'resolved', 'closed'];
const REASONS = ['sales', 'support', 'partnership', 'press', 'other'];

const contactTicketSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 50 },
    lastName: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    company: { type: String, trim: true, maxlength: 100 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    reason: { type: String, required: true, enum: REASONS, index: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    consent: { type: Boolean, default: true },
    status: { type: String, enum: TICKET_STATUS, default: 'open', index: true },
    ticketId: { type: String, required: true, unique: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Generate a human-readable ticketId like CT-20250101-ABC123
contactTicketSchema.pre('validate', function (next) {
  if (!this.ticketId) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketId = `CT-${datePart}-${randomPart}`;
  }
  next();
});

contactTicketSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('ContactTicket', contactTicketSchema);


