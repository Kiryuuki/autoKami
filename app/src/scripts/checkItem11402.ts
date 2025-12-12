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
    const registry = new ethers.Contract(registryAddress, ["function getEntitiesWithValue(bytes) view returns (uint256[])"], provider);
    const addresses = await registry.getEntitiesWithValue(encodedId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + encodedId);
}

async function main() {
    console.log("Checking Item #11402...");
    
    // 1. Verify Address
    const descAddr = await getComponentAddress(COMPONENTS.Description.encodedID);
    console.log("Description Component Address:", descAddr);

    const DescComp = new ethers.Contract(descAddr, [
        "function get(uint256) view returns (string)",
        "function has(uint256) view returns (bool)"
    ], provider);

    // 3. Check Existence
    try {
        const exists = await DescComp.has(11402);
        console.log("Does 11402 exist in Description component?", exists);
        
        if (exists) {
            const desc = await DescComp.get(11402);
            console.log("Description:", desc);
        } else {
            console.log("Item 11402 does not have a Description component entry.");
        }
    } catch (e: any) {
        console.error("Error:", e.message);
        if (e.data) console.error("Revert Data:", e.data);
    }
}

main().catch(console.error);
