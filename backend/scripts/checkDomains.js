require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const AITool = require('../models/AITool');

async function checkDomains() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aidb');

    const tools = await AITool.find({}, 'website');
    const domains = {};
    let nullWebsites = 0;

    tools.forEach(tool => {
        if (!tool.website) {
            nullWebsites++;
            return;
        }
        try {
            const hostname = new URL(tool.website).hostname;
            domains[hostname] = (domains[hostname] || 0) + 1;
        } catch (e) {
            // invalid url
        }
    });

    const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]);

    console.log('Total Tools:', tools.length);
    console.log('Null Websites:', nullWebsites);
    console.log('Top Domains:');
    sorted.slice(0, 10).forEach(([domain, count]) => {
        console.log(`${domain}: ${count}`);
    });

    process.exit();
}

checkDomains();
