const express = require('express');
const router = express.Router();
const AITool = require('../models/AITool');

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

        const total = await AITool.countDocuments(query);
        const tools = await AITool.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit)
            .select('name category description website growth launchDate'); // Optimize fields

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
        const categories = await AITool.distinct('category');
        res.json(categories.sort());
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
