const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Image Service
 * 
 * Logic:
 * 1. Check official domain for logo/icon
 * 2. Check OpenGraph image
 * 3. Return category-based fallback (handled by frontend or separate logic)
 */

class ImageService {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (compatible; AIToolBot/1.0; +http://yoursite.com)';
    }

    async resolveImage(toolUrl) {
        if (!toolUrl) return null;

        try {
            // 1. Try to get OpenGraph image first as it's often higher res than favicon
            const ogImage = await this.getOpenGraphImage(toolUrl);
            if (ogImage) {
                return { url: ogImage, source: 'opengraph' };
            }

            // 2. Try favicon/logo if OG fails
            const globeWrapper = await this.getFavicon(toolUrl);
            if (globeWrapper) {
                return { url: globeWrapper, source: 'official' };
            }

            return null;
        } catch (error) {
            console.error(`Error resolving image for ${toolUrl}:`, error.message);
            return null;
        }
    }

    async getOpenGraphImage(url) {
        try {
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 5000
            });
            const $ = cheerio.load(data);

            // Check standard OG tag
            let ogImage = $('meta[property="og:image"]').attr('content');

            // Check twitter card
            if (!ogImage) {
                ogImage = $('meta[name="twitter:image"]').attr('content');
            }

            // Resolve relative URLs
            if (ogImage && !ogImage.startsWith('http')) {
                ogImage = new URL(ogImage, url).href;
            }

            return ogImage;
        } catch (err) {
            return null;
        }
    }

    async getFavicon(url) {
        // Simple heuristic - check /favicon.ico and /apple-touch-icon.png
        // Also look for link rel="icon" in HTML if we already fetched it, but 
        // to save bw, let's just use Google's favicon service or Clearbit for now
        // as a robust fallback if direct scraping fails.
        // Or strictly strictly stick to local resolution:

        try {
            const domain = new URL(url).hostname;
            return `https://logo.clearbit.com/${domain}`;
        } catch (e) {
            return null;
        }
    }
}

module.exports = new ImageService();
