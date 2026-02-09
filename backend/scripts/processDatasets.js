const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const DATA_DIR = path.join(__dirname, '../../datasets/raw');
const OUTPUT_FILE = path.join(__dirname, 'processedData.json');

// Helper to read CSV
const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            console.warn(`Warning: Dataset not found at ${filePath}`);
            resolve([]);
            return;
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

const processDatasets = async () => {
    console.log('Processing datasets...');

    // Define file names based on user provided files
    // Note: Filename for Complete AI Tools is long, handling based on partial match or explicit name
    const toolFiles = fs.readdirSync(DATA_DIR).filter(f => f.includes('Complete AI Tools'));
    const toolFile = toolFiles.length > 0 ? path.join(DATA_DIR, toolFiles[0]) : path.join(DATA_DIR, 'ai_toolbuzz.csv');

    const files = {
        topTools: path.join(DATA_DIR, 'top_ai_tools.csv'), // Fallback / supplementary
        aiIndex: path.join(DATA_DIR, 'AI_index_db.csv'),
        toolBuzz: toolFile
    };

    try {
        const [topTools, aiIndex, toolBuzz] = await Promise.all([
            readCSV(files.topTools),
            readCSV(files.aiIndex),
            readCSV(files.toolBuzz)
        ]);

        const processedData = {
            tools: [],
            countries: []
        };

        // --- Process Tools from "Complete AI Tools Dataset" ---
        // ... (existing tool processing logic remains mostly same, just adding growth)

        const processTool = (t) => {
            const nameKey = Object.keys(t).find(k => k.trim().replace(/^\uFEFF/, '') === 'Name' || k === 'ToolName');
            const descriptionKey = Object.keys(t).find(k => k.includes('Description'));
            const yearKey = Object.keys(t).find(k => k.includes('Year'));
            const websiteKey = Object.keys(t).find(k => k.includes('Website') || k.includes('Link'));

            let name = t[nameKey];
            if (name && name.trim() === 'Google Bard') name = 'Google Gemini';

            return {
                name: name,
                category: t.Category || 'General',
                description: t[descriptionKey] || 'No description available',
                website: t[websiteKey] || '',
                // Simulate Year-Over-Year Growth (-10% to +100%)
                growth: Math.floor(Math.random() * 110) - 10,

                // Use parsed date or simulate one for better distribution visualization
                launchDate: t[yearKey] ? new Date(`${t[yearKey]}-01-01`) : new Date(`${2022 + Math.floor(Math.random() * 4)}-01-01`)
            };
        };

        if (toolBuzz.length > 0) {
            console.log(`Found ${toolBuzz.length} tools in Complete Dataset.`);
            const validTools = toolBuzz
                .filter(t => {
                    const nameKey = Object.keys(t).find(k => k.trim().replace(/^\uFEFF/, '') === 'Name' || k === 'ToolName');
                    const name = nameKey ? t[nameKey] : null;
                    return name && name.trim() !== '';
                });

            processedData.tools = validTools.map(processTool);
        } else if (topTools.length > 0) {
            // ... (fallback logic similar to above)
            processedData.tools = topTools.map(processTool); // usage of helper
        }
        // ... (mock fallback)

        // --- Process Countries from "AI_index_db.csv" ---
        if (aiIndex.length > 0) {
            console.log(`Found ${aiIndex.length} countries in AI Index.`);
            const toolsForGraph = processedData.tools.slice(0, 20);

            // Parse and sort countries by AI Index Score (descending) to calculate ranks
            const countriesWithScores = aiIndex.map(c => ({
                country: c.Country,
                score: parseFloat(c['Total score']) || 0,
                rawRank: parseInt(c['Rank']) || null
            }))
                .filter(c => c.country && c.country.trim() !== '') // Filter out empty country names
                .sort((a, b) => b.score - a.score); // Sort by score descending

            // Assign ranks based on sorted order
            processedData.countries = countriesWithScores.map((c, index) => {
                const score = c.score;
                const rank = index + 1; // Rank starts at 1

                let adoptionLevel = 'Low';
                if (score > 60) adoptionLevel = 'High';
                else if (score > 40) adoptionLevel = 'Medium';

                return {
                    country: c.country,
                    year: 2024,
                    aiIndexScore: score,
                    globalRank: rank,
                    adoptionLevel: adoptionLevel,
                    tools: toolsForGraph.map(t => ({
                        name: t.name,
                        usage: Math.min(100, Math.max(0, Math.floor(score + (Math.random() * 40 - 20))))
                    }))
                };
            });
        } else {
            // Fallback mock countries
            console.log('No AI Index data found. Using mock countries.');
            const toolNames = processedData.tools.slice(0, 5).map(t => t.name);
            processedData.countries = [
                { country: 'United States', year: 2024, tools: toolNames.map(t => ({ name: t, usage: 85 })) },
                { country: 'India', year: 2024, tools: toolNames.map(t => ({ name: t, usage: 75 })) }
            ];
        }

        return processedData;

    } catch (error) {
        console.error('Error processing datasets:', error);
        return null;
    }
};

module.exports = { processDatasets };

// Allow direct execution
if (require.main === module) {
    processDatasets().then(data => {
        if (data) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
            console.log(`Processed data saved to ${OUTPUT_FILE}`);
        }
    });
}
