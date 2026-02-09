const mongoose = require('mongoose');

const toolGrowthStatsSchema = new mongoose.Schema({
    toolName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    growthPercent: {
        type: Number,
        required: true
    },
    rank: {
        type: Number
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique combination of tool and year
toolGrowthStatsSchema.index({ toolName: 1, year: 1 }, { unique: true });
// Performance index for growth queries
toolGrowthStatsSchema.index({ year: 1, growthPercent: -1 });

module.exports = mongoose.model('ToolGrowthStats', toolGrowthStatsSchema);
