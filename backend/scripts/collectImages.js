const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path as needed
const AITool = require('../models/AITool');
const imageService = require('../services/imageService');

const BATCH_SIZE = 50;

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aitools');
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
}

async function processTools() {
    await connectDB();

    try {
        // Find tools without a resolved image (or placeholder)
        // We want to target tools where image.source is undefined or 'placeholder' 
        // AND we haven't checked them recently (optional optimization)

        const tools = await AITool.find({
            $or: [
                { 'image.url': { $exists: false } },
                { 'image.source': 'placeholder' }
            ],
            website: { $exists: true, $ne: '' }
        }).limit(BATCH_SIZE);

        console.log(`Found ${tools.length} tools to process`);

        for (const tool of tools) {
            console.log(`Processing: ${tool.name} (${tool.website})`);

            // Artificial delay to be polite
            await new Promise(r => setTimeout(r, 500));

            const result = await imageService.resolveImage(tool.website);

            if (result && result.url) {
                tool.image = {
                    url: result.url,
                    source: result.source,
                    lastVerified: new Date(),
                    fallbackColor: generateFallbackColor(tool.name) // Helper
                };

                await tool.save();
                console.log(`Updated ${tool.name}: ${result.url}`);
            } else {
                console.log(`No image found for ${tool.name}`);
                // Mark as checked so we don't loop forever? 
                // Currently just leaving as is, or we could set a "lastVerified" even if failed.
            }
        }

        console.log('Batch Complete');
    } catch (error) {
        console.error('Error in worker:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Simple color generator from string
function generateFallbackColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// Run if called directly
if (require.main === module) {
    processTools();
}

module.exports = { processTools };
