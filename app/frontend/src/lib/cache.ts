const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const setCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export const getCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached) as CacheEntry<T>;
    
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting cache:', error);
    localStorage.removeItem(key);
    return null;
  }
};

export const clearCache = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const clearAllCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('user_') || key.startsWith('wallet_') || key.startsWith('kami_static_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};
