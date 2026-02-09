const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const AITool = require('../models/AITool');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const checkDates = async () => {
    try {
        const total = await AITool.countDocuments();
        const withDate = await AITool.countDocuments({ launchDate: { $ne: null } });

        console.log(`Total Tools: ${total}`);
        console.log(`Tools with Launch Date: ${withDate} (${Math.round(withDate / total * 100)}%)`);

        if (withDate > 0) {
            const distribution = await AITool.aggregate([
                { $match: { launchDate: { $ne: null } } },
                {
                    $group: {
                        _id: { $year: "$launchDate" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
            console.log('Year Distribution:', distribution);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDates();
