const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkApiSim = async () => {
    try {
        const country = 'United States of America';
        const year = 2025;

        console.log(`Simulating API call for ${country} - ${year}`);

        const data = await CountryToolPopularity.find({
            country: country,
            year: parseInt(year)
        }).sort({ popularity: -1 });

        console.log(`Found ${data.length} records.`);

        const chatgpt = data.find(d => d.toolName === 'ChatGPT');
        if (chatgpt) {
            console.log('ChatGPT Record:', chatgpt);
        } else {
            console.log('ChatGPT not found in result.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkApiSim();
