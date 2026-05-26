const mongoose = require('mongoose');
const validator = require('validator');

const SLA_TARGETS = {
    urgent: 60,      // 1 hour
    high: 240,       // 4 hours
    medium: 1440,    // 24 hours
    low: 4320        // 72 hours
};

const ticketSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        required: [true, 'Customer email is required'],
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    priority: {
        type: String,
        required: [true, 'Priority is required'],
        enum: ['low', 'medium', 'high', 'urgent']
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Derived field: ageMinutes
ticketSchema.virtual('ageMinutes').get(function() {
    const end = (this.status === 'resolved' || this.status === 'closed') && this.resolvedAt 
        ? this.resolvedAt 
        : new Date();
    const diffMs = end - this.createdAt;
    return Math.floor(diffMs / (1000 * 60));
});

// Derived field: slaBreached
ticketSchema.virtual('slaBreached').get(function() {
    const age = this.ageMinutes;
    const target = SLA_TARGETS[this.priority];
    
    // Still unresolved and past target
    if (this.status !== 'resolved' && this.status !== 'closed' && age > target) {
        return true;
    }
    
    // Resolved after target
    if ((this.status === 'resolved' || this.status === 'closed') && this.resolvedAt) {
        const resolvedAge = Math.floor((this.resolvedAt - this.createdAt) / (1000 * 60));
        return resolvedAge > target;
    }
    
    return false;
});

module.exports = mongoose.model('Ticket', ticketSchema);
