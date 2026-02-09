const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const AITool = require('../models/AITool');
const Category = require('../models/Category');
const CountryUsage = require('../models/CountryUsage');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkStats = async () => {
    try {
        await connectDB();

        const toolsCount = await AITool.countDocuments();
        const categoriesCount = await Category.countDocuments();
        const countriesCount = await CountryUsage.countDocuments();

        console.log('--- DB STATS ---');
        console.log(`Tools: ${toolsCount}`);
        console.log(`Categories: ${categoriesCount}`);
        console.log(`Countries: ${countriesCount}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStats();
