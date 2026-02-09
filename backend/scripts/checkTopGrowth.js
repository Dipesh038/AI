const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const ToolGrowthStats = require('../models/ToolGrowthStats');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkTopGrowth = async () => {
    try {
        const topTools = await ToolGrowthStats.find({ year: 2024 })
            .sort({ growthPercent: -1 })
            .limit(10);

        console.log('Top 10 Fastest Growing Tools (2024):');
        topTools.forEach(t => {
            console.log(`Rank ${t.rank}: ${t.toolName} (Category: ${t.category}, Growth: ${t.growthPercent}%)`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkTopGrowth();
