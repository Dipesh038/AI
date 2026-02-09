const mongoose = require('mongoose');

const aiToolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    growth: {
        type: Number // Percentage growth year-over-year
    },
    website: {
        type: String
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    launchDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for category filtering
aiToolSchema.index({ category: 1 });

module.exports = mongoose.model('AITool', aiToolSchema);
