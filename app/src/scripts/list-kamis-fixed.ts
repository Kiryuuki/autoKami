import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from app root .env.test BEFORE other imports
const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

import supabase, { reinitSupabase } from '../services/supabaseService.js';

reinitSupabase();

async function listKamis() {
    console.log('[List] Fetching Kamigotchis...');
    const { data, error } = await supabase
        .from('kamigotchis')
        .select('kami_index, kami_entity_id, account_id, current_status');

    if (error) {
        console.error('[List] Error object:', JSON.stringify(error, null, 2));
        return;
    }

    if (!data || data.length === 0) {
        console.log('[List] No Kamigotchis found in database.');
    } else {
        console.log(`[List] Found ${data.length} Kamigotchis:`);
        data.forEach(k => {
            console.log(`- Index: ${k.kami_index}, Status: ${k.current_status}, ID: ${k.kami_entity_id}`);
        });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    listKamis().catch(console.error);
}
