import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { getAccountInventory } from '../services/accountService.js';

// Load env
const envPath = path.resolve(process.cwd(), 'app/.env.test');
dotenv.config({ path: envPath, override: true });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = process.env.WORLD_ADDRESS || '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const COMPONENTS = loadIds('components.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);

async function getComponentAddress(encodedId: string) {
    const registryAddress = await world.components();
    const registry = new ethers.Contract(registryAddress, ["function getEntitiesWithValue(bytes) view returns (uint256[])"], provider);
    const addresses = await registry.getEntitiesWithValue(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + encodedId);
}

async function main() {
    const accountId = '24912831289181620569001742271490162307555423067'; // From previous context
    const targetItemName = "Greater XP Potion";

    console.log(`Checking inventory for account ${accountId}...`);
    const inventory = await getAccountInventory(accountId);
    
    if (Object.keys(inventory).length === 0) {
        console.log("Inventory is empty.");
        return;
    }

    console.log(`Found ${Object.keys(inventory).length} item types. Checking names...`);

    const nameAddr = await getComponentAddress(COMPONENTS.Name.encodedID);
    const NameComp = new ethers.Contract(nameAddr, ["function get(uint256) view returns (string)"], provider);

    for (const [itemId, quantity] of Object.entries(inventory)) {
        try {
            const name = await NameComp.get(itemId);
            console.log(`[${itemId}] ${name} (x${quantity})`);
            
            if (name === targetItemName) {
                console.log(`
✅ FOUND IT!`);
                console.log(`Item: ${name}`);
                console.log(`ID: ${itemId}`);
                console.log(`Quantity: ${quantity}`);
                return;
            }
        } catch (e) {
            console.log(`[${itemId}] <Unknown Name> (x${quantity})`);
        }
    }

    console.log(`
❌ Item '${targetItemName}' not found in inventory.`);
}

main().catch(console.error);
