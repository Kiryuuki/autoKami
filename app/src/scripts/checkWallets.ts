import supabase from '../services/supabaseService.js';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

async function main() {
    console.log("Checking operator_wallets table...");
    const { data, error } = await supabase.from('operator_wallets').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found wallets:", data?.length);
        if (data && data.length > 0) {
            console.log("First wallet:", data[0]);
        }
    }
}

main();
