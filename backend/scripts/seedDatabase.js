const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const CountryUsage = require('../models/CountryUsage');
const AITool = require('../models/AITool');
const Admin = require('../models/Admin');
const { processDatasets } = require('./processDatasets');

dotenv.config({ path: path.join(__dirname, '../.env') });

const importData = async () => {
    try {
        await connectDB();

        console.log('Clearing existing data...');
        await CountryUsage.deleteMany();
        await AITool.deleteMany();
        await Admin.deleteMany();

        console.log('Processing datasets...');
        const data = await processDatasets();

        if (!data) {
            console.error('Failed to process data');
            process.exit(1);
        }

        // Insert Tools
        console.log('Inserting AI Tools...');
        // Filter duplicates
        const uniqueTools = Array.from(new Set(data.tools.map(t => t.name)))
            .map(name => data.tools.find(t => t.name === name));

        await AITool.insertMany(uniqueTools);

        // Insert Country Usage
        console.log('Inserting Country Usage...');
        await CountryUsage.insertMany(data.countries);

        // Create Admin User
        console.log('Creating Admin User...');
        const adminUser = new Admin({
            email: process.env.ADMIN_EMAIL || 'dipeshkunwar8@gmail.com',
            password: process.env.ADMIN_PASSWORD || 'dkwarrier'
        });
        await adminUser.save();

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();
        await CountryUsage.deleteMany();
        await AITool.deleteMany();
        await Admin.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
