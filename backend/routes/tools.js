const express = require('express');
const router = express.Router();
const AITool = require('../models/AITool');
const NodeCache = require('node-cache');
const toolsCache = new NodeCache({ stdTTL: 600 }); // 10 min TTL

// @desc    Get trending AI tools (top by growth %)
// @route   GET /api/tools/trending
// @access  Public
router.get('/trending', async (req, res) => {
    try {
        const cacheKey = 'tools_trending';
        const cached = toolsCache.get(cacheKey);
        if (cached) return res.json(cached);

        const tools = await AITool.find({ growth: { $gt: 0 }, isPublished: true })
            .sort({ growth: -1 })
            .limit(10)
            .select('name category description website growth image')
            .lean();

        toolsCache.set(cacheKey, tools);
        res.json(tools);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
        const sort = req.query.sort || 'name'; // name | growth | newest

        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        // Build sort object
        let sortObj = {};
        if (sort === 'growth') sortObj = { growth: -1 };
        else if (sort === 'newest') sortObj = { launchDate: -1 };
        else sortObj = { name: 1 };

        // Parallel execution of count + find
        const [total, tools] = await Promise.all([
            AITool.countDocuments(query),
            AITool.find(query)
                .sort(sortObj)
                .skip(skip)
                .limit(limit)
                .select('name category description website growth launchDate image')
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
