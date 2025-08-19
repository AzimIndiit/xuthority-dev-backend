const contactTicketService = require('../services/contactTicketService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const emailService = require('../services/emailService');

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
    const ticket = await contactTicketService.updateTicketStatus(id, status);
    if (!ticket) throw new ApiError('Ticket not found', 'NOT_FOUND', 404);
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


