
import { getAccountInventory } from '../services/accountService.js';
import { RECIPE_LIST } from '../utils/recipes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function testCraftingCheck() {
    const accountId = '24912831289181620569001742271490162307555423067';
    const recipeId = 6;
    const amountToCraft = 1;

    console.log(`\n🧪 Testing Crafting Check`);
    console.log(`Account ID: ${accountId}`);
    console.log(`Recipe ID: ${recipeId} (Extract Pine Pollen)`);

    // 1. Get Recipe
    const recipe = RECIPE_LIST.find(r => r.id === recipeId);
    if (!recipe) {
        console.error('❌ Recipe not found!');
        return;
    }
    console.log(`Recipe Requirements:`);
    recipe.inputIndices.forEach((id, i) => {
        console.log(`- Item #${id}: ${recipe.inputAmounts[i] * amountToCraft}`);
    });

    // 2. Fetch Inventory
    console.log(`\n📦 Fetching Inventory...`);
    try {
        const inventory = await getAccountInventory(accountId);
        console.log('Inventory contents:', inventory);

        // 3. Verify
        const missingItems: any[] = [];
        for (let i = 0; i < recipe.inputIndices.length; i++) {
            const inputId = recipe.inputIndices[i];
            const required = recipe.inputAmounts[i] * amountToCraft;
            const current = inventory[inputId] || 0;

            console.log(`Checking Item #${inputId}: Have ${current} / Need ${required}`);
            
            if (current < required) {
                missingItems.push({ id: inputId, current, required });
            }
        }

        if (missingItems.length > 0) {
            console.log(`\n❌ INSUFFICIENT ITEMS:`);
            missingItems.forEach(m => console.log(`- Item #${m.id}: Need ${m.required}, Have ${m.current}`));
        } else {
            console.log(`\n✅ SUFFICIENT ITEMS. Ready to craft.`);
        }

    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
    }
}

testCraftingCheck();
