import React from 'react';

const CountrySelector = ({ countries, selectedCountry, onSelect }) => {
    return (
        <div className="country-selector">
            <label htmlFor="country-select" className="block text-sm font-medium text-gray-300 mb-2">
                Select Country
            </label>
            <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => onSelect(e.target.value)}
                className="block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg shadow-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm appearance-none"
            >
                <option value="">-- Choose a Country --</option>
                {countries.map((country) => (
                    <option key={country._id} value={country.country}>
                        {country.country} {country.aiIndexScore ? `(Score: ${country.aiIndexScore})` : ''}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default CountrySelector;
