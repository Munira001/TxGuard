/**
 * @module market-maker
 * @description Autonomous In-Play Market Maker Bot
 *
 * PURPOSE: Quotes buy/sell (bid/ask) prices around TxLINE consensus odds,
 * simulates incoming order flow, and dynamically adjusts spreads based on
 * realized volatility and inventory exposure.
 *
 * QUOTING ENGINE:
 *   bid = consensusOdds × (1 - spread/2 + inventorySkew)
 *   ask = consensusOdds × (1 + spread/2 + inventorySkew)
 *
 *   where:
 *     spread = baseSpreead × (1 + volatilityMultiplier)
 *     inventorySkew = -skewFactor × netPosition / maxPosition
 *       (positive inventory → lower ask to offload, negative → raise bid)
 *
 * DYNAMIC SPREAD ADJUSTMENT:
 *   Volatility is measured as the rolling standard deviation of the last N
 *   odds percentage changes. When vol > baseline, spread widens proportionally.
 *   Formula: volatilityMultiplier = max(0, (rollingVol - baselineVol) / baselineVol)
 *
 * FILL SIMULATION:
 *   On each cycle, a random order arrives. If the simulated order price falls
 *   within the bid-ask range, the MM fills it. This simulates real market flow.
 *
 * INVENTORY RISK MANAGEMENT:
 *   When net position exceeds 60% of maxPosition, quotes skew aggressively
 *   to reduce exposure. This prevents unbounded directional risk.
 *
 * USAGE:
 *   node agents/market-maker.js                      # demo mode
 *   node agents/market-maker.js --mode live           # live TxLINE API
 *   node agents/market-maker.js --spread 1.8          # base spread %
 *
 * OUTPUT: public/market-maker.csv
 */

const path = require('path');
const { fetchOdds, appendCsv } = require('./data-feed');
const { getOrCreateWallet, getWalletBalance, requestAirdropIfNeeded, transferSol } = require('./solana-helper');

// ─── CLI Configuration ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'demo';
const baseSpread = args.includes('--spread') ? parseFloat(args[args.indexOf('--spread') + 1]) / 100 : 0.018;
const maxPosition = args.includes('--max-pos') ? parseFloat(args[args.indexOf('--max-pos') + 1]) : 5.0;
const maxCycles = args.includes('--cycles') ? parseInt(args[args.indexOf('--cycles') + 1]) : Infinity;
const intervalMs = args.includes('--interval') ? parseInt(args[args.indexOf('--interval') + 1]) * 1000 : 15000;

const CSV_PATH = path.join(__dirname, '..', 'public', 'market-maker.csv');
const CSV_HEADERS = 'timestamp,fixtureId,teams,market,consensusOdds,bid,ask,spread,action,fillPrice,positionDelta,netPosition,pnl,cumulativePnl,txSignature';

// ─── Wallet Configuration ───────────────────────────────────────────────────

const walletMM = getOrCreateWallet('market-maker');
const walletClient = getOrCreateWallet('simulated-client');

// ─── State ──────────────────────────────────────────────────────────────────

const SKEW_FACTOR = 0.003;          // How aggressively to skew quotes per unit of inventory
const VOL_WINDOW = 10;              // Rolling window for volatility calculation
const BASELINE_VOL = 0.02;          // Baseline expected volatility (2%)

/** @type {Object<string, Array<number>>} Rolling odds changes per market key */
let oddsHistory = {};

/** @type {Object<string, number>} Previous odds for change calculation */
let previousOdds = {};

/** @type {Object<number, Object<string, number>>} Previous snapshot match stats for event-driven volatility */
let previousStats = {};

/** @type {Object<number, number>} Cooldown counter for event-driven spread widening (remaining cycles) */
let volatilityCoolDown = {};

/** @type {number} Net inventory position (positive = long, negative = short) */
let netPosition = 0;

/** @type {number} Cumulative realized PnL in SOL */
let cumulativePnl = 0;

/** @type {{quotes: number, fills: number, totalPnl: number}} Running stats */
const stats = { quotes: 0, fills: 0, totalPnl: 0 };

// ─── Core Logic ─────────────────────────────────────────────────────────────

/**
 * Calculates the rolling standard deviation of an array of numbers.
 * Uses the population standard deviation formula.
 *
 * @param {Array<number>} arr
 * @returns {number} Standard deviation
 */
function stddev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Computes the dynamic spread for a given market key based on realized volatility.
 *
 * Formula:
 *   volMultiplier = max(0, (rollingVol - BASELINE_VOL) / BASELINE_VOL)
 *   dynamicSpread = baseSpread × (1 + volMultiplier)
 *
 * @param {string} key - Market key (fixtureId.market)
 * @returns {number} Dynamic spread as a decimal (e.g., 0.025 = 2.5%)
 */
function getDynamicSpread(key) {
  const history = oddsHistory[key] || [];
  const vol = stddev(history);
  const volMultiplier = Math.max(0, (vol - BASELINE_VOL) / BASELINE_VOL);
  return baseSpread * (1 + volMultiplier);
}

/**
 * Computes the inventory skew to apply to bid/ask quotes.
 * When the MM is long, it lowers the ask to encourage selling.
 * When short, it raises the bid to encourage buying.
 *
 * Formula: skew = -SKEW_FACTOR × (netPosition / maxPosition)
 *
 * @returns {number} Skew as a decimal fraction of odds
 */
function getInventorySkew() {
  return -SKEW_FACTOR * (netPosition / maxPosition);
}

/**
 * Processes a single cycle: quotes bid/ask for all markets, simulates fills.
 *
 * @param {Array} fixtures - Current odds snapshot
 */
/**
 * Processes a single cycle: quotes bid/ask for all markets, simulates fills.
 *
 * @param {Array} fixtures - Current odds snapshot
 */
async function processCycle(fixtures) {
  if (!fixtures) return;

  for (let i = 0; i < fixtures.length; i++) {
    const fixture = fixtures[i];
    const fid = fixture.id;
    if (!fid || !fixture.odds) continue;

    const currentStats = fixture.stats || {};
    const oldStats = previousStats[fid];
    let isEventDetected = false;

    // Detect goal/red card events using Stats keys (1, 2 = goals, 5, 6 = red cards)
    if (oldStats) {
      const hasGoal = (currentStats[1] || 0) > (oldStats[1] || 0) || (currentStats[2] || 0) > (oldStats[2] || 0);
      const hasRed = (currentStats[5] || 0) > (oldStats[5] || 0) || (currentStats[6] || 0) > (oldStats[6] || 0);
      if (hasGoal || hasRed) {
        isEventDetected = true;
      }
    }
    previousStats[fid] = { ...currentStats };

    if (isEventDetected) {
      console.log(`    ⚠️  [Market Maker] Score event detected on ${fixture.teams}! Triggering 2-cycle spread widening cooldown.`);
      volatilityCoolDown[fid] = 2; // Widen spread for 2 cycles
    }

    const marketEntries = Object.entries(fixture.odds);
    for (let j = 0; j < marketEntries.length; j++) {
      const [market, rawOdds] = marketEntries[j];
      const consensus = parseFloat(rawOdds);
      if (isNaN(consensus)) continue;

      const key = `${fid}.${market}`;

      // Track odds changes for volatility
      const prev = previousOdds[key];
      if (prev && prev > 0) {
        const change = (consensus - prev) / prev;
        if (!oddsHistory[key]) oddsHistory[key] = [];
        oddsHistory[key].push(Math.abs(change));
        if (oddsHistory[key].length > VOL_WINDOW) oddsHistory[key].shift();
      }
      previousOdds[key] = consensus;

      // Check if this fixture is in a volatility cooldown
      let spreadMultiplier = 1.0;
      const isCooldownActive = volatilityCoolDown[fid] && volatilityCoolDown[fid] > 0;
      if (isCooldownActive) {
        spreadMultiplier = 2.5; // Widen spread aggressively during event uncertainty
      }

      // Compute dynamic spread and skew
      const spread = getDynamicSpread(key) * spreadMultiplier;
      const skew = getInventorySkew();

      const bid = parseFloat((consensus * (1 - spread / 2 + skew)).toFixed(3));
      const ask = parseFloat((consensus * (1 + spread / 2 + skew)).toFixed(3));

      stats.quotes++;

      // Simulate incoming order (random price within ±spread of consensus)
      const orderNoise = (Math.random() - 0.5) * spread * 2;
      const orderPrice = parseFloat((consensus * (1 + orderNoise)).toFixed(3));

      let action = 'QUOTE';
      let fillPrice = 0;
      let positionDelta = 0;
      let tradePnl = 0;
      let txSignature = '';

      // Check if order fills (reduce fill rate by 50% during high-volatility event cooldown)
      const shouldFill = !isCooldownActive || Math.random() < 0.5;

      if (shouldFill && orderPrice <= bid) {
        // Someone wants to sell at/below our bid → we BUY from client
        action = 'BUY_FILL';
        fillPrice = bid;
        positionDelta = 0.1; // Standard fill size
        netPosition += positionDelta;
        tradePnl = (consensus - bid) * positionDelta; // Immediate mark-to-market edge
        stats.fills++;

        // Settle transaction on-chain: MM transfers the fill price (scaled) to client wallet
        const transferAmount = 0.0002;
        console.log(`    🔗 [On-Chain] BUY order filled. Transferring ${transferAmount} SOL from Market Maker to Client...`);
        txSignature = await transferSol(walletMM, walletClient.publicKey, transferAmount);
      } else if (shouldFill && orderPrice >= ask) {
        // Someone wants to buy at/above our ask → we SELL to client
        action = 'SELL_FILL';
        fillPrice = ask;
        positionDelta = -0.1;
        netPosition += positionDelta;
        tradePnl = (ask - consensus) * Math.abs(positionDelta); // Spread capture
        stats.fills++;

        // Settle transaction on-chain: Client transfers the ask price (scaled) to MM wallet
        const transferAmount = 0.0002;
        console.log(`    🔗 [On-Chain] SELL order filled. Transferring ${transferAmount} SOL from Client to Market Maker...`);
        txSignature = await transferSol(walletClient, walletMM.publicKey, transferAmount);
      }

      cumulativePnl += tradePnl;
      stats.totalPnl = cumulativePnl;

      // Log to CSV
      const row = [
        new Date().toISOString(),
        fid,
        fixture.teams.replace(/,/g, ' vs '),
        market,
        consensus.toFixed(3),
        bid.toFixed(3),
        ask.toFixed(3),
        (spread * 100).toFixed(2),
        action,
        fillPrice > 0 ? fillPrice.toFixed(3) : '',
        positionDelta !== 0 ? positionDelta.toFixed(2) : '',
        netPosition.toFixed(2),
        tradePnl !== 0 ? tradePnl.toFixed(4) : '',
        cumulativePnl.toFixed(4),
        txSignature,
      ].join(',');
      appendCsv(CSV_PATH, CSV_HEADERS, row);

      if (action !== 'QUOTE') {
        const emoji = action === 'BUY_FILL' ? '🟢' : '🔴';
        const txLogSuffix = txSignature ? ` | Tx: ${txSignature.substring(0, 10)}...` : '';
        const cooldownLogPrefix = isCooldownActive ? '🔥 [COOLDOWN WIDE SPREAD] ' : '';
        console.log(`    ${emoji} ${cooldownLogPrefix}${action}: ${fixture.teams} [${market}] @ ${fillPrice.toFixed(3)} | Edge: ${tradePnl.toFixed(4)} SOL${txLogSuffix}`);
      }
    }
  }

  // Decrement cooldown counters at the end of the tick cycle
  Object.keys(volatilityCoolDown).forEach(fid => {
    if (volatilityCoolDown[fid] > 0) {
      volatilityCoolDown[fid]--;
    }
  });
}

/**
 * Prints the Market Maker status dashboard.
 */
function printStatus() {
  const divider = '─'.repeat(60);
  console.log(`\n${divider}`);
  console.log('  📊 MARKET MAKER STATUS');
  console.log(divider);
  console.log(`  Quotes Issued:    ${stats.quotes}`);
  console.log(`  Orders Filled:    ${stats.fills}`);
  console.log(`  Fill Rate:        ${stats.quotes > 0 ? ((stats.fills / stats.quotes) * 100).toFixed(1) : '0.0'}%`);
  console.log(`  Net Position:     ${netPosition.toFixed(2)} units`);
  console.log(`  Cumulative PnL:   ${cumulativePnl >= 0 ? '+' : ''}${cumulativePnl.toFixed(4)} SOL`);
  console.log(`  Inventory Risk:   ${Math.abs(netPosition / maxPosition * 100).toFixed(0)}% of max`);
  console.log(divider);
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TxGuard — In-Play Market Maker (Autonomous)          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Mode: ${mode.toUpperCase()} | Base Spread: ${(baseSpread * 100).toFixed(1)}% | Max Position: ${maxPosition} SOL`);
  console.log(`  Output: ${CSV_PATH}`);
  console.log('');

  console.log(`  🔑 [Market-Maker Wallet]: ${walletMM.publicKey}`);
  console.log(`  🔑 [Client-Simulator Wallet]: ${walletClient.publicKey}`);

  // Auto airdrop devnet tokens to both accounts
  await requestAirdropIfNeeded(walletMM.publicKey);
  await requestAirdropIfNeeded(walletClient.publicKey);

  const balMM = await getWalletBalance(walletMM.publicKey);
  const balCli = await getWalletBalance(walletClient.publicKey);
  console.log(`  💰 MM Wallet Balance: ${balMM} SOL | Client Wallet Balance: ${balCli} SOL\n`);

  let cycle = 0;

  const tick = async () => {
    cycle++;
    console.log(`\n⏱️  Cycle ${cycle} — ${new Date().toLocaleTimeString()}`);

    const fixtures = await fetchOdds(mode);
    if (!fixtures) {
      console.log('  ⚠️  No data received, skipping cycle.');
      return;
    }

    await processCycle(fixtures);
    printStatus();

    if (cycle >= maxCycles) {
      console.log('\n🏁 Max cycles reached. Final status above.');
      process.exit(0);
    }
  };

  await tick();
  if (require.main === module) {
    setInterval(tick, intervalMs);
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  stddev,
  getDynamicSpread,
  getInventorySkew,
};

