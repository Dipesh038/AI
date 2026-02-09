const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const AITool = require('../models/AITool');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkDistribution = async () => {
    try {
        const tools = await AITool.find({});
        console.log(`Loaded ${tools.length} tools.`);

        const years = [2022, 2023, 2024, 2025];

        for (const year of years) {
            const filtered = tools.filter(t => t.launchDate && t.launchDate.getFullYear() === year);
            console.log(`Year ${year}: ${filtered.length} tools`);

            if (filtered.length > 0) {
                const counts = filtered.reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + 1;
                    return acc;
                }, {});

                const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                console.log(`  Top Category: ${sorted[0][0]} (${sorted[0][1]})`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDistribution();
