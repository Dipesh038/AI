const express = require('express');
const router = express.Router();
const CountryUsage = require('../models/CountryUsage');
const NodeCache = require('node-cache');
const countryCache = new NodeCache({ stdTTL: 600 }); // 10 min TTL

// @desc    Get all countries with usage data
// @route   GET /api/countries
// @access  Public
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'countries_list';
        const cached = countryCache.get(cacheKey);
        if (cached) return res.json(cached);

        const countries = await CountryUsage.find({}, 'country aiIndexScore lastUpdated').lean();

        countryCache.set(cacheKey, countries);
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
        const cacheKey = `country_${req.params.countryName.toLowerCase()}`;
        const cached = countryCache.get(cacheKey);
        if (cached) return res.json(cached);

        const countryData = await CountryUsage.findOne({
            country: { $regex: new RegExp(`^${req.params.countryName}$`, 'i') }
        }).lean();

        if (!countryData) {
            return res.status(404).json({ message: 'Country data not found' });
        }

        countryCache.set(cacheKey, countryData, 300); // 5 min TTL
        res.json(countryData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
