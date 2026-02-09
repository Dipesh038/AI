const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkPop2024 = async () => {
    try {
        console.log('Checking specifc record for USA ChatGPT 2024:');
        const usaChat2024 = await CountryToolPopularity.find({
            country: 'United States of America',
            year: 2024,
            toolName: 'ChatGPT'
        });
        console.log(usaChat2024);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkPop2024();
