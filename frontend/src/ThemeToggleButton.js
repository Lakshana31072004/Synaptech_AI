import React from 'react';
import { useTheme } from '../ThemeContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const themes = ['light', 'dark', 'high-contrast'];

const ThemeToggleButton = () => {
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation(); // Initialize useTranslation

    const nextThemeIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextThemeIndex];

    return (
        <button onClick={toggleTheme} className="view-activity-button" style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10001 }}>
            {t('switchTheme', { theme: nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1) })}
        </button>
    );
};

export default ThemeToggleButton;