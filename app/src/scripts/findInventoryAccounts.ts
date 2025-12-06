import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import { getAccountInventory } from '../services/accountService.js';

const components = loadIds('components.json');
const World = loadAbi('World.json');

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, World.abi, provider);

async function getComponentAddress(componentId: string): Promise<string> {
    const systemsRegistryAddress = await world.components();
    const abi = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(systemsRegistryAddress, abi.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(componentId);
    if (addresses.length > 0) {
        const id = BigInt(addresses[0]);
        return ethers.getAddress('0x' + id.toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found');
}

async function findAccountsWithInventory() {
    console.log('\n=== Searching for Accounts with Inventory ===\n');

    try {
        // Get Keys component address
        const keysId = (components as any).Keys.encodedID;
        const keysAddr = await getComponentAddress(keysId);
        console.log(`Keys Component Address: ${keysAddr}`);

        const KeysABI = loadAbi('KeysComponent.json');
        const Keys = new ethers.Contract(keysAddr, KeysABI.abi, provider);

        console.log('\nSearching for entities with items stored in Keys component...\n');

        // Try to get entities with values - we'll check some account IDs
        // Let's try a range of account IDs or check the AccountIndex component
        const accountIndexId = (components as any).AccountIndex.encodedID;
        const accountIndexAddr = await getComponentAddress(accountIndexId);

        const AccountIndexABI = loadAbi('Uint32Component.json');
        const AccountIndex = new ethers.Contract(accountIndexAddr, AccountIndexABI.abi, provider);

        console.log(`Checking registered accounts...\n`);

        let foundCount = 0;
        const maxChecks = 10;

        // Check accounts by trying different account IDs
        // In MUD, account IDs are often derived from addresses
        // Let's try to get entities that have account index values

        // Try to check a few known patterns
        for (let i = 0; i < maxChecks && foundCount < 3; i++) {
            try {
                // Try sequential entity IDs
                const entityId = BigInt(i);
                const hasValue = await Keys.has(entityId);

                if (hasValue) {
                    console.log(`Found entity ${entityId} with Keys data`);
                    const inventory = await getAccountInventory(entityId.toString());

                    if (Object.keys(inventory).length > 0) {
                        foundCount++;
                        console.log(`\n✅ Account/Entity ID: ${entityId}`);
                        console.log(`   Items:`);
                        for (const [itemId, qty] of Object.entries(inventory)) {
                            console.log(`     - Item ${itemId}: ${qty}x`);
                        }
                    }
                }
            } catch (error) {
                // Continue checking
            }
        }

        // Also try checking with inventory hash pattern
        console.log(`\nChecking hashed inventory IDs...\n`);

        for (let accountNum = 0; accountNum < 5; accountNum++) {
            try {
                const accountId = BigInt(accountNum);
                const hashedId = ethers.solidityPackedKeccak256(
                    ["string", "uint256"],
                    ["inventory", accountId]
                );

                const hasValue = await Keys.has(hashedId);
                if (hasValue) {
                    console.log(`Found inventory data for hashed ID of account ${accountId}`);
                    const inventory = await getAccountInventory(accountId.toString());

                    if (Object.keys(inventory).length > 0) {
                        foundCount++;
                        console.log(`\n✅ Account ID: ${accountId}`);
                        console.log(`   Items:`);
                        for (const [itemId, qty] of Object.entries(inventory)) {
                            console.log(`     - Item ${itemId}: ${qty}x`);
                        }
                    }
                }
            } catch (error) {
                // Continue checking
            }
        }

        if (foundCount === 0) {
            console.log('⚠️  No accounts with inventory found in the checked range.');
            console.log('   This could mean:');
            console.log('   - No accounts have items yet');
            console.log('   - Items are stored with different entity IDs');
            console.log('   - The inventory system uses a different storage pattern');
        }

    } catch (error) {
        console.error('Error searching for accounts:', error);
    }
}

findAccountsWithInventory()
    .then(() => {
        console.log('\n✅ Search complete\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Search failed:', error);
        process.exit(1);
    });
