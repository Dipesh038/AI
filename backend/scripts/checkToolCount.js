const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const AITool = require('../models/AITool');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkToolCount = async () => {
    try {
        const count = await AITool.countDocuments();
        console.log(`Total AI Tools in Catalog: ${count}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkToolCount();
