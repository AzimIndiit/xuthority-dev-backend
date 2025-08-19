const ContactTicket = require('../models/ContactTicket');

async function createTicket(payload) {
  const ticket = await ContactTicket.create(payload);
  return ticket;
}

async function updateTicketStatus(id, status) {
  const ticket = await ContactTicket.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  return ticket;
}

async function listTickets(filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    reason,
    search,
    ticketId,
    period,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const query = {};
  if (status) query.status = status;
  if (reason) query.reason = reason;
  if (ticketId) query.ticketId = new RegExp(ticketId, 'i');

  // Date filtering
  let from = null;
  let to = null;
  const now = new Date();
  if (period) {
    const start = new Date(now);
    if (period === 'weekly') start.setDate(now.getDate() - 7);
    if (period === 'monthly') start.setMonth(now.getMonth() - 1);
    if (period === 'yearly') start.setFullYear(now.getFullYear() - 1);
    from = start;
    to = now;
  }
  if (dateFrom) from = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setUTCHours(23, 59, 59, 999);
    to = end;
  }
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  // Text search across fields
  if (search && String(search).trim()) {
    const term = String(search).trim();
    query.$or = [
      { firstName: new RegExp(term, 'i') },
      { lastName: new RegExp(term, 'i') },
      { email: new RegExp(term, 'i') },
      { subject: new RegExp(term, 'i') },
      { message: new RegExp(term, 'i') },
      { ticketId: new RegExp(term, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [items, total] = await Promise.all([
    ContactTicket.find(query).sort(sort).skip(skip).limit(Number(limit)),
    ContactTicket.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      currentPage: Number(page),
      itemsPerPage: Number(limit),
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)) || 1,
      hasNext: skip + Number(limit) < total,
      hasPrev: skip > 0,
    },
  };
}

module.exports = { createTicket, updateTicketStatus, listTickets };


