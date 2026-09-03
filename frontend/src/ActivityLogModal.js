import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import Modal from './Modal';
import './ActivityLogModal.css';

const ActivityLogModal = ({ user, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await apiService.getUserActivity(user.id, page);
                setLogs(data.content);
                setTotalPages(data.totalPages);
            } catch (err) {
                // Error is handled by global notification service
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [user.id, page]);

    return (
        <Modal title={`Activity Log for ${user.username}`} onClose={onClose}>
            {loading ? (
                <p>Loading logs...</p>
            ) : (
                <>
                    <table className="activity-log-table">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Timestamp</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>{log.action}</td>
                                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.details || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination-controls">
                        <button onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                            Previous
                        </button>
                        <span>Page {page + 1} of {totalPages}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default ActivityLogModal;