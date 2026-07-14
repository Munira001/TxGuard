/**
 * @module index
 * @description Unified Agent Runner — Entry point for all TxGuard autonomous agents.
 *
 * Runs one or all agents concurrently with shared configuration.
 *
 * USAGE:
 *   node agents/index.js --all                          # Run all 3 agents concurrently
 *   node agents/index.js --agent detector               # Run only the Sharp Detector
 *   node agents/index.js --agent arena                  # Run only the Arena
 *   node agents/index.js --agent market-maker           # Run only the Market Maker
 *   node agents/index.js --all --mode live              # All agents, live TxLINE API
 *   node agents/index.js --all --mode demo --cycles 5   # Demo mode, 5 cycles then exit
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ─── Derive real wallet addresses at startup ─────────────────────────────────
// This ensures public/wallets-info.json always contains real Solana public keys
// derived from the .wallets/*.json keypair files, so the dashboard shows
// clickable Solscan links even when running in demo mode.
let solanaWeb3 = null;
try { solanaWeb3 = require('@solana/web3.js'); } catch (e) {}

function deriveAndSaveWallets() {
  const WALLET_DIR = path.join(__dirname, '..', '.wallets');
  const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'wallets-info.json');
  if (!solanaWeb3) return;

  const names = ['agent-a', 'agent-b', 'market-maker', 'simulated-client'];
  const result = {};
  for (const name of names) {
    const fp = path.join(WALLET_DIR, `${name}.json`);
    if (!fs.existsSync(fp)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (Array.isArray(raw) && raw.length === 64) {
        const kp = solanaWeb3.Keypair.fromSecretKey(Uint8Array.from(raw));
        result[name] = kp.publicKey.toBase58();
      }
    } catch (e) {}
  }
  if (Object.keys(result).length > 0) {
    try {
      const pubDir = path.join(__dirname, '..', 'public');
      if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
      console.log('  🔑 Wallet addresses derived and saved to public/wallets-info.json');
      for (const [name, addr] of Object.entries(result)) {
        console.log(`     ${name}: ${addr}`);
      }
    } catch (e) {}
  }
}

deriveAndSaveWallets();


const args = process.argv.slice(2);
const runAll = args.includes('--all');
const agentArg = args.includes('--agent') ? args[args.indexOf('--agent') + 1] : null;

// Forward remaining args to child processes
const forwardArgs = args.filter((a, i) => {
  if (a === '--all' || a === '--agent') return false;
  if (i > 0 && args[i - 1] === '--agent') return false;
  return true;
});

const AGENTS = {
  'detector': { script: 'sharp-detector.js', label: 'Sharp Movement Detector' },
  'arena':    { script: 'arena.js',          label: 'Agent vs Agent Arena' },
  'market-maker': { script: 'market-maker.js', label: 'In-Play Market Maker' },
};

/**
 * Spawns an agent process and pipes its output to the console with a colored prefix.
 * @param {string} key - Agent key
 * @param {Object} config - Agent config with script and label
 */
function launchAgent(key, config) {
  const scriptPath = path.join(__dirname, config.script);
  const child = spawn('node', [scriptPath, ...forwardArgs], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = `[${config.label}]`;

  child.stdout.on('data', (data) => {
    data.toString().split('\n').filter(l => l).forEach(line => {
      console.log(`${prefix} ${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    data.toString().split('\n').filter(l => l).forEach(line => {
      console.error(`${prefix} ❌ ${line}`);
    });
  });

  child.on('exit', (code) => {
    console.log(`${prefix} Process exited with code ${code}`);
  });

  return child;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TxGuard — Unified Autonomous Agent Runner            ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  if (runAll) {
    console.log('  🚀 Launching ALL agents concurrently...\n');
    Object.entries(AGENTS).forEach(([key, config]) => {
      console.log(`  ✅ Starting ${config.label}...`);
      launchAgent(key, config);
    });
  } else if (agentArg && AGENTS[agentArg]) {
    const config = AGENTS[agentArg];
    console.log(`  🚀 Launching ${config.label}...\n`);
    launchAgent(agentArg, config);
  } else {
    console.log('  Usage:');
    console.log('    node agents/index.js --all                    Run all agents');
    console.log('    node agents/index.js --agent detector         Run Sharp Detector');
    console.log('    node agents/index.js --agent arena            Run Arena');
    console.log('    node agents/index.js --agent market-maker     Run Market Maker');
    console.log('');
    console.log('  Options:');
    console.log('    --mode live|demo      Data source (default: demo)');
    console.log('    --cycles N            Max cycles before exit');
    console.log('    --interval N          Seconds between cycles (default: 15)');
    process.exit(0);
  }
}

main();
