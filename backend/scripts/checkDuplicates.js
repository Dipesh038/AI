const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkDuplicates = async () => {
    try {
        console.log('Checking for duplicates in 2025 data...');
        const duplicates = await CountryToolPopularity.aggregate([
            { $match: { year: 2025 } },
            {
                $group: {
                    _id: { country: "$country", toolName: "$toolName" },
                    count: { $sum: 1 },
                    docs: { $push: "$$ROOT" }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate groups.`);
            duplicates.slice(0, 3).forEach(d => {
                console.log(`Duplicate: ${d._id.country} - ${d._id.toolName} (${d.count} records)`);
                d.docs.forEach(doc => console.log(` - Popularity: ${doc.popularity}`));
            });
        } else {
            console.log('No duplicates found.');
        }

        console.log('---');
        console.log('Checking specifc record for USA ChatGPT 2025:');
        const usaChatppp = await CountryToolPopularity.find({
            country: 'United States of America',
            year: 2025,
            toolName: 'ChatGPT'
        });
        console.log(usaChatppp);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDuplicates();
