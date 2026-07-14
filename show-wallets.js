const { getOrCreateWallet, getWalletBalance } = require('./agents/solana-helper');

async function main() {
  const wallets = ['agent-a', 'agent-b', 'market-maker', 'simulated-client'];
  
  console.log('==================================================');
  console.log('      TxGuard Agent Wallet Address Monitor        ');
  console.log('==================================================\n');
  
  for (const name of wallets) {
    try {
      const wallet = getOrCreateWallet(name, true);
      
      // Check if wallet is loaded in simulated or real mode
      if (wallet.mode === 'simulated') {
        console.log(`🤖 Wallet [${name}] (Simulated Mode):`);
        console.log(`   Address:  ${wallet.publicKey}`);
        console.log(`   Balance:  10.0000 SOL (Simulated)`);
        console.log('');
        continue;
      }
      
      const pubkey = wallet.realWallet.publicKey.toBase58();
      const balance = await getWalletBalance(pubkey);
      
      console.log(`🤖 Wallet [${name}]:`);
      console.log(`   Address:  ${pubkey}`);
      console.log(`   Balance:  ${balance.toFixed(4)} SOL`);
      console.log(`   Explorer: https://solscan.io/account/${pubkey}?cluster=devnet`);
      console.log('');
    } catch (err) {
      console.log(`❌ Wallet [${name}] error: ${err.message}\n`);
    }
  }
  
  console.log('==================================================');
  console.log('Copy the Address strings above and paste them into:');
  console.log('➡️  https://faucet.solana.com/  (Set to Devnet)');
  console.log('==================================================');
}

main();
