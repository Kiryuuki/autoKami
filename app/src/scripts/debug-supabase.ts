import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from app root .env.test BEFORE other imports
const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

import supabase, { reinitSupabase } from '../services/supabaseService.js';

reinitSupabase();

async function debug() {
    console.log('[Debug] Checking Environment...');
    const url = process.env.SUPABASE_URL || '';
    console.log('SUPABASE_URL:', url);
    console.log('SUPABASE_KEY Length:', (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length);
    
    console.log('[Debug] Querying operator_wallets...');
    const { data, error, count } = await supabase
        .from('operator_wallets')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('[Debug] operator_wallets Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('[Debug] operator_wallets Count:', count);
        console.log('[Debug] operator_wallets Data Length:', data?.length);
        if (data && data.length > 0) {
             console.log('[Debug] Sample Wallet:', data[0].account_id, data[0].name);
        } else {
             console.log('[Debug] Table is empty or RLS is hiding rows.');
        }
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    debug().catch(console.error);
}
