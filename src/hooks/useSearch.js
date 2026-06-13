// Search hook with debouncing for instant, performant search
// Matches on title, notes, tags, and category name

import { useState, useMemo, useEffect, useRef } from 'react';

const useSearch = (screenshots, delay = 300) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef(null);

  // Debounce the search query
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, delay]);

  // Filter screenshots based on debounced query
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return screenshots;
    }

    const lowerQuery = debouncedQuery.toLowerCase().trim();
    const terms = lowerQuery.split(/\s+/);

    return screenshots.filter((screenshot) => {
      const searchableText = [
        screenshot.title,
        screenshot.notes,
        screenshot.tags,
        screenshot.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // All terms must match (AND logic)
      return terms.every((term) => searchableText.includes(term));
    });
  }, [screenshots, debouncedQuery]);

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
  };

  return {
    query,
    setQuery,
    results,
    isSearching: query.trim().length > 0,
    resultCount: results.length,
    clearSearch,
  };
};

export default useSearch;
