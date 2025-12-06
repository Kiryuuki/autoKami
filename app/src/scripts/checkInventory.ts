import { getAccountInventory } from '../services/accountService.js';

async function checkInventory(accountId: string) {
    console.log(`\n=== Checking Inventory for Account ${accountId} ===\n`);

    try {
        // Get inventory
        console.log('Fetching inventory...');
        const inventory = await getAccountInventory(accountId);

        if (Object.keys(inventory).length === 0) {
            console.log('  Inventory is empty or no items found.');
        } else {
            console.log(`  Found ${Object.keys(inventory).length} unique item type(s):\n`);

            // Sort by item ID for consistent display
            const sortedItems = Object.entries(inventory).sort(([a], [b]) => Number(a) - Number(b));

            for (const [itemId, quantity] of sortedItems) {
                console.log(`    Item ID ${itemId}: ${quantity}x`);
            }

            console.log('');
            console.log(`  Total item types: ${Object.keys(inventory).length}`);
            const totalQuantity = Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
            console.log(`  Total items: ${totalQuantity}`);
        }

    } catch (error) {
        console.error('Error checking inventory:', error);
    }
}

// Get account ID from command line argument or use default
const accountId = process.argv[2] || '24912831289181620569001742271490162307555423067';

checkInventory(accountId)
    .then(() => {
        console.log('\n✅ Inventory check complete\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Inventory check failed:', error);
        process.exit(1);
    });
