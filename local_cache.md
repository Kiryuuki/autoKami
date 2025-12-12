Implement local caching for static user data to improve app performance. Cache duration: 24 hours.

## Requirements

1. **Data to Cache Locally:**
   - User profile (id, privy_user_id, email, wallet_address)
   - User settings (theme, notification preferences)
   - Operator wallets (id, name, wallet_address, account_id)
   - Kamigotchi static data (id, kami_name, kami_index, traits, account_id, kami_entity_id)

2. **Data to NEVER Cache (Always Fetch Fresh):**
   - Kamigotchi live stats (current_health, state, stats)
   - Harvest/rest timers
   - Transaction logs
   - Any real-time game data

## Implementation Steps

### Step 1: Create Cache Utility
Create `lib/cache.js`:
```javascript
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const setCache = (key, data) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

export const getCache = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(key);
    return null;
  }
  return data;
};

export const clearCache = (key) => {
  localStorage.removeItem(key);
};

export const clearAllCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('user_') || key.startsWith('wallet_') || key.startsWith('kami_static_')) {
      localStorage.removeItem(key);
    }
  });
};
```

### Step 2: Create Cache-Aware API Functions
Create `lib/cachedApi.js`:
```javascript
import { getCache, setCache, clearCache } from './cache';
import { supabase } from './supabase';

// Get user profile with cache
export const getUserProfile = async (userId) => {
  const cacheKey = `user_profile_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('users')
    .select('id, privy_user_id, email, wallet_address, created_at')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  setCache(cacheKey, data);
  return data;
};

// Get user settings with cache
export const getUserSettings = async (userId) => {
  const cacheKey = `user_settings_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  setCache(cacheKey, data);
  return data;
};

// Get operator wallets with cache
export const getOperatorWallets = async (userId) => {
  const cacheKey = `wallets_${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('operator_wallets')
    .select('id, name, wallet_address, account_id, private_key, is_active')
    .eq('user_id', userId);
  
  if (error) throw error;
  setCache(cacheKey, data);
  return data;
};

// Get static kami data with cache
export const getKamiStatic = async (kamiId) => {
  const cacheKey = `kami_static_${kamiId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;
  
  const { data, error } = await supabase
    .from('kamigotchis')
    .select('id, kami_name, kami_index, kami_entity_id, account_id, traits, level, media_uri')
    .eq('id', kamiId)
    .single();
  
  if (error) throw error;
  setCache(cacheKey, data);
  return data;
};

// ALWAYS fetch fresh - no cache
export const getKamiLiveStats = async (kamiId) => {
  const { data, error } = await supabase
    .from('kamigotchis')
    .select('current_health, state, final_stats, last_synced')
    .eq('id', kamiId)
    .single();
  
  if (error) throw error;
  return data;
};

// Get complete kami data (static from cache + live fresh)
export const getKamiComplete = async (kamiId) => {
  const [staticData, liveStats] = await Promise.all([
    getKamiStatic(kamiId),
    getKamiLiveStats(kamiId)
  ]);
  return { ...staticData, ...liveStats };
};

// Invalidate user cache on update
export const invalidateUserCache = (userId) => {
  clearCache(`user_profile_${userId}`);
  clearCache(`user_settings_${userId}`);
};

// Invalidate wallet cache on update
export const invalidateWalletCache = (userId) => {
  clearCache(`wallets_${userId}`);
};

// Invalidate kami static cache on update
export const invalidateKamiCache = (kamiId) => {
  clearCache(`kami_static_${kamiId}`);
};
```

### Step 3: Update Existing Codebase

**Find and replace ALL instances where you currently fetch static data:**

#### A. User Profile Fetches
**Find:**
```javascript
const { data } = await supabase.from('users').select('*').eq('id', userId).single();
```
**Replace with:**
```javascript
import { getUserProfile } from '@/lib/cachedApi';
const data = await getUserProfile(userId);
```

#### B. User Settings Fetches
**Find:**
```javascript
const { data } = await supabase.from('user_settings').select('*').eq('user_id', userId).single();
```
**Replace with:**
```javascript
import { getUserSettings } from '@/lib/cachedApi';
const data = await getUserSettings(userId);
```

#### C. Operator Wallets Fetches
**Find:**
```javascript
const { data } = await supabase.from('operator_wallets').select('*').eq('user_id', userId);
```
**Replace with:**
```javascript
import { getOperatorWallets } from '@/lib/cachedApi';
const data = await getOperatorWallets(userId);
```

#### D. Kamigotchi Static Data
**Find patterns like:**
```javascript
const { data } = await supabase.from('kamigotchis').select('*').eq('id', kamiId).single();
```
**Replace with:**
```javascript
import { getKamiComplete } from '@/lib/cachedApi';
const data = await getKamiComplete(kamiId); // Gets static (cached) + live (fresh)
```

**Or if you only need static data:**
```javascript
import { getKamiStatic } from '@/lib/cachedApi';
const data = await getKamiStatic(kamiId);
```

### Step 4: Add Cache Invalidation on Mutations

**Update user settings mutation:**
```javascript
// After successful update
await supabase.from('user_settings').update(newSettings).eq('user_id', userId);
invalidateUserCache(userId); // Clear cache
```

**Update wallet mutation:**
```javascript
// After successful update
await supabase.from('operator_wallets').update(updates).eq('id', walletId);
invalidateWalletCache(userId); // Clear cache
```

**Update kami static data mutation:**
```javascript
// After updating kami name, etc
await supabase.from('kamigotchis').update({ kami_name: newName }).eq('id', kamiId);
invalidateKamiCache(kamiId); // Clear cache
```

### Step 5: Add Cache Clear on Logout

**Find your logout function and add:**
```javascript
import { clearAllCache } from '@/lib/cache';

const handleLogout = async () => {
  await supabase.auth.signOut();
  clearAllCache(); // Clear all cached data
  // ... rest of logout logic
};
```

### Step 6: Search and Update Files

**Run these searches in your codebase to find all places needing updates:**
```bash
# Search for user profile fetches
grep -r "from('users').select" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Search for user settings fetches
grep -r "from('user_settings')" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Search for wallet fetches
grep -r "from('operator_wallets')" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Search for kamigotchi fetches
grep -r "from('kamigotchis').select" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

**For each match, determine:**
1. Is this static data? → Use cached function
2. Is this live data (health, timers)? → Keep direct Supabase call
3. Is this a mutation? → Add cache invalidation after

### Step 7: Priority Files to Update

Update these common file types first:
1. **Components that display user info** - Profile, navbar, settings
2. **Dashboard/home pages** - Usually fetch user data on load
3. **Kami list/card components** - Display kami static info
4. **Wallet selector components** - List operator wallets
5. **API routes/server actions** - If using server-side fetching

## Testing Checklist

- [ ] First load fetches from database (check Network tab)
- [ ] Second load returns instantly from cache (no network request)
- [ ] Cache expires after 24 hours (test by manually setting old timestamp)
- [ ] Cache clears on logout
- [ ] Cache clears after updates (settings, wallet, kami name)
- [ ] Live stats always fetch fresh (check Network tab shows requests)
- [ ] No stale data displayed to users

## Performance Gains Expected

- User profile loads: ~500ms → ~5ms (100x faster)
- Wallet lists: ~300ms → ~5ms (60x faster)
- Kami static data: ~400ms → ~5ms (80x faster)
- Overall perceived app speed: 2-3x faster