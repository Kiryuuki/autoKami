import { getAccountInventory, getKamisByAccountId } from '../services/accountService.js';

async function demonstrateInventory(accountId: string) {
    console.log('\n' + '='.repeat(70));
    console.log('           KAMIGOTCHI INVENTORY CHECK DEMONSTRATION');
    console.log('='.repeat(70));
    console.log(`\nAccount ID: ${accountId}\n`);

    try {
        // 1. Check for Kamis owned by this account
        console.log('📦 Checking Kamis owned by this account...');
        try {
            const kamis = await getKamisByAccountId(accountId);
            if (kamis.length > 0) {
                console.log(`✅ Found ${kamis.length} Kami(s) owned by this account:`);
                for (const kami of kamis) {
                    console.log(`   - ${kami.name || 'Unnamed'} (Level ${kami.level})`);
                }
            } else {
                console.log('   No Kamis found for this account.');
            }
        } catch (error: any) {
            console.log(`   Error checking Kamis: ${error.message}`);
        }

        console.log('\n' + '-'.repeat(70) + '\n');

        // 2. Check inventory
        console.log('🎒 Checking Inventory Items...\n');
        const inventory = await getAccountInventory(accountId);

        if (Object.keys(inventory).length === 0) {
            console.log('   ⚠️  Inventory is currently empty or no items found.\n');

            console.log('   How the inventory system works:');
            console.log('   • Items are stored on-chain in Keys/Values/Slots components');
            console.log('   • Each item has an ID and quantity');
            console.log('   • Items can be obtained through crafting, harvesting, or quests\n');

            // Show example of what inventory would look like with items
            console.log('\n' + '-'.repeat(70));
            console.log('   EXAMPLE: What inventory would look like with items:');
            console.log('-'.repeat(70) + '\n');

            const mockInventory = {
                1: 5,    // 5x Item #1
                3: 12,   // 12x Item #3
                7: 1,    // 1x Item #7
                15: 20   // 20x Item #15
            };

            displayInventory(mockInventory, true);

        } else {
            console.log(`   ✅ Found ${Object.keys(inventory).length} item type(s):\n`);
            displayInventory(inventory, false);
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('                    INVENTORY CHECK COMPLETE');
    console.log('='.repeat(70) + '\n');
}

function displayInventory(inventory: Record<number, number>, isMock: boolean) {
    const prefix = isMock ? '   [MOCK] ' : '   ';

    // Sort by item ID
    const sortedItems = Object.entries(inventory).sort(([a], [b]) => Number(a) - Number(b));

    console.log(`${prefix}┌─────────────────────────────────────────────┐`);
    console.log(`${prefix}│           INVENTORY CONTENTS                │`);
    console.log(`${prefix}├─────────────────────────────────────────────┤`);

    for (const [itemId, quantity] of sortedItems) {
        const itemIdStr = `Item #${itemId}`.padEnd(15);
        const qtyStr = `${quantity}x`.padStart(6);
        console.log(`${prefix}│  ${itemIdStr}           ${qtyStr}        │`);
    }

    console.log(`${prefix}├─────────────────────────────────────────────┤`);

    const totalTypes = Object.keys(inventory).length;
    const totalQuantity = Object.values(inventory).reduce((sum, qty) => sum + qty, 0);

    console.log(`${prefix}│  Total item types:            ${String(totalTypes).padStart(6)}        │`);
    console.log(`${prefix}│  Total items:                 ${String(totalQuantity).padStart(6)}        │`);
    console.log(`${prefix}└─────────────────────────────────────────────┘`);
}

// Get account ID from command line or use default
const accountId = process.argv[2] || '24912831289181620569001742271490162307555423067';

demonstrateInventory(accountId)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
