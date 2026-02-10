const mongoose = require('mongoose');

const aiToolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        url: { type: String },
        source: {
            type: String,
            enum: ['official', 'opengraph', 'category', 'placeholder', 'manual'],
            default: 'placeholder'
        },
        fallbackColor: { type: String }, // Hex code for placeholder
        lastVerified: { type: Date }
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

// Performance indexes
aiToolSchema.index({ category: 1 });
aiToolSchema.index({ launchDate: 1, category: 1 }); // Analytics category aggregation
aiToolSchema.index({ isPublished: 1 });              // Published tool filtering
aiToolSchema.index({ name: 1 });                     // Catalog search/sort

module.exports = mongoose.model('AITool', aiToolSchema);
