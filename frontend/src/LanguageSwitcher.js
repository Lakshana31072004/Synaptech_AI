import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10001 }}>
            <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'} className="view-activity-button" style={{ marginRight: '5px' }}>
                English
            </button>
            <button onClick={() => changeLanguage('es')} disabled={i18n.language === 'es'} className="view-activity-button">
                Español
            </button>
        </div>
    );
};

export default LanguageSwitcher;