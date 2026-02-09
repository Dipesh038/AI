const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkMalaysia = async () => {
    try {
        const count = await CountryToolPopularity.countDocuments({ country: 'Malaysia' });
        console.log(`Found ${count} records for Malaysia.`);

        if (count > 0) {
            const sample = await CountryToolPopularity.findOne({ country: 'Malaysia' });
            console.log('Sample record:', sample);
        }

        const total = await CountryToolPopularity.countDocuments({});
        console.log(`Total popularity records: ${total}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkMalaysia();
