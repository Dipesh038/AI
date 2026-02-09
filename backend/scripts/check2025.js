const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const ToolGrowthStats = require('../models/ToolGrowthStats');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const check2025 = async () => {
    try {
        const count = await ToolGrowthStats.countDocuments({ year: 2025 });
        console.log(`Found ${count} growth records for 2025.`);

        if (count > 0) {
            const sample = await ToolGrowthStats.findOne({ year: 2025 });
            console.log('Sample 2025 record:', sample);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check2025();
