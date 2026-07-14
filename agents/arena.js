/**
 * @module arena
 * @description Autonomous Agent vs Agent Arena
 *
 * PURPOSE: Two competing autonomous agents read the same TxLINE odds feed
 * and execute opposite strategies. Positions settle at the next snapshot.
 * The better strategy wins over the course of the tournament.
 *
 * AGENT A — Momentum Follower (Trend):
 *   Strategy: When odds shift > threshold, take a position in the SAME direction.
 *   Rationale: Sharp money is informed; follow the smart money.
 *   Signal: If odds shorten (drop), BUY that outcome. If odds drift (rise), SELL.
 *   Math: position_size = base_stake × (changePercent / threshold)  [capped at 2× base]
 *
 * AGENT B — Mean-Reversion Contrarian:
 *   Strategy: When odds shift > threshold, take the OPPOSITE position.
 *   Rationale: Sharp moves overshoot and revert to the mean.
 *   Signal: If odds shorten, SELL that outcome. If odds drift, BUY.
 *   Math: Same position sizing as Agent A.
 *
 * SETTLEMENT:
 *   Positions settle at the next snapshot. PnL is computed as:
 *     For BUY:  pnl = position_size × (entryOdds / exitOdds - 1)
 *     For SELL: pnl = position_size × (1 - entryOdds / exitOdds)
 *   This represents standard sports betting cash-out/hedged contract payoffs.
 *
 * USAGE:
 *   node agents/arena.js                     # demo mode
 *   node agents/arena.js --mode live         # live TxLINE API
 *   node agents/arena.js --stake 0.5         # base stake in SOL
 *
 * OUTPUT: public/arena.csv, console leaderboard
 */

const path = require('path');
const { fetchOdds, appendCsv } = require('./data-feed');
const { getOrCreateWallet, getWalletBalance, requestAirdropIfNeeded, transferSol } = require('./solana-helper');

// ─── CLI Configuration ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'demo';
const baseStake = args.includes('--stake') ? parseFloat(args[args.indexOf('--stake') + 1]) : 0.5;
const threshold = args.includes('--threshold') ? parseFloat(args[args.indexOf('--threshold') + 1]) : 2.5;
const maxCycles = args.includes('--cycles') ? parseInt(args[args.indexOf('--cycles') + 1]) : Infinity;
const intervalMs = args.includes('--interval') ? parseInt(args[args.indexOf('--interval') + 1]) * 1000 : 15000;

const CSV_PATH = path.join(__dirname, '..', 'public', 'arena.csv');
const CSV_HEADERS = 'timestamp,agent,fixtureId,teams,market,action,entryOdds,exitOdds,positionSize,pnl,cumulativePnl,txSignature';

// ─── Agent State ────────────────────────────────────────────────────────────

const walletA = getOrCreateWallet('agent-a');
const walletB = getOrCreateWallet('agent-b');

/**
 * @typedef {Object} AgentState
 * @property {string} name - Agent identifier
 * @property {string} strategy - Strategy description
 * @property {Object} wallet - Persistent Solana keypair/info object
 * @property {number} balance - Current SOL balance
 * @property {number} initialBalance - Starting balance
 * @property {number} wins - Number of winning trades
 * @property {number} losses - Number of losing trades
 * @property {number} totalTrades - Total trades executed
 * @property {Array<number>} returns - Array of per-trade returns for Sharpe calculation
 * @property {Array<Object>} openPositions - Positions awaiting settlement
 */

/** @type {AgentState} */
const agentA = {
  name: 'Agent-A (Momentum)',
  strategy: 'Momentum Follower',
  wallet: walletA,
  balance: 10.0,
  initialBalance: 10.0,
  wins: 0,
  losses: 0,
  totalTrades: 0,
  returns: [],
  openPositions: [],
};

/** @type {AgentState} */
const agentB = {
  name: 'Agent-B (Contrarian)',
  strategy: 'Mean-Reversion Contrarian',
  wallet: walletB,
  balance: 10.0,
  initialBalance: 10.0,
  wins: 0,
  losses: 0,
  totalTrades: 0,
  returns: [],
  openPositions: [],
};

/** @type {Object<string, number>} Previous odds for movement detection */
let previousOdds = {};

/** @type {Object<number, Object<string, number>>} Previous snapshot match stats for event trading */
let previousStats = {};

// ─── Core Logic ─────────────────────────────────────────────────────────────

/**
 * Calculates the Sharpe ratio from an array of returns.
 * Sharpe = mean(returns) / stddev(returns) × sqrt(annualization_factor)
 * For 60s intervals: ~525,600 intervals/year, but we report raw ratio.
 *
 * @param {Array<number>} returns
 * @returns {number} Sharpe ratio (0 if insufficient data)
 */
function sharpeRatio(returns) {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  const stddev = Math.sqrt(variance);
  return stddev === 0 ? 0 : parseFloat((mean / stddev).toFixed(3));
}

/**
 * Settles open positions for an agent against the current snapshot.
 *
 * PnL formula:
 *   For BUY:  pnl = positionSize × (entryOdds / exitOdds - 1)
 *   For SELL: pnl = positionSize × (1 - entryOdds / exitOdds)
 *
 * @param {AgentState} agent
 * @param {AgentState} opponent
 * @param {Object<string, number>} currentOddsMap - key → current odds
 */
async function settlePositions(agent, opponent, currentOddsMap) {
  const settled = [];

  for (let i = 0; i < agent.openPositions.length; i++) {
    const pos = agent.openPositions[i];
    const exitOdds = currentOddsMap[pos.key];
    if (exitOdds === undefined) continue;

    const pnl = pos.positionSize * (pos.action === 'BUY'
      ? (pos.entryOdds / exitOdds - 1)
      : (1 - pos.entryOdds / exitOdds));
    const roundedPnl = parseFloat(pnl.toFixed(4));

    agent.balance += roundedPnl;
    agent.totalTrades++;
    agent.returns.push(roundedPnl / pos.positionSize); // return as fraction

    if (roundedPnl >= 0) {
      agent.wins++;
    } else {
      agent.losses++;
    }

    // Execute actual SOL settlement on devnet if agent made a profit.
    // Scale down the payout to a micro-transfer (capped at 0.001 SOL) to preserve devnet balance.
    let txSignature = '';
    if (roundedPnl > 0) {
      const settleAmount = Math.min(0.001, Math.max(0.0001, roundedPnl));
      console.log(`    🔗 [On-Chain] Settle Trade: transferring ${settleAmount} SOL from ${opponent.name} to ${agent.name}...`);
      txSignature = await transferSol(opponent.wallet, agent.wallet.publicKey, settleAmount);
    }

    const row = [
      new Date().toISOString(),
      agent.name,
      pos.fixtureId,
      pos.teams.replace(/,/g, ' vs '),
      pos.market,
      `${pos.action}→SETTLE`,
      pos.entryOdds.toFixed(3),
      exitOdds.toFixed(3),
      pos.positionSize.toFixed(4),
      roundedPnl.toFixed(4),
      agent.balance.toFixed(4),
      txSignature,
    ].join(',');
    appendCsv(CSV_PATH, CSV_HEADERS, row);

    const emoji = roundedPnl >= 0 ? '💚' : '🔴';
    const txLogSuffix = txSignature ? ` | Tx: ${txSignature.substring(0, 10)}...` : '';
    console.log(`    ${emoji} ${agent.name}: ${pos.action} ${pos.teams} [${pos.market}] → PnL: ${roundedPnl >= 0 ? '+' : ''}${roundedPnl.toFixed(4)} SOL${txLogSuffix}`);

    settled.push(pos);
  }

  agent.openPositions = agent.openPositions.filter(p => !settled.includes(p));
}

/**
 * Opens new positions for both agents based on detected movements.
 *
 * Position sizing: stake = baseStake × min(changePercent / threshold, 2.0)
 * This scales position size proportionally to signal strength, capped at 2×.
 *
 * @param {Array} fixtures - Current snapshot
 */
function openPositions(fixtures) {
  fixtures.forEach(fixture => {
    const fid = fixture.id;
    if (!fid || !fixture.odds) return;

    const currentStats = fixture.stats || {};
    const oldStats = previousStats[fid];
    let isEventCycle = false;

    // Detect if a goal or red card just occurred in this cycle
    if (oldStats) {
      const hasGoal = (currentStats[1] || 0) > (oldStats[1] || 0) || (currentStats[2] || 0) > (oldStats[2] || 0);
      const hasRed = (currentStats[5] || 0) > (oldStats[5] || 0) || (currentStats[6] || 0) > (oldStats[6] || 0);
      if (hasGoal || hasRed) {
        isEventCycle = true;
      }
    }
    previousStats[fid] = { ...currentStats };

    Object.entries(fixture.odds).forEach(([market, newOddsRaw]) => {
      const newOdds = parseFloat(newOddsRaw);
      if (isNaN(newOdds)) return;

      const key = `${fid}.${market}`;
      const oldOdds = previousOdds[key];

      if (oldOdds && oldOdds > 0) {
        const changePercent = Math.abs((newOdds - oldOdds) / oldOdds * 100);

        if (changePercent > threshold) {
          const isShortening = newOdds < oldOdds;
          // Scale size: base stake * volatility scaling * event scaling (x2 on goal/red cards)
          const multiplier = isEventCycle ? 2.0 : 1.0;
          const posSize = parseFloat((baseStake * Math.min(changePercent / threshold, 2.0) * multiplier).toFixed(4));

          // Agent A — Momentum: follow the direction
          const actionA = isShortening ? 'BUY' : 'SELL';
          agentA.openPositions.push({
            key, fixtureId: fid, teams: fixture.teams, market,
            action: actionA, entryOdds: newOdds, positionSize: posSize,
          });

          // Agent B — Contrarian: oppose the direction
          const actionB = isShortening ? 'SELL' : 'BUY';
          agentB.openPositions.push({
            key, fixtureId: fid, teams: fixture.teams, market,
            action: actionB, entryOdds: newOdds, positionSize: posSize,
          });

          const eventSuffix = isEventCycle ? ' 🔥 [EVENT SIGNAL STAKE X2]' : '';
          console.log(`    📍 ${fixture.teams} [${market}] moved ${changePercent.toFixed(1)}% → A: ${actionA} | B: ${actionB} (${posSize} SOL)${eventSuffix}`);
        }
      }

      previousOdds[key] = newOdds;
    });
  });
}

/**
 * Prints a formatted leaderboard to the console.
 */
function printLeaderboard() {
  const divider = '─'.repeat(60);
  console.log(`\n${divider}`);
  console.log('  🏆 ARENA LEADERBOARD');
  console.log(divider);

  [agentA, agentB].forEach(agent => {
    const pnl = agent.balance - agent.initialBalance;
    const winRate = agent.totalTrades > 0 ? ((agent.wins / agent.totalTrades) * 100).toFixed(1) : '0.0';
    const sharpe = sharpeRatio(agent.returns);
    const emoji = pnl >= 0 ? '🟢' : '🔴';

    console.log(`  ${emoji} ${agent.name}`);
    console.log(`     Balance: ${agent.balance.toFixed(4)} SOL (${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)})`);
    console.log(`     Trades: ${agent.totalTrades} | Win Rate: ${winRate}% | Sharpe: ${sharpe}`);
  });

  const leader = agentA.balance >= agentB.balance ? agentA : agentB;
  console.log(`\n  👑 Leading: ${leader.name}`);
  console.log(divider);
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TxGuard — Agent vs Agent Arena (Autonomous)          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Mode: ${mode.toUpperCase()} | Threshold: ${threshold}% | Stake: ${baseStake} SOL`);
  console.log(`  Agent A: ${agentA.strategy} | Agent B: ${agentB.strategy}`);
  console.log(`  Output: ${CSV_PATH}`);
  console.log('');

  console.log(`  🔑 [Agent-A Wallet]: ${agentA.wallet.publicKey}`);
  console.log(`  🔑 [Agent-B Wallet]: ${agentB.wallet.publicKey}`);
  
  // Try to fund wallets on Devnet if airdrop is needed
  await requestAirdropIfNeeded(agentA.wallet.publicKey);
  await requestAirdropIfNeeded(agentB.wallet.publicKey);

  const balA = await getWalletBalance(agentA.wallet.publicKey);
  const balB = await getWalletBalance(agentB.wallet.publicKey);
  console.log(`  💰 Agent-A Balance: ${balA} SOL | Agent-B Balance: ${balB} SOL\n`);

  let cycle = 0;

  const tick = async () => {
    cycle++;
    console.log(`\n⏱️  Round ${cycle} — ${new Date().toLocaleTimeString()}`);

    const fixtures = await fetchOdds(mode);
    if (!fixtures) {
      console.log('  ⚠️  No data received, skipping round.');
      return;
    }

    // Build current odds map for settlement
    const currentOddsMap = {};
    fixtures.forEach(f => {
      Object.entries(f.odds).forEach(([m, v]) => {
        currentOddsMap[`${f.id}.${m}`] = parseFloat(v);
      });
    });

    // 1. Settle any open positions from previous round
    await settlePositions(agentA, agentB, currentOddsMap);
    await settlePositions(agentB, agentA, currentOddsMap);

    // 2. Open new positions based on current movements
    openPositions(fixtures);

    // 3. Print leaderboard
    printLeaderboard();

    if (cycle >= maxCycles) {
      console.log('\n🏁 Tournament complete. Final standings above.');
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
  sharpeRatio,
};


