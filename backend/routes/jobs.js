const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const NodeCache = require('node-cache');

const router = express.Router();
const jobsCache = new NodeCache({ stdTTL: 600 }); // 10 minutes
const DATASET_DIR = path.resolve(__dirname, '../../datasets/raw');

const REQUIRED_COLUMNS = [
    'job_title',
    'salary_usd',
    'experience_level',
    'job_category',
    'company_location',
    'remote_ratio',
    'required_skills',
    'education_required'
];

const fallbackJobs = [
    { job_title: 'AI Engineer', salary_usd: 142000, experience_level: 'Mid', job_category: 'Engineering', company_location: 'United States', remote_ratio: 50, required_skills: 'Python, Machine Learning, Docker, AWS', education_required: "Bachelor's Degree", company_size: 'Enterprise', posted_date: '2025-01-14' },
    { job_title: 'AI Engineer', salary_usd: 168000, experience_level: 'Senior', job_category: 'Engineering', company_location: 'Canada', remote_ratio: 100, required_skills: 'Python, MLOps, Kubernetes, TensorFlow', education_required: "Master's Degree", company_size: 'Large', posted_date: '2025-02-03' },
    { job_title: 'Data Scientist', salary_usd: 131000, experience_level: 'Mid', job_category: 'Data Science', company_location: 'Germany', remote_ratio: 50, required_skills: 'Python, SQL, Statistics, Scikit-learn', education_required: "Master's Degree", company_size: 'Medium', posted_date: '2025-02-12' },
    { job_title: 'Data Scientist', salary_usd: 118000, experience_level: 'Entry', job_category: 'Data Science', company_location: 'India', remote_ratio: 0, required_skills: 'Python, SQL, Data Visualization, Pandas', education_required: "Bachelor's Degree", company_size: 'Large', posted_date: '2025-03-01' },
    { job_title: 'Machine Learning Engineer', salary_usd: 158000, experience_level: 'Senior', job_category: 'Machine Learning', company_location: 'United States', remote_ratio: 100, required_skills: 'Python, TensorFlow, PyTorch, MLOps', education_required: "Master's Degree", company_size: 'Enterprise', posted_date: '2025-03-20' },
    { job_title: 'Machine Learning Engineer', salary_usd: 136000, experience_level: 'Mid', job_category: 'Machine Learning', company_location: 'United Kingdom', remote_ratio: 50, required_skills: 'Python, PyTorch, Feature Engineering, Git', education_required: "Bachelor's Degree", company_size: 'Medium', posted_date: '2025-04-07' },
    { job_title: 'AI Product Manager', salary_usd: 154000, experience_level: 'Senior', job_category: 'Product', company_location: 'United States', remote_ratio: 0, required_skills: 'Product Strategy, AI Fundamentals, Stakeholder Management, SQL', education_required: "Bachelor's Degree", company_size: 'Large', posted_date: '2025-04-29' },
    { job_title: 'AI Product Analyst', salary_usd: 112000, experience_level: 'Entry', job_category: 'Product', company_location: 'Singapore', remote_ratio: 50, required_skills: 'SQL, Analytics, Experimentation, Python', education_required: "Bachelor's Degree", company_size: 'Medium', posted_date: '2025-05-09' },
    { job_title: 'Computer Vision Engineer', salary_usd: 149000, experience_level: 'Mid', job_category: 'Research', company_location: 'France', remote_ratio: 50, required_skills: 'Python, OpenCV, Deep Learning, C++', education_required: "Master's Degree", company_size: 'Small', posted_date: '2025-05-25' },
    { job_title: 'NLP Engineer', salary_usd: 151000, experience_level: 'Senior', job_category: 'Research', company_location: 'United States', remote_ratio: 100, required_skills: 'Python, NLP, Transformers, PyTorch', education_required: 'PhD', company_size: 'Enterprise', posted_date: '2025-06-11' },
    { job_title: 'AI Research Scientist', salary_usd: 176000, experience_level: 'Executive', job_category: 'Research', company_location: 'Switzerland', remote_ratio: 0, required_skills: 'Deep Learning, Research Methods, Python, Papers', education_required: 'PhD', company_size: 'Enterprise', posted_date: '2025-06-28' },
    { job_title: 'Data Engineer (AI Platform)', salary_usd: 139000, experience_level: 'Mid', job_category: 'Engineering', company_location: 'Netherlands', remote_ratio: 50, required_skills: 'Python, Spark, SQL, Airflow', education_required: "Bachelor's Degree", company_size: 'Large', posted_date: '2025-07-16' },
    { job_title: 'Prompt Engineer', salary_usd: 121000, experience_level: 'Entry', job_category: 'Applied AI', company_location: 'Australia', remote_ratio: 100, required_skills: 'Prompt Design, LLMs, Python, Communication', education_required: "Bachelor's Degree", company_size: 'Small', posted_date: '2025-08-02' },
    { job_title: 'LLM Application Developer', salary_usd: 146000, experience_level: 'Mid', job_category: 'Applied AI', company_location: 'United States', remote_ratio: 100, required_skills: 'Python, APIs, LangChain, Vector Databases', education_required: "Bachelor's Degree", company_size: 'Medium', posted_date: '2025-08-17' },
    { job_title: 'AI Solutions Architect', salary_usd: 170000, experience_level: 'Senior', job_category: 'Architecture', company_location: 'United States', remote_ratio: 50, required_skills: 'Cloud, System Design, MLOps, Security', education_required: "Bachelor's Degree", company_size: 'Enterprise', posted_date: '2025-09-05' },
    { job_title: 'Responsible AI Specialist', salary_usd: 128000, experience_level: 'Mid', job_category: 'Governance', company_location: 'Ireland', remote_ratio: 0, required_skills: 'AI Ethics, Risk Assessment, Compliance, Communication', education_required: "Master's Degree", company_size: 'Large', posted_date: '2025-09-26' }
];

const educationOrder = [
    { label: 'High School', pattern: /(high school|secondary|diploma)/i, rank: 1 },
    { label: "Associate's Degree", pattern: /(associate)/i, rank: 2 },
    { label: "Bachelor's Degree", pattern: /(bachelor|undergrad|bs|ba)/i, rank: 3 },
    { label: "Master's Degree", pattern: /(master|ms|ma|mba)/i, rank: 4 },
    { label: 'PhD', pattern: /(phd|doctorate)/i, rank: 5 }
];

const experienceOrder = ['Entry', 'Mid', 'Senior', 'Executive'];

const skillCaseMap = new Map([
    ['ai', 'AI'],
    ['api', 'API'],
    ['apis', 'APIs'],
    ['aws', 'AWS'],
    ['ci/cd', 'CI/CD'],
    ['gcp', 'GCP'],
    ['llm', 'LLM'],
    ['llms', 'LLMs'],
    ['langchain', 'LangChain'],
    ['ml', 'ML'],
    ['mlops', 'MLOps'],
    ['nlp', 'NLP'],
    ['opencv', 'OpenCV'],
    ['pytorch', 'PyTorch'],
    ['sql', 'SQL'],
    ['tensorflow', 'TensorFlow']
]);

let jobsData = null;
let jobsDataSource = 'sample:fallback';
let loadingPromise = null;

const normalizeHeader = (value = '') =>
    value
        .toLowerCase()
        .trim()
        .replace(/^"+|"+$/g, '')
        .replace(/[^\w]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseSalary = (row) => {
    const salaryKeys = [
        'salary_usd',
        'salary_in_usd',
        'normalized_salary_usd',
        'salary_usd_normalized'
    ];

    for (const key of salaryKeys) {
        const parsed = parseNumber(row[key]);
        if (Number.isFinite(parsed)) return parsed;
    }

    return null;
};

const toTitleCase = (value = '') =>
    value
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

const parseSkills = (value) => {
    if (!value) return [];

    return String(value)
        .replace(/[\[\]"]/g, '')
        .split(/[,;|/]/)
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => {
            const normalized = skill.toLowerCase();
            if (skillCaseMap.has(normalized)) return skillCaseMap.get(normalized);
            if (/[A-Z].*[a-z]|[a-z].*[A-Z]/.test(skill)) return skill;
            if (/^[A-Z0-9+\-#]+$/.test(skill)) return skill;
            if (skill.length <= 3) return skill.toUpperCase();
            return toTitleCase(skill);
        });
};

const normalizeEducation = (value = '') => {
    const text = String(value).trim();
    if (!text) return { label: 'Not specified', rank: 999 };

    const found = educationOrder.find((entry) => entry.pattern.test(text));
    return found ? { label: found.label, rank: found.rank } : { label: text, rank: 900 };
};

const getMinimumEducation = (records) => {
    const educationValues = records.map((row) => normalizeEducation(row.education_required));
    if (!educationValues.length) return 'Not specified';
    educationValues.sort((a, b) => a.rank - b.rank);
    return educationValues[0].label;
};

const normalizeExperienceLevel = (value = '') => {
    const text = String(value).trim().toLowerCase();
    if (!text) return 'Not specified';

    if (['en', 'entry', 'junior', 'jr', 'intern', 'new grad', 'entry-level'].includes(text) || /(entry|junior|intern)/.test(text)) {
        return 'Entry';
    }

    if (['mi', 'mid', 'intermediate', 'associate', 'mid-level'].includes(text) || /(mid|intermediate|associate)/.test(text)) {
        return 'Mid';
    }

    if (['se', 'senior', 'lead', 'principal', 'staff'].includes(text) || /(senior|lead|principal|staff)/.test(text)) {
        return 'Senior';
    }

    if (['ex', 'executive', 'director', 'vp', 'cxo', 'chief', 'head'].includes(text) || /(executive|director|vp|chief|head)/.test(text)) {
        return 'Executive';
    }

    return toTitleCase(text);
};

const normalizeRemoteBucket = (value) => {
    const text = String(value ?? '').trim().toLowerCase();
    const asNumber = Number(text.replace('%', ''));

    if (Number.isFinite(asNumber)) {
        if (asNumber === 100) return 'Remote';
        if (asNumber === 0) return 'On-site';
        return 'Hybrid';
    }

    if (text.includes('remote')) return 'Remote';
    if (text.includes('on-site') || text.includes('onsite') || text.includes('office')) return 'On-site';
    if (text.includes('hybrid')) return 'Hybrid';
    return 'Hybrid';
};

const normalizeCompanySize = (value) => {
    const text = String(value || '').trim().toLowerCase();
    if (!text) return 'Unknown';

    if (text === 's') return 'Small';
    if (text === 'm') return 'Medium';
    if (text === 'l') return 'Large';

    const num = parseNumber(text);
    if (Number.isFinite(num)) {
        if (num <= 50) return 'Small';
        if (num <= 250) return 'Medium';
        if (num <= 1000) return 'Large';
        return 'Enterprise';
    }

    if (text.includes('startup') || text.includes('small')) return 'Small';
    if (text.includes('medium')) return 'Medium';
    if (text.includes('large')) return 'Large';
    if (text.includes('enterprise') || text.includes('global')) return 'Enterprise';

    return toTitleCase(text);
};

const parsePostedDate = (row) => {
    const dateKeys = [
        'posted_date',
        'date_posted',
        'job_posted_date',
        'posting_date',
        'posted_at',
        'date',
        'work_year'
    ];

    for (const key of dateKeys) {
        const raw = row[key];
        if (raw === undefined || raw === null || raw === '') continue;
        const text = String(raw).trim();
        if (!text) continue;

        if (/^\d{4}$/.test(text)) {
            return new Date(`${text}-01-01T00:00:00.000Z`);
        }

        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
};

const getField = (row, keys, fallback = '') => {
    for (const key of keys) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return String(value).trim();
        }
    }
    return fallback;
};

const normalizeRow = (row, rowId) => {
    const jobTitle = getField(row, ['job_title', 'title', 'role']);
    if (!jobTitle) return null;

    const postedDate = parsePostedDate(row);
    const salaryCurrency = getField(row, ['salary_currency', 'currency', 'pay_currency'], 'USD').toUpperCase();
    const companySize = normalizeCompanySize(getField(row, ['company_size', 'company_size_bucket', 'company_employees', 'org_size'], ''));

    return {
        id: rowId,
        job_title: jobTitle,
        salary_usd: parseSalary(row),
        salary_currency: salaryCurrency,
        experience_level: normalizeExperienceLevel(getField(row, ['experience_level', 'experience', 'seniority'], 'Not specified')),
        job_category: getField(row, ['job_category', 'category', 'job_family'], 'Other'),
        company_location: getField(row, ['company_location', 'location', 'country'], 'Unknown'),
        company_size: companySize,
        remote_ratio: row.remote_ratio ?? row.remote_type ?? '',
        required_skills: parseSkills(getField(row, ['required_skills', 'skills', 'skill_set'], '')),
        education_required: getField(row, ['education_required', 'education', 'min_education'], 'Not specified'),
        posted_date: postedDate ? postedDate.toISOString() : null
    };
};

const findJobsDataset = () => {
    if (!fs.existsSync(DATASET_DIR)) return null;

    const files = fs
        .readdirSync(DATASET_DIR)
        .filter((file) => file.toLowerCase().endsWith('.csv'))
        .sort();

    for (const file of files) {
        const filePath = path.join(DATASET_DIR, file);
        try {
            const firstLine = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)[0] || '';
            const headers = firstLine.split(',').map(normalizeHeader);
            const hasRequiredColumns = REQUIRED_COLUMNS.every((col) => headers.includes(col));
            if (hasRequiredColumns) return filePath;
        } catch (err) {
            // Skip unreadable file and continue searching.
        }
    }

    return null;
};

const parseCsvDataset = (filePath) =>
    new Promise((resolve, reject) => {
        const rows = [];
        let rowCounter = 0;

        fs.createReadStream(filePath)
            .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
            .on('data', (row) => {
                rowCounter += 1;
                const normalized = normalizeRow(row, rowCounter);
                if (normalized) rows.push(normalized);
            })
            .on('end', () => resolve(rows))
            .on('error', (error) => reject(error));
    });

const loadJobsData = async () => {
    if (jobsData) return { rows: jobsData, source: jobsDataSource };
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        const datasetFile = findJobsDataset();

        if (datasetFile) {
            try {
                const parsedRows = await parseCsvDataset(datasetFile);
                if (parsedRows.length) {
                    jobsData = parsedRows;
                    jobsDataSource = `csv:${path.basename(datasetFile)}`;
                    return { rows: jobsData, source: jobsDataSource };
                }
            } catch (err) {
                console.error(`Failed to parse jobs dataset: ${err.message}`);
            }
        }

        jobsData = fallbackJobs
            .map((row, index) => normalizeRow(row, index + 1))
            .filter(Boolean);
        jobsDataSource = 'sample:fallback';
        return { rows: jobsData, source: jobsDataSource };
    })();

    try {
        return await loadingPromise;
    } finally {
        loadingPromise = null;
    }
};

const filterRows = (rows, query) => {
    const titleQuery = String(query.job_title || '').trim().toLowerCase();
    const experienceQuery = String(query.experience_level || '').trim().toLowerCase();
    const countryQuery = String(query.country || '').trim().toLowerCase();

    return rows.filter((row) => {
        const titleMatch =
            !titleQuery ||
            row.job_title.toLowerCase().includes(titleQuery) ||
            row.company_location.toLowerCase().includes(titleQuery);
        const experienceMatch =
            !experienceQuery ||
            experienceQuery === 'all' ||
            row.experience_level.toLowerCase() === experienceQuery;
        const countryMatch =
            !countryQuery ||
            countryQuery === 'all' ||
            row.company_location.toLowerCase() === countryQuery;
        return titleMatch && experienceMatch && countryMatch;
    });
};

const getCacheKey = (prefix, query) => `${prefix}:${JSON.stringify(query)}`;

const monthKeyFromIso = (isoDate) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const averageSalary = (rows) => {
    const salaryValues = rows
        .map((row) => row.salary_usd)
        .filter((salary) => Number.isFinite(salary));

    if (!salaryValues.length) return null;
    return Math.round(salaryValues.reduce((sum, value) => sum + value, 0) / salaryValues.length);
};

const getSortedExperienceLevels = (values) => {
    const unique = [...new Set(values)].filter(Boolean);
    unique.sort((a, b) => {
        const ai = experienceOrder.indexOf(a);
        const bi = experienceOrder.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });
    return unique;
};

const scoreSuggestion = (labelLower, queryLower) => {
    if (labelLower === queryLower) return 100;
    if (labelLower.startsWith(queryLower)) return 90;

    const tokens = labelLower.split(/[\s\-_/(),.]+/).filter(Boolean);
    const queryTokens = queryLower.split(/[\s\-_/(),.]+/).filter(Boolean);

    if (tokens.some((token) => token.startsWith(queryLower))) return 75;
    if (labelLower.includes(queryLower)) return 60;

    // Multi-word partial matching: "software eng" can still match "... Engineer"
    if (queryTokens.length) {
        const tokenPrefixMatches = queryTokens.filter(
            (qToken) => qToken.length >= 2 && tokens.some((token) => token.startsWith(qToken))
        ).length;
        if (tokenPrefixMatches >= 2) return 58;
        if (tokenPrefixMatches === 1) return 52;

        const tokenContainsMatches = queryTokens.filter(
            (qToken) => qToken.length >= 3 && tokens.some((token) => token.includes(qToken))
        ).length;
        if (tokenContainsMatches >= 1) return 46;
    }

    return 0;
};

const buildSuggestions = (rows, query, limit) => {
    const queryLower = query.toLowerCase();
    const buckets = new Map();

    rows.forEach((row) => {
        const jobLabel = String(row.job_title || '').trim();
        if (jobLabel) {
            const key = `job:${jobLabel.toLowerCase()}`;
            const existing = buckets.get(key) || { label: jobLabel, type: 'job', count: 0 };
            existing.count += 1;
            buckets.set(key, existing);
        }

        const countryLabel = String(row.company_location || '').trim();
        if (countryLabel) {
            const key = `country:${countryLabel.toLowerCase()}`;
            const existing = buckets.get(key) || { label: countryLabel, type: 'country', count: 0 };
            existing.count += 1;
            buckets.set(key, existing);
        }
    });

    return [...buckets.values()]
        .map((entry) => {
            const score = scoreSuggestion(entry.label.toLowerCase(), queryLower);
            return { ...entry, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.count !== a.count) return b.count - a.count;
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.label.localeCompare(b.label);
        })
        .slice(0, limit)
        .map(({ label, type, count }) => ({ label, type, count }));
};

// @desc    Get metadata for job explorer filters
// @route   GET /api/jobs/meta
// @access  Public
router.get('/meta', async (req, res) => {
    try {
        const key = getCacheKey('meta', {});
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const experienceLevels = getSortedExperienceLevels(rows.map((row) => row.experience_level));
        const countries = [...new Set(rows.map((row) => row.company_location))]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
        const companySizes = [...new Set(rows.map((row) => row.company_size))]
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

        const payload = {
            totalPostings: rows.length,
            totalCountries: countries.length,
            experienceLevels,
            countries,
            companySizes,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Get live search suggestions (job titles + countries)
// @route   GET /api/jobs/suggestions?q=<query>&limit=<n>
// @access  Public
router.get('/suggestions', async (req, res) => {
    try {
        const query = String(req.query.q || '').trim();
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 3), 15);

        if (!query) {
            return res.json({ query: '', suggestions: [] });
        }

        const key = getCacheKey('suggestions', { q: query.toLowerCase(), limit });
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const suggestions = buildSuggestions(rows, query, limit);

        const payload = {
            query,
            suggestions,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Search insights by title/experience/country
// @route   GET /api/jobs/insights
// @access  Public
router.get('/insights', async (req, res) => {
    try {
        const key = getCacheKey('insights', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const skillsCount = filtered.reduce((acc, row) => {
            row.required_skills.forEach((skill) => {
                acc.set(skill, (acc.get(skill) || 0) + 1);
            });
            return acc;
        }, new Map());

        const topSkills = [...skillsCount.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([skill, count]) => ({ skill, count }));

        const payload = {
            filters: {
                job_title: req.query.job_title || '',
                experience_level: req.query.experience_level || 'All',
                country: req.query.country || 'All'
            },
            totalMatches: filtered.length,
            averageSalaryUsd: averageSalary(filtered),
            topSkills,
            minimumEducationRequired: getMinimumEducation(filtered),
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Chunked job listings for large datasets
// @route   GET /api/jobs/listings
// @access  Public
router.get('/listings', async (req, res) => {
    try {
        const key = getCacheKey('listings', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 10), 250);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const sorted = [...filtered].sort((a, b) => {
            const dateA = a.posted_date ? new Date(a.posted_date).getTime() : 0;
            const dateB = b.posted_date ? new Date(b.posted_date).getTime() : 0;
            if (dateA !== dateB) return dateB - dateA;
            return (b.salary_usd || 0) - (a.salary_usd || 0);
        });

        const totalMatches = sorted.length;
        const totalPages = Math.max(Math.ceil(totalMatches / limit), 1);
        const clampedPage = Math.min(page, totalPages);
        const start = (clampedPage - 1) * limit;
        const end = start + limit;

        const listings = sorted.slice(start, end).map((row) => ({
            id: row.id,
            job_title: row.job_title,
            salary_usd: row.salary_usd,
            salary_currency: row.salary_currency,
            experience_level: row.experience_level,
            job_category: row.job_category,
            company_location: row.company_location,
            company_size: row.company_size,
            remote_type: normalizeRemoteBucket(row.remote_ratio),
            required_skills: row.required_skills,
            education_required: row.education_required,
            posted_date: row.posted_date
        }));

        const payload = {
            listings,
            currentPage: clampedPage,
            chunkSize: limit,
            totalPages,
            totalMatches,
            hasNext: clampedPage < totalPages,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Average salary by job category
// @route   GET /api/jobs/salary-by-category
// @access  Public
router.get('/salary-by-category', async (req, res) => {
    try {
        const key = getCacheKey('salary-by-category', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const categoryMap = filtered.reduce((acc, row) => {
            if (!Number.isFinite(row.salary_usd)) return acc;
            const existing = acc.get(row.job_category) || { totalSalary: 0, count: 0 };
            existing.totalSalary += row.salary_usd;
            existing.count += 1;
            acc.set(row.job_category, existing);
            return acc;
        }, new Map());

        const categories = [...categoryMap.entries()]
            .map(([job_category, stats]) => ({
                job_category,
                average_salary_usd: Math.round(stats.totalSalary / stats.count),
                postings: stats.count
            }))
            .sort((a, b) => b.average_salary_usd - a.average_salary_usd);

        const payload = {
            categories,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Remote vs on-site trends
// @route   GET /api/jobs/remote-trends
// @access  Public
router.get('/remote-trends', async (req, res) => {
    try {
        const key = getCacheKey('remote-trends', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const remoteBuckets = filtered.reduce(
            (acc, row) => {
                const bucket = normalizeRemoteBucket(row.remote_ratio);
                acc[bucket] += 1;
                return acc;
            },
            { Remote: 0, Hybrid: 0, 'On-site': 0 }
        );

        const total = Object.values(remoteBuckets).reduce((sum, value) => sum + value, 0);
        const trends = Object.entries(remoteBuckets).map(([type, count]) => ({
            type,
            count,
            percentage: total ? Number(((count / total) * 100).toFixed(1)) : 0
        }));

        const payload = {
            trends,
            totalPostings: total,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Most common required skills
// @route   GET /api/jobs/common-skills
// @access  Public
router.get('/common-skills', async (req, res) => {
    try {
        const key = getCacheKey('common-skills', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);
        const limit = Math.max(3, Math.min(parseInt(req.query.limit, 10) || 12, 30));

        const skillMap = filtered.reduce((acc, row) => {
            row.required_skills.forEach((skill) => {
                acc.set(skill, (acc.get(skill) || 0) + 1);
            });
            return acc;
        }, new Map());

        const skills = [...skillMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([skill, count]) => ({ skill, count }));

        const payload = {
            skills,
            totalPostings: filtered.length,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Company size impact analysis
// @route   GET /api/jobs/company-size-impact
// @access  Public
router.get('/company-size-impact', async (req, res) => {
    try {
        const key = getCacheKey('company-size-impact', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const sizeMap = filtered.reduce((acc, row) => {
            const size = row.company_size || 'Unknown';
            const existing = acc.get(size) || { postings: 0, totalSalary: 0, salaryCount: 0 };
            existing.postings += 1;
            if (Number.isFinite(row.salary_usd)) {
                existing.totalSalary += row.salary_usd;
                existing.salaryCount += 1;
            }
            acc.set(size, existing);
            return acc;
        }, new Map());

        const impact = [...sizeMap.entries()]
            .map(([company_size, stats]) => ({
                company_size,
                postings: stats.postings,
                average_salary_usd: stats.salaryCount
                    ? Math.round(stats.totalSalary / stats.salaryCount)
                    : null
            }))
            .sort((a, b) => b.postings - a.postings);

        const payload = {
            impact,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Geographic salary variations
// @route   GET /api/jobs/geographic-salary
// @access  Public
router.get('/geographic-salary', async (req, res) => {
    try {
        const key = getCacheKey('geographic-salary', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const limit = Math.max(5, Math.min(parseInt(req.query.limit, 10) || 20, 80));
        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const countryMap = filtered.reduce((acc, row) => {
            const country = row.company_location || 'Unknown';
            const existing = acc.get(country) || { postings: 0, totalSalary: 0, salaryCount: 0 };
            existing.postings += 1;
            if (Number.isFinite(row.salary_usd)) {
                existing.totalSalary += row.salary_usd;
                existing.salaryCount += 1;
            }
            acc.set(country, existing);
            return acc;
        }, new Map());

        const countries = [...countryMap.entries()]
            .map(([country, stats]) => ({
                country,
                postings: stats.postings,
                average_salary_usd: stats.salaryCount
                    ? Math.round(stats.totalSalary / stats.salaryCount)
                    : null
            }))
            .filter((entry) => Number.isFinite(entry.average_salary_usd))
            .sort((a, b) => b.average_salary_usd - a.average_salary_usd)
            .slice(0, limit);

        const payload = {
            countries,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @desc    Time-series market evolution
// @route   GET /api/jobs/market-evolution
// @access  Public
router.get('/market-evolution', async (req, res) => {
    try {
        const key = getCacheKey('market-evolution', req.query);
        const cached = jobsCache.get(key);
        if (cached) return res.json(cached);

        const { rows, source } = await loadJobsData();
        const filtered = filterRows(rows, req.query);

        const monthMap = filtered.reduce((acc, row) => {
            const month = monthKeyFromIso(row.posted_date);
            if (!month) return acc;
            const existing = acc.get(month) || { postings: 0, totalSalary: 0, salaryCount: 0 };
            existing.postings += 1;
            if (Number.isFinite(row.salary_usd)) {
                existing.totalSalary += row.salary_usd;
                existing.salaryCount += 1;
            }
            acc.set(month, existing);
            return acc;
        }, new Map());

        const timeline = [...monthMap.entries()]
            .map(([month, stats]) => ({
                month,
                postings: stats.postings,
                average_salary_usd: stats.salaryCount
                    ? Math.round(stats.totalSalary / stats.salaryCount)
                    : null
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const payload = {
            timeline,
            hasTimeSeries: timeline.length > 0,
            dataSource: source
        };

        jobsCache.set(key, payload);
        res.json(payload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
