const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

const STATUS_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

// Transition Rules Helper
const isValidTransition = (current, next) => {
    const currentIndex = STATUS_ORDER.indexOf(current);
    const nextIndex = STATUS_ORDER.indexOf(next);

    // Forward path: exactly one step ahead
    if (nextIndex === currentIndex + 1) return true;
    
    // Backward path: exactly one step back
    if (nextIndex === currentIndex - 1) return true;

    return false;
};

// @route   POST /tickets
// @desc    Create a ticket
router.post('/', async (req, res) => {
    try {
        const ticket = new Ticket(req.body);
        await ticket.save();
        res.status(201).json(ticket);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// @route   GET /tickets
// @desc    List tickets with filters
router.get('/', async (req, res) => {
    try {
        const { status, priority, breached } = req.query;
        let query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;

        let tickets = await Ticket.find(query).sort({ createdAt: -1 });

        // Virtuals are computed on the instances
        if (breached === 'true') {
            tickets = tickets.filter(t => t.slaBreached);
        }

        res.json(tickets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET /tickets/stats
// @desc    Get aggregate stats
router.get('/stats', async (req, res) => {
    try {
        const tickets = await Ticket.find();
        
        const stats = {
            statusCounts: {
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0
            },
            priorityCounts: {
                low: 0,
                medium: 0,
                high: 0,
                urgent: 0
            },
            openBreachedCount: 0
        };

        tickets.forEach(ticket => {
            // Stats counts
            stats.statusCounts[ticket.status]++;
            stats.priorityCounts[ticket.priority]++;
            
            // Breached open tickets
            if ((ticket.status === 'open' || ticket.status === 'in_progress') && ticket.slaBreached) {
                stats.openBreachedCount++;
            }
        });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   PATCH /tickets/:id
// @desc    Update ticket status
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        if (status && status !== ticket.status) {
            if (!isValidTransition(ticket.status, status)) {
                return res.status(400).json({ 
                    error: `Invalid status transition: ${ticket.status} to ${status}. Transitions must be one step forward or one step backward.` 
                });
            }

            // Handle resolvedAt logic
            if (status === 'resolved') {
                ticket.resolvedAt = new Date();
            } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
                // Moving back from resolved/closed
                if (status === 'in_progress' || status === 'open') {
                    ticket.resolvedAt = undefined;
                }
            }
            
            // Extra: if moving from resolved to closed, keep resolvedAt or set if missing
            if (status === 'closed' && !ticket.resolvedAt) {
                ticket.resolvedAt = new Date();
            }

            ticket.status = status;
        }

        // Apply other updates if present
        Object.keys(req.body).forEach(key => {
            if (key !== 'status') ticket[key] = req.body[key];
        });

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// @route   DELETE /tickets/:id
// @desc    Delete a ticket
router.delete('/:id', async (req, res) => {
    try {
        await Ticket.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ticket deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
