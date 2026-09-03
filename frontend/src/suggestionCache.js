const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'usernameSuggestionCache';

export const getCachedUsernames = async (apiService) => {
    const now = Date.now();
    const cachedItem = localStorage.getItem(CACHE_KEY);

    if (cachedItem) {
        try {
            const { usernames, timestamp } = JSON.parse(cachedItem);
            if (now - timestamp < CACHE_DURATION) {
                return usernames; // Return valid, non-expired cache
            }
        } catch (e) {
            // Malformed cache, proceed to fetch new data
            localStorage.removeItem(CACHE_KEY);
        }
    }

    try {
        // Fetch a larger list for better suggestions
        const data = await apiService.getAllUsers(0, 200);
        const usernames = data.content.map(u => u.username);
        const cacheData = { usernames, timestamp: now };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        return usernames;
    } catch (error) {
        console.error("Failed to fetch usernames for suggestion cache:", error);
        return []; // Return empty array on failure
    }
};

export const clearUsernameCache = () => {
    localStorage.removeItem(CACHE_KEY);
};