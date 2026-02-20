import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const ImageResolver = ({ tool, className = "", eager = false }) => {
    const [imageState, setImageState] = useState('loading'); // loading, loaded, error

    // Construct image source
    // Priority: 1. tool.image.url, 2. specialized fallback logic
    const imgSrc = tool.image?.url;

    // Function to generate consistent color from string
    const getFallbackColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    const fallbackColor = tool.image?.fallbackColor || getFallbackColor(tool.name);
    const initials = tool.name.substring(0, 2).toUpperCase();

    const handleLoad = () => setImageState('loaded');
    const handleError = () => setImageState('error');

    return (
        <div className={`relative overflow-hidden bg-gray-100 dark:bg-gray-800 ${className}`} style={{ aspectRatio: '16/9' }}>

            {/* 1. Main Image */}
            {imgSrc && imageState !== 'error' && (
                <img
                    src={imgSrc}
                    alt={`${tool.name} logo`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={eager ? 'eager' : 'lazy'}
                    fetchPriority={eager ? 'high' : 'auto'}
                />
            )}

            {/* 2. Loading Skeleton */}
            {imageState === 'loading' && imgSrc && (
                <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
            )}

            {/* 3. Fallback (Initials / Gradient) */}
            {(imageState === 'error' || !imgSrc) && (
                <div
                    className="absolute inset-0 flex items-center justify-center text-white font-bold text-3xl"
                    style={{
                        background: `linear-gradient(135deg, ${fallbackColor} 0%, ${adjustColor(fallbackColor, -40)} 100%)`
                    }}
                >
                    {initials}
                </div>
            )}
        </div>
    );
};

// Helper to darken color
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

export default ImageResolver;
