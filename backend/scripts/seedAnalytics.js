const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const CountryToolPopularity = require('../models/CountryToolPopularity');
const ToolGrowthStats = require('../models/ToolGrowthStats');
const { processDatasets } = require('./processDatasets');

dotenv.config({ path: path.join(__dirname, '../.env') });
connectDB();

const seedAnalytics = async () => {
    try {
        console.log('Processing datasets for analytics...');
        const data = await processDatasets();

        if (!data) {
            console.error('Failed to process data');
            process.exit(1);
        }

        console.log('Clearing existing analytics data...');
        await CountryToolPopularity.deleteMany({});
        await ToolGrowthStats.deleteMany({});

        // 1. Populate CountryToolPopularity
        console.log('Seeding Country Tool Popularity...');
        const popularityRecords = [];
        const countries = data.countries || [];

        for (const country of countries) {
            if (country.tools && Array.isArray(country.tools)) {
                for (const tool of country.tools) {
                    // 2024
                    popularityRecords.push({
                        country: country.country,
                        year: 2024,
                        toolName: tool.name,
                        popularity: tool.usage
                    });

                    // 2025 (Simulated)
                    let usage2025 = tool.usage + (Math.floor(Math.random() * 10) - 5); // +/- 5%
                    usage2025 = Math.min(100, Math.max(0, usage2025));

                    popularityRecords.push({
                        country: country.country,
                        year: 2025,
                        toolName: tool.name,
                        popularity: usage2025
                    });
                }
            }
        }

        // Batch insert for performance
        if (popularityRecords.length > 0) {
            await CountryToolPopularity.insertMany(popularityRecords);
            console.log(`Inserted ${popularityRecords.length} popularity records.`);
        }

        // 2. Populate ToolGrowthStats
        console.log('Seeding Tool Growth Stats...');
        const growthRecords = [];
        const tools = data.tools || [];

        // Deduplicate tools by name
        const uniqueTools = Array.from(new Map(tools.map(item => [item.name, item])).values());

        // Sort tools by growth to assign rank
        const sortedTools = uniqueTools.sort((a, b) => (b.growth || 0) - (a.growth || 0));

        sortedTools.forEach((tool, index) => {
            // 2024 Data
            growthRecords.push({
                toolName: tool.name,
                category: tool.category,
                year: 2024,
                growthPercent: tool.growth || 0,
                rank: index + 1
            });

            // 2025 Data (Simulated variation)
            // Shift rank slightly or keep similar for simplicity
            // Let's randomize growth slightly for 2025
            const growth2025 = Math.floor((tool.growth || 0) * (0.8 + Math.random() * 0.4));

            growthRecords.push({
                toolName: tool.name,
                category: tool.category,
                year: 2025,
                growthPercent: growth2025,
                rank: index + 1 // Keep rank logic simple or resort if needed, but for now reuse index implies similar ranking
            });
        });

        if (growthRecords.length > 0) {
            await ToolGrowthStats.insertMany(growthRecords);
            console.log(`Inserted ${growthRecords.length} growth stats.`);
        }

        console.log('Analytics data seeded successfully from datasets.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAnalytics();
