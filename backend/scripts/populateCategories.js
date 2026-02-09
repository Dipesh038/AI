const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const AITool = require('../models/AITool');
const Category = require('../models/Category');

dotenv.config({ path: path.join(__dirname, '../.env') });

const populateCategories = async () => {
    try {
        await connectDB();

        console.log('Fetching tools...');
        const tools = await AITool.find({});

        // Extract unique categories
        const uniqueCategories = [...new Set(tools.map(tool => tool.category).filter(Boolean))];

        console.log(`Found ${uniqueCategories.length} unique categories across ${tools.length} tools.`);

        let addedCount = 0;
        for (const catName of uniqueCategories) {
            const exists = await Category.findOne({ name: catName });
            if (!exists) {
                await Category.create({ name: catName, description: `Tools for ${catName}` });
                addedCount++;
            }
        }

        console.log(`Successfully added ${addedCount} new categories.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

populateCategories();
