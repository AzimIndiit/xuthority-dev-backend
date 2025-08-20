const contactTicketService = require('../services/contactTicketService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const emailService = require('../services/emailService');
const ContactTicket = require('../models/ContactTicket');
const { notifyAdminsNewContact } = require('../services/adminNotificationService');

exports.create = async (req, res, next) => {
  try {
    const ticket = await contactTicketService.createTicket(req.body);

    // Notify support inbox (optional env/config)
    try {
      await emailService.sendTemplatedEmail({
        to: process.env.SUPPORT_EMAIL || 'support@xuthority.com',
        subject: `New Contact Ticket ${ticket.ticketId} - ${ticket.reason}`,
        template: 'generic-notification.ejs',
        data: {
          title: 'New Contact Ticket',
          message: `A new contact ticket has been created with ID ${ticket.ticketId}.`,
          details: JSON.stringify({
            name: `${ticket.firstName} ${ticket.lastName}`,
            email: ticket.email,
            company: ticket.company,
            subject: ticket.subject,
            reason: ticket.reason,
          }, null, 2),
        },
      });
    } catch (e) {
      // Non-blocking email failure
      console.warn('Failed to send support email for contact ticket:', e.message);
    }

    // Create admin notification in app
    try {
      await notifyAdminsNewContact(ticket);
    } catch (e) {
      console.warn('Failed to create admin notification for contact ticket:', e.message);
    }

    // Send confirmation email to the user with the ticket ID
    try {
      await emailService.sendTemplatedEmail({
        to: ticket.email,
        subject: `We received your request — Ticket ${ticket.ticketId}`,
        template: 'contact-ticket-created.ejs',
        data: {
          userName: `${ticket.firstName} ${ticket.lastName}`.trim(),
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          reason: ticket.reason,
        },
      });
    } catch (e) {
      console.warn('Failed to send user confirmation email for contact ticket:', e.message);
    }

    return res.status(201).json(ApiResponse.success(ticket, 'Contact ticket created'));
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const prev = await ContactTicket.findById(id);
    const ticket = await contactTicketService.updateTicketStatus(id, status);
    if (!ticket) throw new ApiError('Ticket not found', 'NOT_FOUND', 404);

    // Notify user about status update
    try {
      await emailService.sendTemplatedEmail({
        to: ticket.email,
        subject: `Update on your request — Ticket ${ticket.ticketId}: ${status.toUpperCase()}`,
        template: 'contact-ticket-status-update.ejs',
        data: {
          userName: `${ticket.firstName} ${ticket.lastName}`.trim(),
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          oldStatus: prev?.status || 'open',
          newStatus: status,
        },
      });
    } catch (e) {
      console.warn('Failed to send status update email:', e.message);
    }
    return res.json(ApiResponse.success(ticket, 'Status updated'));
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const data = await contactTicketService.listTickets(req.query);
    return res.json(ApiResponse.success(data, 'Tickets fetched'));
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await ContactTicket.findById(id);
    if (!ticket) throw new ApiError('Ticket not found', 'NOT_FOUND', 404);
    return res.json(ApiResponse.success(ticket, 'Ticket fetched'));
  } catch (error) {
    next(error);
  }
};

exports.reply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const ticket = await ContactTicket.findById(id);
    if (!ticket) throw new ApiError('Ticket not found', 'NOT_FOUND', 404);
    if (!message || !String(message).trim()) {
      throw new ApiError('Reply message is required', 'VALIDATION_ERROR', 400);
    }

    // If currently open, auto-move to pending and notify user FIRST
    if (ticket.status === 'open') {
      const updated = await contactTicketService.updateTicketStatus(id, 'pending');
      try {
        await emailService.sendTemplatedEmail({
          to: ticket.email,
          subject: `Update on your request — Ticket ${ticket.ticketId}: PENDING`,
          template: 'contact-ticket-status-update.ejs',
          data: {
            userName: `${ticket.firstName} ${ticket.lastName}`.trim(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            oldStatus: 'open',
            newStatus: 'pending',
          },
        });
      } catch (e) {
        console.warn('Failed to send auto status update email (open -> pending):', e.message);
      }
    }

    // Then send the reply email to the user; we do not persist replies
    await emailService.sendTemplatedEmail({
      to: ticket.email,
      subject: `Re: ${ticket.subject} — Ticket ${ticket.ticketId}`,
      template: 'contact-ticket-reply.ejs',
      data: {
        userName: `${ticket.firstName} ${ticket.lastName}`.trim(),
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        reason: ticket.reason,
        replyMessage: message,
      },
    });

    return res.json(ApiResponse.success({ ticketId: ticket.ticketId }, 'Reply sent'));
  } catch (error) {
    next(error);
  }
};


