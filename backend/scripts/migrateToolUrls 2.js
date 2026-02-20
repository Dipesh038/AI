require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const AITool = require('../models/AITool');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_PATH = path.join(__dirname, '../../datasets/raw/Complete AI Tools Dataset 2025 - 16763 Tools from AIToolBuzz.csv');

async function migrateUrls() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aidb');
    console.log('✅ Connected to MongoDB');

    if (!fs.existsSync(CSV_PATH)) {
        console.error('❌ CSV file not found at:', CSV_PATH);
        process.exit(1);
    }

    console.log('Reading CSV...');
    const csvMap = new Map(); // Name -> Website URL

    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_PATH)
            .pipe(csv({ mapHeaders: ({ header }) => header.trim().replace(/^\ufeff/, '') }))
            .on('data', (row) => {
                const name = row['Name'];
                const website = row['Website'];

                if (name && website && website.startsWith('http')) {
                    csvMap.set(name.trim(), website.trim());
                }
            }) // Added missing closing parenthesis here
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Loaded ${csvMap.size} URLs from CSV.`);

    console.log('Fetching tools from DB...');
    const tools = await AITool.find({});
    console.log(`Found ${tools.length} tools in DB.`);

    let bulkOps = [];
    let updatedCount = 0;
    let processedCount = 0;

    for (const tool of tools) {
        processedCount++;
        const realUrl = csvMap.get(tool.name);

        if (realUrl && (!tool.website || tool.website.includes('aitoolbuzz.com'))) {
            // Clean the URL (remove ?ref=...)
            let cleanUrl = realUrl;
            try {
                const urlObj = new URL(realUrl);
                urlObj.searchParams.delete('ref');
                cleanUrl = urlObj.toString();
            } catch (e) {
                // Keep original if parsing fails
            }

            if (tool.website !== cleanUrl) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: tool._id },
                        update: { $set: { website: cleanUrl } }
                    }
                });
                updatedCount++;
            }
        }

        if (bulkOps.length >= 1000) {
            await AITool.bulkWrite(bulkOps);
            bulkOps = [];
            process.stdout.write(`Included ${updatedCount} updates so far (Processed ${processedCount})...\n`);
        }
    }

    if (bulkOps.length > 0) {
        await AITool.bulkWrite(bulkOps);
    }

    console.log(`\n✅ Migration Complete. Updated ${updatedCount} tools.`);
    process.exit(0);
}

migrateUrls();
