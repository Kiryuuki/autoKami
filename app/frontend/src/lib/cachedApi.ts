import { getCache, setCache, clearCache } from './cache';
import { supabase } from '../services/supabase';

// Helper to handle Supabase errors consistent with existing patterns
const handleSupabaseError = (error: any) => {
  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
};

// Get user profile with cache
export const getUserProfile = async (userId: string) => {
  const cacheKey = `user_profile_${userId}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('users')
    .select('id, privy_user_id, email, wallet_address, created_at')
    .eq('id', userId)
    .single();
  
  handleSupabaseError(error);
  setCache(cacheKey, data);
  return data;
};

// Get user settings with cache
export const getUserSettings = async (userId: string) => {
  const cacheKey = `user_settings_${userId}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // PGRST116 is "Row not found", which is valid for settings (might not exist yet)
  if (error && error.code !== 'PGRST116') handleSupabaseError(error);
  
  if (data) {
      setCache(cacheKey, data);
  }
  return data;
};

// Get operator wallets with cache
export const getOperatorWallets = async (userId: string) => {
  const cacheKey = `wallets_${userId}`;
  const cached = getCache<any[]>(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('operator_wallets')
    .select('id, name, wallet_address, account_id, encrypted_private_key, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  handleSupabaseError(error);
  setCache(cacheKey, data);
  return data || [];
};

// Get static kami data with cache
export const getKamiStatic = async (kamiId: string) => {
  const cacheKey = `kami_static_${kamiId}`;
  const cached = getCache<any>(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('kamigotchis')
    .select('id, kami_name, kami_index, kami_entity_id, account_id, traits, level, media_uri, affinities, operator_wallet_id')
    .eq('id', kamiId)
    .single();
  
  handleSupabaseError(error);
  setCache(cacheKey, data);
  return data;
};

// ALWAYS fetch fresh - no cache
export const getKamiLiveStats = async (kamiId: string) => {
  const { data, error } = await supabase
    .from('kamigotchis')
    .select('current_health, state, final_stats, last_synced')
    .eq('id', kamiId)
    .single();
  
  handleSupabaseError(error);
  return data;
};

// Get complete kami data (static from cache + live fresh)
export const getKamiComplete = async (kamiId: string) => {
  const [staticData, liveStats] = await Promise.all([
    getKamiStatic(kamiId),
    getKamiLiveStats(kamiId)
  ]);
  return { ...staticData, ...liveStats };
};

// Invalidate user cache on update
export const invalidateUserCache = (userId: string) => {
  clearCache(`user_profile_${userId}`);
  clearCache(`user_settings_${userId}`);
};

// Invalidate wallet cache on update
export const invalidateWalletCache = (userId: string) => {
  clearCache(`wallets_${userId}`);
};

// Invalidate kami static cache on update
export const invalidateKamiCache = (kamiId: string) => {
  clearCache(`kami_static_${kamiId}`);
};
