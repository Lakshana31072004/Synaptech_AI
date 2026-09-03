import React, { createContext, useContext, useState, useCallback } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingCount, setLoadingCount] = useState(0);

    const startLoading = useCallback(() => {
        setLoadingCount(prevCount => {
            const newCount = prevCount + 1;
            if (newCount === 1) {
                setIsLoading(true);
            }
            return newCount;
        });
    }, []);

    const stopLoading = useCallback(() => {
        setLoadingCount(prevCount => {
            const newCount = Math.max(0, prevCount - 1);
            if (newCount === 0) {
                setIsLoading(false);
            }
            return newCount;
        });
    }, []);

    const value = { isLoading, startLoading, stopLoading };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};