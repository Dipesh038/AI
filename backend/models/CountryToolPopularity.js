const mongoose = require('mongoose');

const countryToolPopularitySchema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    toolName: {
        type: String,
        required: true,
        trim: true
    },
    popularity: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Ensure unique combination of country, year, and tool to prevent duplicates
countryToolPopularitySchema.index({ country: 1, year: 1, toolName: 1 }, { unique: true });
// Performance index for dashboard queries
countryToolPopularitySchema.index({ country: 1, year: 1, popularity: -1 });

module.exports = mongoose.model('CountryToolPopularity', countryToolPopularitySchema);
