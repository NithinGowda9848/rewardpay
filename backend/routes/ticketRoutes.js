const express = require('express');
const router = express.Router();
const { getTickets, replyTicket, closeTicket } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/adminAuth');

router.get('/', protect, getTickets);
router.post('/:id/reply', protect, replyTicket);
router.patch('/:id/close', protect, authorize('Super Admin', 'Manager'), closeTicket);

module.exports = router;
