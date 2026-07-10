const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.replyTicket = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'Replied';
    ticket.messages.push({
      sender: 'Admin',
      senderName: req.admin.username,
      message,
      timestamp: new Date()
    });

    await ticket.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Reply Ticket',
      details: `Replied to ticket ID: ${ticket.ticketId}`,
      ipAddress: req.ip
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.closeTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.status = 'Closed';
    await ticket.save();

    await AuditLog.create({
      admin: req.admin.username,
      role: req.admin.role,
      action: 'Close Ticket',
      details: `Closed ticket ID: ${ticket.ticketId}`,
      ipAddress: req.ip
    });

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
