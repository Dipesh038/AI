const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CountryToolPopularity = require('../models/CountryToolPopularity');
const ToolGrowthStats = require('../models/ToolGrowthStats');
const AITool = require('../models/AITool');
const NodeCache = require('node-cache');
const analyticsCache = new NodeCache({ stdTTL: 300 }); // 5 minutes TTL

// Helper for cache keys
const getCacheKey = (req) => `${req.baseUrl}${req.path}?${new URLSearchParams(req.query).toString()}`;

// @desc    Get Category Distribution Stats
// @route   GET /api/analytics/categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = parseInt(year) || 2025;

        // Cache Check
        const cacheKey = `categories_${targetYear}`;
        const cached = analyticsCache.get(cacheKey);
        if (cached) return res.json(cached);

        const startDate = new Date(`${targetYear}-01-01`);
        const endDate = new Date(`${targetYear + 1}-01-01`);

        const stats = await AITool.aggregate([
            {
                $match: {
                    launchDate: { $gte: startDate, $lt: endDate }
                }
            },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const formattedStats = stats.map(s => ({ name: s._id, value: s.count }));

        analyticsCache.set(cacheKey, formattedStats, 600); // 10 mins
        res.json(formattedStats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get distinct countries available in popularity data
// @route   GET /api/analytics/popularity/countries
// @access  Private/Admin
router.get('/popularity/countries', protect, async (req, res) => {
    try {
        const key = 'popularity_countries';
        const cached = analyticsCache.get(key);
        if (cached) return res.json(cached);

        const countries = await CountryToolPopularity.distinct('country');
        const result = countries.sort().map(c => ({ country: c, _id: c }));

        analyticsCache.set(key, result, 600); // Cache for 10 mins
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get Tool Popularity Data
// @route   GET /api/analytics/popularity
// @access  Public (or semi-private depending on needs, but usually public for dashboard)
router.get('/popularity', async (req, res) => {
    try {
        const { country, year, limit, page } = req.query;

        // Cache Check
        const cacheKey = getCacheKey(req);
        const cached = analyticsCache.get(cacheKey);
        if (cached) return res.json(cached);

        let query = {};
        if (country) query.country = country;
        if (year) query.year = parseInt(year);

        const limitVal = parseInt(limit) || 20; // Default limit 20
        const pageVal = parseInt(page) || 1;
        const skip = (pageVal - 1) * limitVal;

        const data = await CountryToolPopularity.find(query)
            .sort({ popularity: -1 })
            .skip(skip)
            .limit(limitVal)
            .select('toolName popularity country year');

        analyticsCache.set(cacheKey, data);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add/Update Tool Popularity
// @route   POST /api/analytics/popularity
// @access  Private/Admin
router.post('/popularity', protect, async (req, res) => {
    try {
        const { country, year, toolName, popularity } = req.body;

        // Validation
        if (!country || !year || !toolName || popularity === undefined) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (popularity < 0 || popularity > 100) {
            return res.status(400).json({ message: 'Popularity must be between 0 and 100' });
        }

        const record = await CountryToolPopularity.findOneAndUpdate(
            { country, year, toolName },
            {
                country,
                year,
                toolName,
                popularity,
                lastUpdated: Date.now()
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete Tool Popularity Record
// @route   DELETE /api/analytics/popularity/:id
// @access  Private/Admin
router.delete('/popularity/:id', protect, async (req, res) => {
    try {
        const record = await CountryToolPopularity.findById(req.params.id);
        if (record) {
            await record.deleteOne();
            res.json({ message: 'Record removed' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get Tool Growth Data
// @route   GET /api/analytics/growth
// @access  Public
router.get('/growth', async (req, res) => {
    try {
        const { year, limit } = req.query;

        // Cache Check
        const cacheKey = getCacheKey(req);
        const cached = analyticsCache.get(cacheKey);
        if (cached) return res.json(cached);

        let query = {};
        if (year) query.year = parseInt(year);

        const limitVal = parseInt(limit) || 10; // Default limit 10

        const data = await ToolGrowthStats.find(query)
            .sort({ growthPercent: -1 })
            .limit(limitVal)
            .select('toolName category year growthPercent rank');

        analyticsCache.set(cacheKey, data);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add/Update Tool Growth
// @route   POST /api/analytics/growth
// @access  Private/Admin
router.post('/growth', protect, async (req, res) => {
    try {
        const { toolName, category, year, growthPercent, rank } = req.body;

        // Validation
        if (!toolName || !category || !year || growthPercent === undefined) {
            return res.status(400).json({ message: 'Tool Name, Category, Year, and Growth % are required' });
        }

        const updateData = {
            toolName,
            category,
            year,
            growthPercent,
            lastUpdated: Date.now()
        };

        if (rank !== undefined) updateData.rank = rank;

        const record = await ToolGrowthStats.findOneAndUpdate(
            { toolName, year },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );

        res.json(record);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete Tool Growth Record
// @route   DELETE /api/analytics/growth/:id
// @access  Private/Admin
router.delete('/growth/:id', protect, async (req, res) => {
    try {
        const record = await ToolGrowthStats.findById(req.params.id);
        if (record) {
            await record.deleteOne();
            res.json({ message: 'Record removed' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
