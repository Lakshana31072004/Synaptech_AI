import React, { useState, useEffect } from 'react';
import { apiService } from '../apiService';
import './EditUserRolesModal.css';

const EditUserRolesModal = ({ user, onClose, onSave }) => {
    const [allRoles, setAllRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState(new Set(user.roles));

    useEffect(() => {
        const fetchRoles = async () => {
            const roles = await apiService.getAllRoles();
            setAllRoles(roles);
        };
        fetchRoles();
    }, []);

    const handleRoleChange = (role) => {
        const newSelectedRoles = new Set(selectedRoles);
        if (newSelectedRoles.has(role)) {
            newSelectedRoles.delete(role);
        } else {
            newSelectedRoles.add(role);
        }
        setSelectedRoles(newSelectedRoles);
    };

    const handleSave = async () => {
        try {
            const updatedUser = await apiService.updateUserRoles(user.id, Array.from(selectedRoles));
            onSave(updatedUser);
        } catch (error) {
            console.error("Failed to update roles:", error);
            // Optionally, show an error message to the user
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Edit Roles for {user.username}</h2>
                <div className="roles-list">
                    {allRoles.map(role => (
                        <div key={role} className="role-checkbox">
                            <input
                                type="checkbox"
                                id={role}
                                checked={selectedRoles.has(role)}
                                onChange={() => handleRoleChange(role)}
                            />
                            <label htmlFor={role}>{role}</label>
                        </div>
                    ))}
                </div>
                <div className="modal-actions">
                    <button onClick={handleSave} className="save-button">Save</button>
                    <button onClick={onClose} className="cancel-button">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default EditUserRolesModal;