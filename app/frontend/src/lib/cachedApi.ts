import { getCache, setCache, clearCache } from './cache';
import api, { type Profile, type UserSettings } from '../services/api';

// Get user settings with cache
export const getUserSettings = async (privyUserId: string): Promise<{ user: UserSettings }> => {
  const cacheKey = `user_settings_${privyUserId}`;
  const cached = getCache<{ user: UserSettings }>(cacheKey);
  if (cached) {
      console.log('[Cache] Hit for user settings');
      return cached;
  }
  
  console.log('[Cache] Miss for user settings, fetching...');
  const response = await api.get('/system/user', { params: { privyUserId } });
  const data = response.data;
  
  if (data) {
      setCache(cacheKey, data);
  }
  return data;
};

// Get operator wallets (profiles) with cache
export const getProfiles = async (privyUserId: string): Promise<{ profiles: Profile[] }> => {
  const cacheKey = `wallets_${privyUserId}`;
  const cached = getCache<{ profiles: Profile[] }>(cacheKey);
  if (cached) {
      console.log('[Cache] Hit for profiles');
      return cached;
  }
  
  console.log('[Cache] Miss for profiles, fetching...');
  const response = await api.get('/profiles', { params: { privyUserId } });
  const data = response.data;
  
  if (data) {
      setCache(cacheKey, data);
  }
  return data;
};

// Invalidate user cache on update
export const invalidateUserCache = (userId: string) => {
  console.log('[Cache] Invalidating user settings for', userId);
  clearCache(`user_settings_${userId}`);
};

// Invalidate wallet cache on update
export const invalidateWalletCache = (userId: string) => {
  console.log('[Cache] Invalidating wallets for', userId);
  clearCache(`wallets_${userId}`);
};