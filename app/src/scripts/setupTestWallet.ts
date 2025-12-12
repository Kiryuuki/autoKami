import supabase, { encryptPrivateKey } from '../services/supabaseService.js';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

async function main() {
    console.log("Setting up test data...");

    const TEST_ACCOUNT_ID = '24912831289181620569001742271490162307555423067';
    const TEST_ADDRESS = '0x9927cecd27e27ec2de22788ad828c0d6d6632e59'; // derived from private key in .env
    const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY;

    if (!OPERATOR_PRIVATE_KEY) {
        console.error("Missing OPERATOR_PRIVATE_KEY in .env");
        return;
    }

    const encryptedKey = await encryptPrivateKey(OPERATOR_PRIVATE_KEY);

    // 1. Upsert Operator Wallet
    const { error: walletError } = await supabase.from('operator_wallets').upsert({
        account_id: TEST_ACCOUNT_ID,
        address: TEST_ADDRESS,
        encrypted_private_key: encryptedKey,
        name: 'Test Wallet',
        user_id: 'test-user-id'
    }, { onConflict: 'account_id' });

    if (walletError) console.error("Wallet Insert Error:", walletError);
    else console.log("✅ Operator Wallet inserted/updated.");

    // 2. Upsert Kami #405
    // We need the entity ID. Let's assume a dummy or try to fetch it if we had a script. 
    // For now, I'll put a placeholder entity ID. The test script will use this to call the contract.
    // Ideally we should get the REAL entity ID from the chain if we want the tx to succeed.
    
    // Actually, test-feed-kami.ts does:
    // const kamis = await getKamisByAccountId(wallet.account_id);
    // const match = kamis.find((k: any) => Number(k.index) === targetIndex);
    
    // So if we don't have it in DB, it tries to fetch from chain.
    // But `getKamisByAccountId` might need to be checked.
    
    console.log("Setup complete.");
}

main();
