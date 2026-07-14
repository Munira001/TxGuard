/**
 * @module solana-helper
 * @description Wallet management and on-chain devnet transactions for TxGuard agents.
 * Supports auto-funding via airdrops and features a try-catch fallback mode
 * so agents can run gracefully even if the library is not yet installed.
 */

const fs = require('fs');
const path = require('path');

// Catch rate limit errors from RPC websockets/requests globally to prevent process exit
process.on('uncaughtException', (err) => {
  if (err && err.message && (err.message.includes('429') || err.message.includes('rate limit') || err.message.includes('limits exceeded') || err.message.includes('ws error') || err.message.includes('Unexpected server response'))) {
    console.log('  ⚠️  Solana RPC Connection Rate Limit exceeded (429). Continuing execution...');
  } else {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  if (reason && reason.message && (reason.message.includes('429') || reason.message.includes('rate limit') || reason.message.includes('limits exceeded') || reason.message.includes('ws error') || reason.message.includes('Unexpected server response'))) {
    console.log('  ⚠️  Solana RPC Unhandled Rejection (429 rate limit). Continuing execution...');
  } else {
    console.error('❌ Unhandled Rejection:', reason);
  }
});

let solanaWeb3 = null;
try {
  solanaWeb3 = require('@solana/web3.js');
} catch (err) {
  // Graceful fallback when package is not yet installed
}

const WALLET_DIR = path.join(__dirname, '..', '.wallets');
if (!fs.existsSync(WALLET_DIR)) {
  fs.mkdirSync(WALLET_DIR, { recursive: true });
}

let cachedConnection = null;
function getConnection() {
  if (!cachedConnection && solanaWeb3) {
    const endpoint = process.env.RPC_URL || 'https://api.devnet.solana.com';
    console.log(`🔌 Initializing Solana Devnet Connection to: ${endpoint}`);
    cachedConnection = new solanaWeb3.Connection(
      endpoint,
      'confirmed'
    );
  }
  return cachedConnection;
}

/**
 * Helper to generate a fake base58 address for fallback mode.
 * @param {string} seed
 * @returns {string}
 */
function getFakeAddress(seed) {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = 'TxS';
  for (let i = 0; i < 40; i++) {
    const code = (seed.charCodeAt(i % seed.length) + i) % chars.length;
    address += chars[code];
  }
  return address;
}

/**
 * Loads a persistent keypair or generates a new one.
 * Works in both real and fallback simulated mode.
 * 
 * @param {string} name - Wallet identifier (e.g. 'agent-a')
 * @returns {{publicKey: string, realWallet: any, mode: 'real'|'simulated'}}
 */
function saveWalletInfo(name, pubkey) {
  const infoPath = path.join(__dirname, '..', 'public', 'wallets-info.json');
  let data = {};
  if (fs.existsSync(infoPath)) {
    try {
      data = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
    } catch (err) {}
  }
  data[name] = pubkey;
  try {
    fs.writeFileSync(infoPath, JSON.stringify(data, null, 2));
  } catch (err) {}
}

const isLiveMode = process.argv.includes('--mode') && process.argv[process.argv.indexOf('--mode') + 1] === 'live';

function getOrCreateWallet(name, forceReal = false) {
  const filePath = path.join(WALLET_DIR, `${name}.json`);

  // Always try to derive real public key from keypair file if web3.js is available
  // This ensures real Solana addresses are used even in demo mode for explorer links
  if (solanaWeb3 && fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileContent);
      // Check if it's a raw 64-byte keypair array (not a {publicKey:...} object)
      if (Array.isArray(parsed) && parsed.length === 64) {
        const keypair = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(parsed));
        const result = {
          publicKey: keypair.publicKey.toBase58(),
          realWallet: (isLiveMode || forceReal) ? keypair : null,
          mode: (isLiveMode || forceReal) ? 'real' : 'simulated'
        };
        saveWalletInfo(name, result.publicKey);
        return result;
      }
    } catch (err) {
      // Fall through to generation logic below
    }
  }

  if (!isLiveMode && !forceReal) {
    let fakePubkey;
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);
        fakePubkey = parsed.publicKey || getFakeAddress(name);
      } catch (err) {
        fakePubkey = getFakeAddress(name);
      }
    } else {
      fakePubkey = getFakeAddress(name);
    }
    const result = {
      publicKey: fakePubkey,
      realWallet: null,
      mode: 'simulated'
    };
    saveWalletInfo(name, result.publicKey);
    return result;
  }

  if (solanaWeb3) {
    let keypair;
    if (fs.existsSync(filePath)) {
      try {
        const secret = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        keypair = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(secret));
      } catch (err) {
        console.error(`⚠️ Error loading wallet ${name}, generating new one...`);
        keypair = solanaWeb3.Keypair.generate();
        fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
      }
    } else {
      keypair = solanaWeb3.Keypair.generate();
      fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
    }
    const result = {
      publicKey: keypair.publicKey.toBase58(),
      realWallet: keypair,
      mode: 'real'
    };
    saveWalletInfo(name, result.publicKey);
    return result;
  } else {
    // Fallback mode: load or save a fake public key
    let fakePubkey;
    if (fs.existsSync(filePath)) {
      try {
        fakePubkey = JSON.parse(fs.readFileSync(filePath, 'utf8')).publicKey;
      } catch (err) {
        fakePubkey = getFakeAddress(name + Math.random());
        fs.writeFileSync(filePath, JSON.stringify({ publicKey: fakePubkey }));
      }
    } else {
      fakePubkey = getFakeAddress(name + Math.random());
      fs.writeFileSync(filePath, JSON.stringify({ publicKey: fakePubkey }));
    }
    const result = {
      publicKey: fakePubkey,
      realWallet: null,
      mode: 'simulated'
    };
    saveWalletInfo(name, result.publicKey);
    return result;
  }
}

/**
 * Checks balance of a wallet on Solana Devnet.
 * 
 * @param {string} pubkeyString 
 * @returns {Promise<number>} Balance in SOL
 */
async function getWalletBalance(pubkeyString) {
  if (!solanaWeb3) {
    return 10.0; // Simulated default balance
  }
  try {
    const connection = getConnection();
    const pubkey = new solanaWeb3.PublicKey(pubkeyString);
    const lamports = await connection.getBalance(pubkey);
    return lamports / solanaWeb3.LAMPORTS_PER_SOL;
  } catch (err) {
    // Fallback in case of RPC errors
    return 10.0;
  }
}

/**
 * Requests an airdrop of Devnet SOL if the balance is low.
 * 
 * @param {string} pubkeyString 
 * @returns {Promise<boolean>} Success status
 */
async function requestAirdropIfNeeded(pubkeyString) {
  if (!solanaWeb3) return false;
  
  try {
    const connection = getConnection();
    const balance = await getWalletBalance(pubkeyString);
    
    if (balance < 0.1) {
      console.log(`  💧 Requesting Devnet airdrop for ${pubkeyString.substring(0, 8)}...`);
      const pubkey = new solanaWeb3.PublicKey(pubkeyString);
      const signature = await connection.requestAirdrop(pubkey, 1 * solanaWeb3.LAMPORTS_PER_SOL);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });
      console.log(`  💧 Airdrop confirmed!`);
      return true;
    }
    return false;
  } catch (err) {
    console.log(`  ⚠️ Devnet airdrop rate limited or failed: ${err.message}`);
    return false;
  }
}

/**
 * Performs a SOL transfer on Solana Devnet.
 * Falls back to returning a simulated signature on failure or in sim mode.
 * 
 * @param {Object} senderWallet - Wallet object from getOrCreateWallet
 * @param {string} receiverPubkeyString - Receiver base58 address
 * @param {number} amount - Amount in SOL
 * @returns {Promise<string>} Transaction signature
 */
async function transferSol(senderWallet, receiverPubkeyString, amount) {
  const roundedAmount = Math.max(0.0001, parseFloat(amount.toFixed(5)));
  const timestamp = Date.now().toString(36);
  const mockSignature = `mock_tx_${timestamp}_` + Math.random().toString(36).substring(2, 10);

  if (senderWallet.mode === 'simulated' || !solanaWeb3) {
    return mockSignature;
  }

  try {
    const connection = getConnection();
    const fromPubkey = senderWallet.realWallet.publicKey;
    const toPubkey = new solanaWeb3.PublicKey(receiverPubkeyString);

    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.round(roundedAmount * solanaWeb3.LAMPORTS_PER_SOL)
      })
    );

    // Set recent blockhash and sign/send transaction without blocking for confirmation
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signature = await connection.sendTransaction(
      transaction,
      [senderWallet.realWallet],
      { skipPreflight: true }
    );
    return signature;
  } catch (err) {
    console.error(`  ⚠️ Devnet Transaction Failed: ${err.message}. Falling back to virtual trade settlement.`);
    return mockSignature;
  }
}

module.exports = {
  getOrCreateWallet,
  getWalletBalance,
  requestAirdropIfNeeded,
  transferSol
};
