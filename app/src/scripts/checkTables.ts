import supabase from '../services/supabaseService.js';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

async function checkTable(tableName: string) {
    console.log(`Checking table '${tableName}'...`);
    const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true }); // head: true means only return count/metadata, no rows

    if (error) {
        console.error(`❌ Error accessing '${tableName}':`, error.message, error.details || '');
    } else {
        console.log(`✅ Table '${tableName}' accessible. Count: ${count}`);
    }
}

async function main() {
    console.log("Checking Supabase Tables...");
    
    const tables = [
        'users',
        'operator_wallets',
        'kamigotchis',
        'kami_profiles',
        'harvest_logs',
        'system_logs',
        'user_settings',
        'watchlists'
    ];

    for (const table of tables) {
        await checkTable(table);
    }
}

main();
