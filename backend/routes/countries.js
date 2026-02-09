const express = require('express');
const router = express.Router();
const CountryUsage = require('../models/CountryUsage');

// @desc    Get all countries with usage data
// @route   GET /api/countries
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Return only country names and ids for the list, lighter payload
        const countries = await CountryUsage.find({}, 'country aiIndexScore lastUpdated');
        res.json(countries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get usage data for specific country
// @route   GET /api/country/:countryName
// @access  Public
router.get('/:countryName', async (req, res) => {
    try {
        const countryData = await CountryUsage.findOne({
            country: { $regex: new RegExp(`^${req.params.countryName}$`, 'i') }
        });

        if (!countryData) {
            return res.status(404).json({ message: 'Country data not found' });
        }

        res.json(countryData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
