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
    console.log("Checking Item #11402 for Value/Values...");
    
    try {
        // Check Value
        const valueAddr = await getComponentAddress(COMPONENTS.Value.encodedID);
        const ValueComp = new ethers.Contract(valueAddr, [
            "function get(uint256) view returns (uint256)",
            "function has(uint256) view returns (bool)"
        ], provider);

        if (await ValueComp.has(11402)) {
            console.log("Value:", await ValueComp.get(11402));
        } else {
            console.log("No Value component.");
        }

        // Check EntityType
        const typeAddr = await getComponentAddress(COMPONENTS.EntityType.encodedID);
        const TypeComp = new ethers.Contract(typeAddr, [
            "function get(uint256) view returns (uint8)",
            "function has(uint256) view returns (bool)"
        ], provider);

        if (await TypeComp.has(11402)) {
            console.log("Entity Type:", await TypeComp.get(11402));
        } else {
            console.log("No EntityType component.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

main().catch(console.error);
