const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

const measure = async (name, fn) => {
    const start = Date.now();
    try {
        const res = await fn();
        const duration = Date.now() - start;
        console.log(`[${name}] Status: ${res.status}, Time: ${duration}ms, Items: ${Array.isArray(res.data) ? res.data.length : 'N/A'}`);
        return duration;
    } catch (err) {
        console.error(`[${name}] Failed:`, err.message);
        return -1;
    }
};

const checkPerformance = async () => {
    console.log('--- Performance Verification ---');

    // 1. Paginated Tools
    await measure('GET /tools (Limit 20)', () => axios.get(`${BASE_URL}/tools?limit=20`));

    // 2. Popularity (Cached)
    // First call (cache miss)
    await measure('GET /analytics/popularity (Miss)', () => axios.get(`${BASE_URL}/analytics/popularity?country=India&year=2024&limit=10`));
    // Second call (cache hit)
    await measure('GET /analytics/popularity (Hit)', () => axios.get(`${BASE_URL}/analytics/popularity?country=India&year=2024&limit=10`));

    // 3. Growth (Cached)
    await measure('GET /analytics/growth (Miss)', () => axios.get(`${BASE_URL}/analytics/growth?year=2024&limit=5`));
    await measure('GET /analytics/growth (Hit)', () => axios.get(`${BASE_URL}/analytics/growth?year=2024&limit=5`));

    // 4. Categories (Cached Aggregation)
    await measure('GET /analytics/categories (Miss)', () => axios.get(`${BASE_URL}/analytics/categories?year=2025`));
    await measure('GET /analytics/categories (Hit)', () => axios.get(`${BASE_URL}/analytics/categories?year=2025`));
};

setTimeout(checkPerformance, 2000); // Wait for server to be ready if needed
