const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const AITool = require('../models/AITool');
const Category = require('../models/Category');
const CountryUsage = require('../models/CountryUsage');
const { protect } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });
};

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await admin.matchPassword(password))) {
            res.json({
                _id: admin._id,
                email: admin.email,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all stats (Tools count, Categories count, etc.)
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, async (req, res) => {
    try {
        const [toolsCount, categoriesCount, countriesCount] = await Promise.all([
            AITool.countDocuments(),
            Category.countDocuments(),
            CountryUsage.countDocuments()
        ]);

        res.json({
            toolsCount,
            categoriesCount,
            countriesCount
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all AI tools (Admin view)
// @route   GET /api/admin/tools
// @access  Private/Admin
router.get('/tools', protect, async (req, res) => {
    try {
        const tools = await AITool.find().sort({ createdAt: -1 }).lean();
        res.json(tools);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add new AI tool
// @route   POST /api/admin/add-tool
// @access  Private/Admin
router.post('/add-tool', protect, async (req, res) => {
    try {
        const { name, description, category, website, launchDate, isPublished } = req.body;

        const toolExists = await AITool.findOne({ name });
        if (toolExists) {
            return res.status(400).json({ message: 'Tool already exists' });
        }

        const tool = await AITool.create({
            name,
            description,
            category,
            website,
            category,
            website,
            launchDate,
            isPublished
        });

        res.status(201).json(tool);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Update AI tool
// @route   PUT /api/admin/update-tool/:id
// @access  Private/Admin
router.put('/update-tool/:id', protect, async (req, res) => {
    try {
        const tool = await AITool.findById(req.params.id);

        if (tool) {
            tool.name = req.body.name || tool.name;
            tool.description = req.body.description || tool.description;
            tool.category = req.body.category || tool.category;
            tool.website = req.body.website || tool.website;
            tool.launchDate = req.body.launchDate || tool.launchDate;
            if (req.body.isPublished !== undefined) {
                tool.isPublished = req.body.isPublished;
            }

            const updatedTool = await tool.save();
            res.json(updatedTool);
        } else {
            res.status(404).json({ message: 'Tool not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete AI tool
// @route   DELETE /api/admin/delete-tool/:id
// @access  Private/Admin
router.delete('/delete-tool/:id', protect, async (req, res) => {
    try {
        const tool = await AITool.findById(req.params.id);

        if (tool) {
            await tool.deleteOne();
            res.json({ message: 'Tool removed' });
        } else {
            res.status(404).json({ message: 'Tool not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private/Admin
router.get('/categories', protect, async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add new category
// @route   POST /api/admin/add-category
// @access  Private/Admin
router.post('/add-category', protect, async (req, res) => {
    try {
        const { name, description } = req.body;

        const categoryExists = await Category.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            description
        });

        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Update category
// @route   PUT /api/admin/update-category/:id
// @access  Private/Admin
router.put('/update-category/:id', protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            category.name = req.body.name || category.name;
            category.description = req.body.description || category.description;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete category
// @route   DELETE /api/admin/delete-category/:id
// @access  Private/Admin
router.delete('/delete-category/:id', protect, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get all country data
// @route   GET /api/admin/countries
// @access  Private/Admin
router.get('/countries', protect, async (req, res) => {
    try {
        const countries = await CountryUsage.find().sort({ country: 1 }).lean();
        res.json(countries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Delete country data
// @route   DELETE /api/admin/delete-country/:id
// @access  Private/Admin
router.delete('/delete-country/:id', protect, async (req, res) => {
    try {
        const country = await CountryUsage.findById(req.params.id);

        if (country) {
            await country.deleteOne();
            res.json({ message: 'Country data removed' });
        } else {
            res.status(404).json({ message: 'Country not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Add or Update country data
// @route   POST /api/admin/add-country-data
// @access  Private/Admin
router.post('/add-country-data', protect, async (req, res) => {
    try {
        const { country, year, tools } = req.body;

        let countryData = await CountryUsage.findOne({ country });

        if (countryData) {
            // Update existing
            countryData.year = year;
            countryData.tools = tools;
            countryData.lastUpdated = Date.now();
            await countryData.save();
            res.json(countryData);
        } else {
            // Create new
            const newCountryData = await CountryUsage.create({
                country,
                year,
                tools
            });
            res.status(201).json(newCountryData);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
