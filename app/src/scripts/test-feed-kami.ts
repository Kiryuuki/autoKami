import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from app root .env.test BEFORE other imports
const envPath = path.resolve(process.cwd(), 'app/.env.test');
const rootEnvPath = path.resolve(process.cwd(), 'app/.env');
dotenv.config({ path: envPath, override: true });
dotenv.config({ path: rootEnvPath }); // Load .env for fallbacks

import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import { getSystemAddress } from '../services/transactionService.js';
import supabase, { decryptPrivateKey, getOperatorWallets, reinitSupabase } from '../services/supabaseService.js';
import { getKamisByAccountId, computeAccountIdFromAddress } from '../services/accountService.js';

reinitSupabase();

const SYSTEMS = loadIds('systems.json');
const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function feedKami(kamiEntityId: string, itemIndex: number, privateKey: string) {
    console.log(`[Feed] 🍽️ Preparing to feed Kami Entity ${kamiEntityId} with Item #${itemIndex}...`);
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log(`[Feed] 🔑 Wallet: ${wallet.address}`);

    const KamiUseItemSystem = loadAbi('KamiUseItemSystem.json');
    const systemId = SYSTEMS.KamiUseItemSystem.encodedID;
    const systemAddress = await getSystemAddress(systemId);
    
    console.log(`[Feed] 🏭 System Address: ${systemAddress}`);

    const contract = new ethers.Contract(systemAddress, KamiUseItemSystem.abi, wallet);

    try {
        // executeTyped(uint256 kamiID, uint32 itemIndex)
        console.log(`[Feed] 📤 Sending transaction...`);
        const tx = await contract.executeTyped(
            BigInt(kamiEntityId),
            BigInt(itemIndex),
            { gasLimit: 2000000 }
        );
        console.log(`[Feed] ⏳ Tx sent: ${tx.hash}. Waiting for confirmation...`);

        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log(`[Feed] ✅ Success! Item consumed.`);
        } else {
            console.error(`[Feed] ❌ Transaction reverted.`);
        }
    } catch (error: any) {
        console.error(`[Feed] 💥 Error:`, error.message);
        if (error.data) {
            console.error(`[Feed] 📜 Revert Data:`, error.data);
        }
    }
}

async function main() {
    const kamiIndexInput = process.argv[2];
    const itemIndex = process.argv[3];

    if (!kamiIndexInput || !itemIndex) {
        console.error("Usage: npx tsx app/src/scripts/test-feed-kami.ts <kamiIndex> <itemIndex>");
        console.log("Example: npx tsx app/src/scripts/test-feed-kami.ts 9225 11402");
        process.exit(1);
    }

    const targetIndex = Number(kamiIndexInput);
    console.log(`[Init] 🔍 Looking up Kami #${targetIndex} in Supabase...`);

    let privateKey: string | null = null;
    let kamiEntityId: string | null = null;

    // 1. Try Direct Lookup
    const { data: kami, error } = await supabase
        .from('kamigotchis')
        .select('kami_entity_id, encrypted_private_key, kami_index')
        .eq('kami_index', targetIndex)
        .single();

    if (kami) {
        console.log(`[Init] ✅ Found in DB: Kami #${kami.kami_index} (Entity: ${kami.kami_entity_id})`);
        kamiEntityId = kami.kami_entity_id;
        try {
            privateKey = await decryptPrivateKey(kami.encrypted_private_key);
        } catch (e: any) {
            console.error(`[Init] ❌ Failed to decrypt private key: ${e.message}`);
            process.exit(1);
        }
    } else {
        console.log(`[Init] ⚠️ Not found in 'kamigotchis' table. Searching Operator Wallets...`);
        
        // 2. Fallback: Check all Operator Wallets in DB
        const { data: wallets } = await supabase.from('operator_wallets').select('*');
        
        if (wallets && wallets.length > 0) {
            console.log(`[Init] Checking ${wallets.length} DB wallets...`);
            for (const wallet of wallets) {
                try {
                    const kamis = await getKamisByAccountId(wallet.account_id);
                    const match = kamis.find((k: any) => Number(k.index) === targetIndex);

                    if (match) {
                        console.log(`[Init] 🎯 Found Kami #${targetIndex} in wallet '${wallet.name}'!`);
                        kamiEntityId = match.id.toString();
                        privateKey = await decryptPrivateKey(wallet.encrypted_private_key);
                        break;
                    }
                } catch (err) {
                    console.error(`[Init] Error checking wallet ${wallet.name}:`, err);
                }
            }
        }

        // 3. Fallback: Env Var
        if (!privateKey && process.env.OPERATOR_PRIVATE_KEY) {
             console.log(`[Init] ⚠️ DB lookup failed. Checking env OPERATOR_PRIVATE_KEY...`);
             const envKey = process.env.OPERATOR_PRIVATE_KEY;
             const wallet = new ethers.Wallet(envKey, provider);
             
             // Check Wallet's Account
             const accountId = await computeAccountIdFromAddress(wallet.address);
             console.log(`[Init] Checking env wallet ${wallet.address} (Account: ${accountId})...`);
             let kamis = await getKamisByAccountId(accountId.toString());
             let match = kamis.find((k: any) => Number(k.index) === targetIndex);
             
             if (match) {
                 console.log(`[Init] 🎯 Found Kami #${targetIndex} in env wallet!`);
                 kamiEntityId = match.id.toString();
                 privateKey = envKey;
             } else if (process.env.TEST_ACCOUNT_ADDRESS) {
                 // Check Test Account
                 const testAccountId = process.env.TEST_ACCOUNT_ADDRESS;
                 console.log(`[Init] Checking Test Account ${testAccountId}...`);
                 kamis = await getKamisByAccountId(testAccountId);
                 match = kamis.find((k: any) => Number(k.index) === targetIndex);
                 
                 if (match) {
                     console.log(`[Init] 🎯 Found Kami #${targetIndex} in Test Account! Assuming Operator Key is valid.`);
                     kamiEntityId = match.id.toString();
                     privateKey = envKey;
                 }
             }
        }
    }

    if (kamiEntityId && privateKey) {
        await feedKami(kamiEntityId, Number(itemIndex), privateKey);
    } else {
        console.error(`[Init] ❌ Kami #${targetIndex} not found in any registered wallet.`);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(console.error);
}
