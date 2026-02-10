const express = require('express');
const router = express.Router();
const AITool = require('../models/AITool');
const NodeCache = require('node-cache');
const toolsCache = new NodeCache({ stdTTL: 600 }); // 10 min TTL

// @desc    Get all AI tools
// @route   GET /api/tools
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const category = req.query.category || '';

        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        // Parallel execution of count + find
        const [total, tools] = await Promise.all([
            AITool.countDocuments(query),
            AITool.find(query)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .select('name category description website growth launchDate')
                .lean()
        ]);

        res.json({
            tools,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTools: total
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all unique categories
// @route   GET /api/tools/categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const cacheKey = 'tool_categories';
        const cached = toolsCache.get(cacheKey);
        if (cached) return res.json(cached);

        const categories = await AITool.distinct('category');
        const sorted = categories.sort();

        toolsCache.set(cacheKey, sorted);
        res.json(sorted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
