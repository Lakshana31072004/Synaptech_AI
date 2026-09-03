import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { apiService } from '../apiService';
import useDebounce from '../hooks/useDebounce';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
    const [results, setResults] = useState({ users: [], activityLogs: [], archivedActivityLogs: [] });
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const query = new URLSearchParams(location.search).get('query') || '';
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (!debouncedQuery) {
            setResults({ users: [], activityLogs: [], archivedActivityLogs: [] });
            setLoading(false);
            return;
        }

        const fetchAllResults = async () => {
            setLoading(true);
            try {
                // For a full search page, you might want dedicated API endpoints
                // that return paginated results for each category based on the query.
                // Here, we'll reuse the globalSearch for simplicity, but a real implementation
                // would likely use paginated endpoints.
                const [userResults, logResults, archivedLogResults] = await Promise.all([
                    apiService.getAllUsers(0, 10, 'id,asc', debouncedQuery),
                    apiService.getAllUserActivity(0, 10, '', debouncedQuery), // Searching action type field
                    apiService.getArchivedUserActivity(0, 10, '', debouncedQuery) // Searching action type field
                ]);

                setResults({
                    users: userResults.content,
                    activityLogs: logResults.content,
                    archivedActivityLogs: archivedLogResults.content,
                });
            } catch (error) {
                console.error("Failed to fetch search results:", error);
                // You could use the notification context to show an error
            } finally {
                setLoading(false);
            }
        };

        fetchAllResults();
    }, [debouncedQuery]);

    const Highlight = ({ text, highlight }) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    return (
        <div className="search-results-page">
            <h1>Search Results for "{query}"</h1>

            {loading ? (
                <p>Loading results...</p>
            ) : (
                <div className="results-container">
                    <section className="results-section">
                        <h2>Users</h2>
                        {results.users?.length > 0 ? (
                            results.users.map(user => (
                                <div key={`user-${user.id}`} className="result-card">
                                    <Link to={`/admin?search=${user.username}`}><Highlight text={user.username} highlight={query} /></Link>
                                    <p>Roles: {user.roles.join(', ')}</p>
                                </div>
                            ))
                        ) : <p>No users found.</p>}
                    </section>

                    <section className="results-section">
                        <h2>Activity Logs</h2>
                        {results.activityLogs?.length > 0 ? (
                            results.activityLogs.map(log => (
                                <div key={`log-${log.id}`} className="result-card">
                                    <Link to={`/admin/activity?username=${log.username}`}><Highlight text={`${log.username} - ${log.action}`} highlight={query} /></Link>
                                    <p>{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            ))
                        ) : <p>No activity logs found.</p>}
                    </section>

                    <section className="results-section">
                        <h2>Archived Logs</h2>
                        {results.archivedActivityLogs?.length > 0 ? (
                            results.archivedActivityLogs.map(log => (
                                <div key={`archived-log-${log.id}`} className="result-card">
                                    <Link to={`/admin/activity/archive?username=${log.username}`}><Highlight text={`${log.username} - ${log.action}`} highlight={query} /></Link>
                                    <p>(Archived) {new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            ))
                        ) : <p>No archived logs found.</p>}
                    </section>
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;