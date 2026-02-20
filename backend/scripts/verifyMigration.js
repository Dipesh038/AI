require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const AITool = require('../models/AITool');

async function verifyMigration() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aidb');
    console.log('✅ Connected to MongoDB');

    const totalTools = await AITool.countDocuments({});
    console.log(`Total tools: ${totalTools}`);

    const aggregatorTools = await AITool.countDocuments({ website: { $regex: 'aitoolbuzz.com' } });
    console.log(`Tools still pointing to aitoolbuzz.com: ${aggregatorTools}`);

    const randomTools = await AITool.aggregate([{ $sample: { size: 5 } }]);
    console.log('Random tools sample:');
    randomTools.forEach(t => console.log(`- ${t.name}: ${t.website}`));

    process.exit(0);
}

verifyMigration();
