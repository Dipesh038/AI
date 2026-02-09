const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkPop2025 = async () => {
    try {
        const count = await CountryToolPopularity.countDocuments({ year: 2025 });
        console.log(`Found ${count} popularity records for 2025.`);

        if (count > 0) {
            const sample = await CountryToolPopularity.findOne({ year: 2025 });
            console.log('Sample 2025 record:', sample);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkPop2025();
