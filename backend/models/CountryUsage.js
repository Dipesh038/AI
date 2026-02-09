const mongoose = require('mongoose');

const countryUsageSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    aiIndexScore: {
        type: Number
    },
    globalRank: {
        type: Number
    },
    adoptionLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High']
    },
    tools: [{
        name: { type: String, required: true },
        usage: { type: Number, required: true } // Normalized score/percentage
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

countryUsageSchema.index({ country: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('CountryUsage', countryUsageSchema);
