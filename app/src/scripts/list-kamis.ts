import supabase from '../services/supabaseService.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function listKamis() {
    console.log('[List] Fetching Kamigotchis...');
    const { data, error } = await supabase
        .from('kamigotchis')
        .select('kami_index, kami_entity_id, account_id');

    if (error) {
        console.error('[List] Error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('[List] No Kamigotchis found in database.');
    } else {
        console.log(`[List] Found ${data.length} Kamigotchis:`);
        data.forEach(k => {
            console.log(`- Index: ${k.kami_index}, ID: ${k.kami_entity_id}`);
        });
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    listKamis().catch(console.error);
}
