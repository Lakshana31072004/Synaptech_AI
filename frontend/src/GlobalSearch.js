import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '../apiService';
import useDebounce from '../hooks/useDebounce';
import './GlobalSearch.css';
import { getCachedUsernames } from '../suggestionCache';

// Levenshtein distance function to find closest match for typos
const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }

    return matrix[b.length][a.length];
};

const Highlight = ({ text, highlight }) => {
    if (!highlight || !text) {
        return <span>{text}</span>;
    }
    // Escape special characters in the highlight string for regex
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? <strong key={i} className="search-highlight">{part}</strong> : <span key={i}>{part}</span>
            )}
        </span>
    );
};

const GlobalSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const searchRef = useRef(null);
    const resultsRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const flatResults = useMemo(() => {
        if (!results) return [];
        const allResults = [];
        if (results.users?.length > 0) {
            allResults.push(...results.users.map(item => ({ type: 'user', data: item, path: '/admin', search: `?search=${encodeURIComponent(item.username)}` })));
        }
        if (results.activityLogs?.length > 0) {
            allResults.push(...results.activityLogs.map(item => ({ type: 'log', data: item, path: '/admin/activity', search: `?username=${encodeURIComponent(item.username)}` })));
        }
        if (results.archivedActivityLogs?.length > 0) {
            allResults.push(...results.archivedActivityLogs.map(item => ({ type: 'archived-log', data: item, path: '/admin/activity/archive', search: `?username=${encodeURIComponent(item.username)}` })));
        }
        return allResults;
    }, [results]);

    useEffect(() => {
        // Reset active index when search term changes
        setActiveIndex(-1);
        setSuggestion(null);

        if (debouncedSearchTerm) {
            const fetchResults = async () => {
                try {
                    const data = await apiService.globalSearch(debouncedSearchTerm);
                    setResults(data);
                    setIsOpen(true);

                    // If no results, check for suggestions
                    if (data.users.length === 0 && data.activityLogs.length === 0 && data.archivedActivityLogs.length === 0) {
                        const allUsernames = await getCachedUsernames(apiService);
                        let bestMatch = null;
                        let minDistance = Infinity;

                        allUsernames.forEach(username => {
                            const distance = getLevenshteinDistance(debouncedSearchTerm.toLowerCase(), username.toLowerCase());
                            if (distance < minDistance && distance <= 3) { // Threshold of 3 edits
                                minDistance = distance;
                                bestMatch = username;
                            }
                        });

                        if (bestMatch) {
                            setSuggestion(bestMatch);
                        }
                    }
                } catch (error) {
                    console.error("Global search failed:", error);
                }
            };
            fetchResults();
        } else {
            setResults(null);
            setIsOpen(false);
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        if (activeIndex >= 0 && resultsRef.current) {
            const activeElement = resultsRef.current.querySelector('.result-item.active');
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [activeIndex]);

    const handleKeyDown = (e) => {
        if (!isOpen || flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prevIndex => (prevIndex + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prevIndex => (prevIndex - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                const selectedItem = flatResults[activeIndex];
                navigate({ pathname: selectedItem.path, search: selectedItem.search });
                setIsOpen(false);
                setSearchTerm('');
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSuggestionClick = () => {
        setSearchTerm(suggestion);
        setSuggestion(null);
    };

    const hasResults = results && (results.users?.length > 0 || results.activityLogs?.length > 0 || results.archivedActivityLogs?.length > 0);

    return (
        <div className="global-search-container" ref={searchRef}>
            <input
                type="text"
                placeholder="Global Search..."
                value={searchTerm}
                onKeyDown={handleKeyDown}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => hasResults && setIsOpen(true)}
                className="global-search-input"
            />
            {isOpen && (
                <div className="global-search-results" ref={resultsRef}>
                    {hasResults ? (
                        <>
                            {results.users?.length > 0 && (
                                <div className="results-category">
                                    <h4>Users</h4>
                                    {results.users.map(user => (
                                        <Link key={`user-${user.id}`} to="/admin" className="result-item" onClick={() => setIsOpen(false)}>
                                            {user.username}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {results.activityLogs?.length > 0 && (
                                <div className="results-category">
                                    <h4>Activity Logs</h4>
                                    {results.activityLogs.map((log) => (
                                        <Link key={`log-${log.id}`} to="/admin/activity" className={`result-item ${flatResults.findIndex(item => item.type === 'log' && item.data.id === log.id) === activeIndex ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                                            {log.username} - {log.action}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {results.archivedActivityLogs?.length > 0 && (
                                <div className="results-category">
                                    <h4>Archived Logs</h4>
                                    {results.archivedActivityLogs.map(log => (
                                        <Link key={`archived-log-${log.id}`} to="/admin/activity/archive" className={`result-item ${flatResults.findIndex(item => item.type === 'archived-log' && item.data.id === log.id) === activeIndex ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                                            {log.username} - {log.action} (Archived)
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <Link to={`/search-results?query=${encodeURIComponent(debouncedSearchTerm)}`} className="result-item view-all-results" onClick={() => setIsOpen(false)}>
                                View all results for "{debouncedSearchTerm}"
                            </Link>
                        </>
                    ) : <div className="no-results">No results found</div>}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;