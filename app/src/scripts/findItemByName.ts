import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import * as dotenv from 'dotenv';
import path from 'path';

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
    // Using generic ABI for getEntitiesWithValue which is common in registry
    const registry = new ethers.Contract(registryAddress, ["function getEntitiesWithValue(bytes) view returns (uint256[])"], provider);
    const addresses = await registry.getEntitiesWithValue(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + encodedId);
}

async function main() {
    const searchName = "Greater XP Potion";
    console.log(`Searching for item: "${searchName}"...`);

    const nameAddr = await getComponentAddress(COMPONENTS.Name.encodedID);
    console.log(`Name Component Address: ${nameAddr}`);
    const NameComp = new ethers.Contract(nameAddr, ["function get(uint256) view returns (string)"], provider);

    // Common item ranges based on observation (1000+, 2000+, 10000+)
    // Let's check a reasonable range.
    const ranges = [
        { start: 1, end: 100 },
        { start: 1000, end: 1200 },
        { start: 2000, end: 2100 },
        { start: 10000, end: 12000 },
        { start: 12000, end: 15000 },
        { start: 20000, end: 22000 }
    ];

    let foundId = -1;

    for (const range of ranges) {
        console.log(`Checking range ${range.start} - ${range.end}...`);
        // We can do this in parallel batches for speed
        const batchSize = 50;
        for (let i = range.start; i < range.end; i += batchSize) {
            const promises = [];
            for (let j = 0; j < batchSize && (i + j) < range.end; j++) {
                const id = i + j;
                promises.push(
                    NameComp.get(id)
                        .then((name: string) => ({ id, name }))
                        .catch(() => ({ id, name: null }))
                );
            }

            const results = await Promise.all(promises);
            for (const res of results) {
                if (res.name) {
                    // console.log(`[${res.id}] ${res.name}`);
                    if (res.name.toLowerCase() === searchName.toLowerCase()) {
                        console.log(`
🎯 FOUND IT!`);
                        console.log(`Item: ${res.name}`);
                        console.log(`ID: ${res.id}`);
                        foundId = res.id;
                        break;
                    }
                }
            }
            if (foundId !== -1) break;
        }
        if (foundId !== -1) break;
    }

    if (foundId === -1) {
        console.log("❌ Item not found in scanned ranges.");
    }
}

main().catch(console.error);
