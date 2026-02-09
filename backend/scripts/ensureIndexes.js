const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');

// Load Models
const CountryToolPopularity = require('../models/CountryToolPopularity');
const ToolGrowthStats = require('../models/ToolGrowthStats');
const CountryUsage = require('../models/CountryUsage');
const AITool = require('../models/AITool');

dotenv.config({ path: path.join(__dirname, '../.env') });

const ensureIndexes = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...');

        console.log('Ensuring indexes for CountryToolPopularity...');
        await CountryToolPopularity.syncIndexes();

        console.log('Ensuring indexes for ToolGrowthStats...');
        await ToolGrowthStats.syncIndexes();

        console.log('Ensuring indexes for CountryUsage...');
        // Find if old unique index on country exists and drop it if needed
        const countryUsageIndexes = await CountryUsage.listIndexes();
        const oldIndex = countryUsageIndexes.find(idx => idx.key.country === 1 && idx.unique === true && Object.keys(idx.key).length === 1);
        if (oldIndex) {
            console.log('Dropping old unique index on country...');
            await CountryUsage.collection.dropIndex(oldIndex.name);
        }
        await CountryUsage.syncIndexes();

        console.log('Ensuring indexes for AITool...');
        await AITool.syncIndexes();

        console.log('All indexes verified/created successfully.');

        // Log current indexes
        console.log('\nCurrent Indexes:');
        console.log('CountryToolPopularity:', await CountryToolPopularity.listIndexes());
        console.log('ToolGrowthStats:', await ToolGrowthStats.listIndexes());
        console.log('CountryUsage:', await CountryUsage.listIndexes());
        console.log('AITool:', await AITool.listIndexes());

        process.exit();
    } catch (err) {
        console.error('Error ensuring indexes:', err);
        process.exit(1);
    }
};

ensureIndexes();
