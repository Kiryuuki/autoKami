import { ethers } from 'ethers';

const RPC_URL = 'https://archival-jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz';
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Use address from logs directly
const CRAFT_SYSTEM_ADDRESS = '0xd5dDd9102900cbF6277e16D3eECa9686F2531951';
const TEST_WALLET = "0x8929160De6c684c3890e33e2F098a4243E056FA9"; // Yuuki from log
const TEST_RECIPE = 6; // Extract Pine Pollen
const TEST_AMOUNT = 1;

async function main() {
    console.log(`Diagnosing CraftSystem at ${CRAFT_SYSTEM_ADDRESS}...`);

    const code = await provider.getCode(CRAFT_SYSTEM_ADDRESS);
    console.log(`Contract Code Length: ${code.length}`);
    if (code === '0x') {
        console.error("No code at address! This address is wrong.");
        return;
    }

    // Signatures to test
    const tests = [
        {
            name: "craft(uint32,uint256) [Deprecated Selector]",
            selector: "0x5c817c70",
            args: [
                ethers.toBeHex(TEST_RECIPE, 32), 
                ethers.toBeHex(TEST_AMOUNT, 32)
            ]
        },
        {
            name: "executeTyped(uint32,uint256) [V2]",
            sig: "executeTyped(uint32,uint256)",
            args: [
                ethers.toBeHex(TEST_RECIPE, 32),
                ethers.toBeHex(TEST_AMOUNT, 32)
            ]
        },
        {
            name: "executeTyped(uint256,uint32,uint256) [V1]",
            sig: "executeTyped(uint256,uint32,uint256)",
            args: [
                ethers.toBeHex(0, 32), // Try AssignerID = 0
                ethers.toBeHex(TEST_RECIPE, 32),
                ethers.toBeHex(TEST_AMOUNT, 32)
            ]
        },
        {
             // Maybe AssignerID is the Account ID?
             // I'll guess AccountID based on wallet or just try a huge number or 1
            name: "executeTyped(uint256,uint32,uint256) [With AccountID Guess]",
            sig: "executeTyped(uint256,uint32,uint256)",
            args: [
                ethers.toBeHex(1, 32), // Try ID 1?
                ethers.toBeHex(TEST_RECIPE, 32),
                ethers.toBeHex(TEST_AMOUNT, 32)
            ]
        }
    ];

    for (const t of tests) {
        let data;
        if (t.selector) {
            data = t.selector + t.args.map(a => a.replace('0x', '').padStart(64, '0')).join('');
        } else {
            const iface = new ethers.Interface([`function ${t.sig}`]);
            const decodedArgs = t.args.map(a => BigInt(a)); 
            data = iface.encodeFunctionData(t.sig.split('(')[0], decodedArgs);
        }

        console.log(`
Testing ${t.name}...`);
        // console.log(`Data: ${data}`);

        try {
            await provider.call({
                to: CRAFT_SYSTEM_ADDRESS,
                from: TEST_WALLET,
                data: data
            });
            console.log("✅ CALL SUCCESS (Did not revert)");
        } catch (e) {
            console.log(`❌ CALL REVERTED: ${e.reason || e.shortMessage || e.message}`);
            // Check for specific revert data if available
            if (e.data && e.data !== '0x') {
                try {
                     // Try decoding common errors
                     const iface = new ethers.Interface([
                         "error Unauthorized()", 
                         "error AlreadyInitialized()",
                         "error Error(string)",
                         "error Panic(uint256)"
                     ]);
                     const decoded = iface.parseError(e.data);
                     console.log(`   Decoded Error: ${decoded?.name} (${decoded?.args})`);
                } catch (decodeErr) {
                     console.log(`   Raw Revert Data: ${e.data}`);
                }
            }
        }
    }
}

main().catch(console.error);