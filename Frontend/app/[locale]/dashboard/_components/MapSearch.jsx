"use client";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

// Custom debounce hook with shorter delay
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const MapSearch = ({ onLocationSelect }) => {
  const { t } = useTranslation("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isArabic, setIsArabic] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Cache for recent searches
  const searchCache = useCallback(
    (() => {
      const cache = new Map();
      return {
        get: (key) => cache.get(key),
        set: (key, value) => {
          if (cache.size > 100) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
          cache.set(key, value);
        },
        has: (key) => cache.has(key),
      };
    })(),
    []
  );

  // Fetch search results from OpenStreetMap Nominatim API
  const searchLocations = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      const cacheKey = `${query.toLowerCase()}-${isArabic}`;
      if (searchCache.has(cacheKey)) {
        setSearchResults(searchCache.get(cacheKey));
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: "json",
          limit: "7",
          "accept-language": isArabic ? "ar" : "en",
          countrycodes: "eg",
          addressdetails: "1",
          namedetails: "1",
        });

        if (isArabic) {
          params.append("name:ar", query);
        }

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              "Accept-Language": isArabic ? "ar" : "en",
            },
          }
        );

        const data = await response.json();

        const enhancedResults = data
          .map((result) => ({
            ...result,
            display_name: processDisplayName(result),
            formatted_address: formatAddress(result),
          }))
          .filter((result) => result.display_name);

        searchCache.set(cacheKey, enhancedResults);
        setSearchResults(enhancedResults);
      } catch (error) {
        console.error("Error searching locations:", error);
        setSearchResults([]);
      }
      setLoading(false);
    },
    [searchCache, isArabic]
  );

  const processDisplayName = (result) => {
    if (result.address) {
      const nameParts = [];
      if (result.address.village) nameParts.push(result.address.village);
      if (result.address.city) nameParts.push(result.address.city);
      if (result.address.state) nameParts.push(result.address.state);
      if (nameParts.length > 0) return nameParts[0];
    }
    return result.display_name.split(",")[0];
  };

  const formatAddress = (result) => {
    if (!result.address) return "";
    const parts = [];
    if (result.address.road) parts.push(result.address.road);
    if (result.address.suburb) parts.push(result.address.suburb);
    if (result.address.city) parts.push(result.address.city);
    if (result.address.state) parts.push(result.address.state);
    return parts.join(isArabic ? "، " : ", ");
  };

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchLocations(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchLocations]);

  const handleLocationClick = (result) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      name: result.display_name,
    });
    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleLanguage = () => {
    setIsArabic(!isArabic);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative w-full search-container max-w-[90%] md:max-w-full ">
      <div className="relative flex items-center gap-2">
        <div
          className={`absolute ${isArabic ? "right-14" : "left-3"
            } top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-5 h-5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <button
          onClick={toggleLanguage}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 z-10 group"
          title={isArabic ? t('mapSearch.switchToEnglish') : t('mapSearch.switchToArabic')}
        >
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
            {isArabic ? "EN" : "AR"}
          </span>
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={t('mapSearch.placeholder')}
          dir={isArabic ? "rtl" : "ltr"}
          className={`w-full px-4 ${isArabic ? "pr-24 pl-4" : "pl-12 pr-12"
            } py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500`}
        />
        {loading && (
          <div
            className={`absolute ${isArabic ? "left-3" : "right-12"
              } top-1/2 -translate-y-1/2`}
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || loading) && (
        <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[340px] overflow-y-auto transition-all duration-200 ease-in-out backdrop-blur-sm">
          {searchResults.map((result) => (
            <button
              key={result.place_id}
              onClick={() => handleLocationClick(result)}
              className={`w-full px-4 py-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-all duration-200 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 group ${isArabic ? "text-right" : "text-left"
                }`}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {result.display_name}
              </div>
              {result.formatted_address && (
                <div className="text-gray-500 dark:text-gray-400 text-xs truncate mt-1.5 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                  {result.formatted_address}
                </div>
              )}
            </button>
          ))}
          {loading && (
            <div
              className={`px-4 py-4 text-gray-500 dark:text-gray-400 text-sm ${isArabic ? "text-right" : "text-left"
                } animate-pulse bg-gray-50/50 dark:bg-gray-700/50`}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {t('mapSearch.searching')}
            </div>
          )}
          {!loading && searchResults.length === 0 && (
            <div
              className={`px-4 py-4 text-gray-500 dark:text-gray-400 text-sm ${isArabic ? "text-right" : "text-left"
                } bg-gray-50/50 dark:bg-gray-700/50`}
              dir={isArabic ? "rtl" : "ltr"}
            >
              {t('mapSearch.noResults')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearch;
