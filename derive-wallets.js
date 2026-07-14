/**
 * @file derive-wallets.js
 * @description One-shot utility that reads all agent keypair files from .wallets/,
 * derives their real Solana public keys, and writes public/wallets-info.json.
 *
 * Run: node derive-wallets.js
 */

const fs = require('fs');
const path = require('path');

let solanaWeb3;
try {
  solanaWeb3 = require('@solana/web3.js');
} catch (e) {
  console.error('❌ @solana/web3.js not installed. Run: npm install');
  process.exit(1);
}

const WALLET_DIR = path.join(__dirname, '.wallets');
const OUTPUT_PATH = path.join(__dirname, 'public', 'wallets-info.json');

const WALLET_NAMES = ['agent-a', 'agent-b', 'market-maker', 'simulated-client'];

const result = {};

for (const name of WALLET_NAMES) {
  const filePath = path.join(WALLET_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  No keypair file for ${name}, skipping.`);
    continue;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(raw) || raw.length !== 64) {
      console.warn(`⚠️  ${name}.json is not a 64-byte keypair array, skipping.`);
      continue;
    }
    const keypair = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(raw));
    const pubkey = keypair.publicKey.toBase58();
    result[name] = pubkey;
    console.log(`✅ ${name}: ${pubkey}`);
    console.log(`   🔗 https://solscan.io/account/${pubkey}?cluster=devnet`);
  } catch (err) {
    console.error(`❌ Error reading ${name}: ${err.message}`);
  }
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
console.log(`\n💾 Saved to ${OUTPUT_PATH}`);
console.log('\n🌐 All agent wallet addresses are now linkable on Solscan Devnet!');
