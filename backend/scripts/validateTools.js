require('dotenv').config({ path: '../.env' }); // Adjust path if running from backend root or scripts dir
const mongoose = require('mongoose');
const axios = require('axios');
const AITool = require('../models/AITool');

// Configuration
const BATCH_SIZE = 5; // Concurrent requests
const TIMEOUT_MS = 10000; // 10 seconds
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Keywords indicative of broken/placeholding sites
const SUSPICIOUS_KEYWORDS = [
    'domain is for sale',
    'buy this domain',
    'parked domain',
    'coming soon',
    'under construction',
    'be back soon',
    'service unavailable',
    '404 not found',
    'page not found'
];

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aidb');
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
}

async function validateTool(tool) {
    const start = Date.now();
    let result = {
        status: 'active',
        statusCode: null,
        errorMessage: null,
        loadTimeMs: 0,
        finalUrl: tool.website,
        issues: []
    };

    if (!tool.website) {
        result.status = 'inactive';
        result.issues.push('No website URL provided');
        return result;
    }

    try {
        // HTTP Check
        const response = await axios.get(tool.website, {
            timeout: TIMEOUT_MS,
            headers: { 'User-Agent': USER_AGENT },
            maxRedirects: 5,
            validateStatus: (status) => true // Don't throw on non-200, we want to handle it
        });

        result.loadTimeMs = Date.now() - start;
        result.statusCode = response.status;
        result.finalUrl = response.request.res.responseUrl || tool.website;

        // 1. Availability Check
        if (response.status >= 500) {
            result.status = 'inactive';
            result.issues.push(`Server Error ${response.status}`);
        } else if (response.status === 404 || response.status === 410) {
            result.status = 'inactive';
            result.issues.push(`Page Not Found ${response.status}`);
        } else if (response.status === 403) {
            // 403 can be tricky (anti-bot), maybe flag as partial or keep active if questionable
            // For now, let's treat persistent 403 as inactive or manual review needed
            result.status = 'partially_working';
            result.issues.push(`Access Forbidden (403) - Potential Geoblock/Anti-bot`);
        } else if (response.status !== 200) {
            result.status = 'partially_working';
            result.issues.push(`Non-200 Status: ${response.status}`);
        }

        // 2. Content Check (Basic usability)
        if (result.status === 'active' || result.status === 'partially_working') {
            const data = (typeof response.data === 'string') ? response.data.toLowerCase() : '';

            // Check for empty body
            if (!data || data.length < 50) {
                result.status = 'inactive';
                result.issues.push('Empty or too short response body');
            } else {
                // Check visually broken / parked keywords
                for (const keyword of SUSPICIOUS_KEYWORDS) {
                    if (data.includes(keyword)) {
                        result.status = 'inactive';
                        result.issues.push(`Suspicious content found: "${keyword}"`);
                        break; // Fail on first match
                    }
                }
            }
        }

    } catch (err) {
        result.loadTimeMs = Date.now() - start;
        result.status = 'inactive';
        result.errorMessage = err.message;

        if (err.code === 'ECONNABORTED') {
            result.issues.push('Timeout (10s limit exceeded)');
        } else if (err.code === 'ENOTFOUND') {
            result.issues.push('DNS Error / Domain not found');
        } else if (err.code === 'ERR_TLS_CERT_ALTNAME_INVALID' || err.code === 'CERT_HAS_EXPIRED') {
            // SSL errors might mean site is risky but "up". Let's flag as inactive/partial.
            result.status = 'inactive';
            result.issues.push(`SSL Error: ${err.message}`);
        } else {
            result.issues.push(`Network Error: ${err.message}`);
        }
    }

    return result;
}

// Process batch of tools
async function processBatch(tools) {
    const validations = tools.map(async (tool) => {
        console.log(`Checking: ${tool.name} (${tool.website})...`);
        const validation = await validateTool(tool);

        // Update DB
        tool.status = validation.status;
        tool.validationDetails = {
            lastChecked: new Date(),
            statusCode: validation.statusCode,
            errorMessage: validation.errorMessage,
            loadTimeMs: validation.loadTimeMs,
            finalUrl: validation.finalUrl,
            issues: validation.issues
        };

        await tool.save();
        return { name: tool.name, ...validation };
    });

    return Promise.all(validations);
}

async function runValidation() {
    await connectDB();

    console.log('🔍 Starting AI Tool Validation Agent...');

    // Get all tools (or filter logic if implemented)
    const totalTools = await AITool.countDocuments();
    console.log(`Found ${totalTools} tools to validate.`);

    let processedCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    let removedList = [];

    // Cursor for batch processing to handle large datasets
    const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : 0;
    const query = AITool.find({});
    if (LIMIT > 0) query.limit(LIMIT);

    const cursor = query.cursor({ batchSize: BATCH_SIZE });

    let batch = [];
    for (let tool = await cursor.next(); tool != null; tool = await cursor.next()) {
        batch.push(tool);

        if (batch.length >= BATCH_SIZE) {
            const results = await processBatch(batch);

            // Stats aggregation
            results.forEach(r => {
                if (r.status === 'active') activeCount++;
                else {
                    inactiveCount++;
                    removedList.push({ name: r.name, reason: r.issues.join(', ') || r.errorMessage });
                }
            });

            processedCount += results.length;
            console.log(`Progress: ${processedCount}/${totalTools}`);
            batch = [];

            // Small delay to be nice to network?
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Process remaining
    if (batch.length > 0) {
        const results = await processBatch(batch);
        results.forEach(r => {
            if (r.status === 'active') activeCount++;
            else {
                inactiveCount++;
                removedList.push({ name: r.name, reason: r.issues.join(', ') || r.errorMessage });
            }
        });
        processedCount += results.length;
    }

    console.log('\n========================================');
    console.log('📊 Validation Report');
    console.log('========================================');
    console.log(`Total Tools Checked: ${processedCount}`);
    console.log(`✅ Active: ${activeCount}`);
    console.log(`❌ Inactive/Removed: ${inactiveCount}`);

    if (removedList.length > 0) {
        console.log('\n🚩 Issues Detected (Inactive/Partially Working):');
        removedList.forEach(item => {
            console.log(`- ${item.name}: ${item.reason}`);
        });
    }

    console.log('\n✨ Validation Complete.');
    process.exit(0);
}

runValidation();
