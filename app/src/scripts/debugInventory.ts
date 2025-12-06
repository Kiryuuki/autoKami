
import { ethers } from 'ethers';
import { loadAbi, loadIds } from '../utils/contractLoader.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const RPC_URL = process.env.RPC_URL || 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const WORLD_ADDRESS = '0x2729174c265dbBd8416C6449E0E813E88f43D0E7';
const components = loadIds('components.json');

const provider = new ethers.JsonRpcProvider(RPC_URL);
const world = new ethers.Contract(WORLD_ADDRESS, loadAbi('World.json').abi, provider);

// Custom ABIs
const AddressABI = ["function get(uint256 entity) view returns (address)"];
const OwnsInvABI = [
    "function get(uint256 entity) view returns (uint256)",
    "function getEntitiesWithValue(uint256 value) view returns (uint256[])"
];
const GetterSystemABI = [
    "function getAccount(uint256 id) view returns (tuple(uint32 index, string name, int32 currStamina, uint32 room))"
];
const GETTER_SYSTEM_ADDRESS = process.env.GETTER_SYSTEM_ADDRESS || '0x12C0989A259471D89D1bA1BB95043D64DAF97c19';
const getterContract = new ethers.Contract(GETTER_SYSTEM_ADDRESS, GetterSystemABI, provider);

async function getComponentAddress(componentId: string) {
    const registryAddress = await world.components();
    const IDOwnsKamiComponent = loadAbi('IDOwnsKamiComponent.json');
    const registry = new ethers.Contract(registryAddress, IDOwnsKamiComponent.abi, provider);
    const addresses = await registry.getFunction('getEntitiesWithValue(bytes)')(componentId);
    if (addresses.length > 0) {
        return ethers.getAddress('0x' + BigInt(addresses[0]).toString(16).padStart(40, '0'));
    }
    throw new Error('Component not found for ' + componentId);
}

async function debugInventory() {
    const accountIdStr = '24912831289181620569001742271490162307555423067';
    const accountId = BigInt(accountIdStr);
    
    console.log(`🔍 Debugging Inventory for Account ID: ${accountIdStr}`);

    try {
        // 1. Resolve Component Addresses
        const keysId = (components as any).Keys.encodedID;
        const valuesId = (components as any).Values.encodedID;
        const slotsId = (components as any).Slots.encodedID;
        const ownerAddressId = (components as any).OwnerAddress.encodedID;
        const ownsInvId = (components as any).OwnsInvID.encodedID;
        const indexItemId = (components as any).ItemIndex.encodedID; // Check name in components.json
        const valueId = (components as any).Value.encodedID;

        const keysAddr = await getComponentAddress(keysId);
        const valuesAddr = await getComponentAddress(valuesId);
        const slotsAddr = await getComponentAddress(slotsId);
        const ownerAddressAddr = await getComponentAddress(ownerAddressId);
        const ownsInvAddr = await getComponentAddress(ownsInvId);
        const indexItemAddr = await getComponentAddress(indexItemId);
        const valueAddr = await getComponentAddress(valueId);

        console.log(`IndexItem: ${indexItemAddr}`);
        console.log(`Value: ${valueAddr}`);

        const Keys = new ethers.Contract(keysAddr, loadAbi('KeysComponent.json').abi, provider);
        const Values = new ethers.Contract(valuesAddr, loadAbi('ValuesComponent.json').abi, provider);
        const Slots = new ethers.Contract(slotsAddr, loadAbi('KeysComponent.json').abi, provider);
        const OwnerAddress = new ethers.Contract(ownerAddressAddr, AddressABI, provider);
        const OwnsInv = new ethers.Contract(ownsInvAddr, OwnsInvABI, provider);
        
        const Uint32ABI = ["function get(uint256 entity) view returns (uint32)", "function has(uint256 entity) view returns (bool)"];
        const IndexItem = new ethers.Contract(indexItemAddr, Uint32ABI, provider);
        
        const Uint256ABI = ["function get(uint256 entity) view returns (uint256)", "function has(uint256 entity) view returns (bool)"];
        const Value = new ethers.Contract(valueAddr, Uint256ABI, provider);

        // 2. Determine IDs to Check
        const idsToCheck: { label: string, id: bigint }[] = [
            { label: "Direct Account ID", id: accountId },
            { label: "Hashed Account ID", id: BigInt(ethers.solidityPackedKeccak256(["string", "uint256"], ["inventory", accountId])) }
        ];

        // A. Check Owner
        try {
            const owner = await OwnerAddress.get(accountId);
            console.log(`\n[Owner] Account Owner: ${owner}`);
            if (owner && owner !== ethers.ZeroAddress) {
                const ownerBigInt = BigInt(owner);
                idsToCheck.push({ label: "Owner Address", id: ownerBigInt });
                idsToCheck.push({ label: "Hashed Owner Address", id: BigInt(ethers.solidityPackedKeccak256(["string", "uint256"], ["inventory", ownerBigInt])) });
            }
        } catch (e: any) { console.log(`[Owner] Failed: ${e.message}`); }

        // B. Check Account Index
        try {
            const account = await getterContract.getAccount(accountId);
            const index = BigInt(account.index);
            console.log(`[Index] Account Index: ${index}`);
            idsToCheck.push({ label: "Account Index", id: index });
            idsToCheck.push({ label: "Hashed Account Index", id: BigInt(ethers.solidityPackedKeccak256(["string", "uint256"], ["inventory", index])) });
        } catch (e: any) { console.log(`[Index] Failed: ${e.message}`); }

        // C. Check Inventory Relations
        try {
            const invEntities = await OwnsInv.getEntitiesWithValue(accountId);
            console.log(`[InvEntity] Entities owned by Account: ${invEntities.length}`);
            if (invEntities && invEntities.length > 0) {
                for (const invEntity of invEntities) {
                    idsToCheck.push({ label: `Inventory Entity (Owned)`, id: BigInt(invEntity) });
                }
            }
            // Also check reverse: Account ID -> Inventory ID
            try {
                const val = await OwnsInv.get(accountId);
                if (val && val !== 0n) idsToCheck.push({ label: `Inventory Value Check`, id: BigInt(val) });
            } catch (err) {}

        } catch (e: any) { console.log(`[InvEntity] Failed: ${e.message}`); }

        // 3. EXECUTE CHECKS
        console.log(`\n--- STARTING CHECKS (${idsToCheck.length}) ---`);
        for (const check of idsToCheck) {
            // console.log(`\nChecking ${check.label}: ${check.id.toString()}`);

            // Check Keys (Batch)
            try {
                const has = await Keys.has(check.id);
                if (has) {
                    console.log(`✅ [Keys] Found in ${check.label}!`);
                    const items = await Keys.getFunction('get(uint256)')(check.id);
                    const amounts = await Values.getFunction('get(uint256)')(check.id);
                    items.forEach((id: any, i: number) => console.log(`   Item #${id}: ${amounts[i]}`));
                }
            } catch (e: any) { }

            // Check Slots (Batch)
            try {
                const has = await Slots.has(check.id);
                if (has) {
                    console.log(`✅ [Slots] Found in ${check.label}!`);
                    const items = await Slots.getFunction('get(uint256)')(check.id);
                    const amounts = await Values.getFunction('get(uint256)')(check.id);
                    items.forEach((id: any, i: number) => console.log(`   Item #${id}: ${amounts[i]}`));
                }
            } catch (e: any) { }

            // Check IndexItem (Single Item Entity)
            try {
                const has = await IndexItem.has(check.id);
                if (has) {
                    console.log(`✅ [IndexItem] Found in ${check.label}!`);
                    const itemId = await IndexItem.get(check.id);
                    
                    // Get Amount from Value or Values?
                    // Usually Value component for single entity.
                    let amount = 0n;
                    try {
                        amount = await Value.get(check.id);
                    } catch (err) {
                        try {
                             const amounts = await Values.getFunction('get(uint256)')(check.id); // Unexpected if it's a single entity but possible
                             amount = amounts[0];
                        } catch (err2) {}
                    }
                    console.log(`   Item #${itemId}: ${amount}`);
                }
            } catch (e: any) { }
        }

    } catch (error: any) {
        console.error("Critical Error:", error);
    }
}

debugInventory();
